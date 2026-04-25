import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { employees, leaveRequests } from "@/lib/schema";
import { eq, and, isNull, or, isNotNull } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Non autorización" }, { status: 401 });

    const role = (session.user as any)?.role;
    if (!["ADMIN_RH", "PRESIDENT", "MANAGER"].includes(role)) {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    const today = new Date().toISOString().split("T")[0];
    
    const employeesWithLeaveDates = await db
      .select()
      .from(employees)
      .where(
        and(
          isNotNull(employees.leaveStartDate),
          isNotNull(employees.leaveEndDate)
        )
      );

    const startedEmployees: string[] = [];
    const endedEmployees: string[] = [];

    for (const emp of employeesWithLeaveDates) {
      const leaveStart = emp.leaveStartDate;
      const leaveEnd = emp.leaveEndDate;
      
      if (!leaveStart || !leaveEnd) continue;
      
      const startDate = new Date(leaveStart).toISOString().split("T")[0];
      const endDate = new Date(leaveEnd).toISOString().split("T")[0];
      
      if (startDate <= today && emp.workStatus !== "EN_CONGE") {
        await db
          .update(employees)
          .set({ 
            workStatus: "EN_CONGE",
            statusDate: new Date(),
            updatedAt: new Date()
          })
          .where(eq(employees.id, emp.id));
        
        startedEmployees.push(`${emp.firstName} ${emp.lastName}`);
      }
      
      if (today > endDate && emp.workStatus === "EN_CONGE") {
        await db
          .update(employees)
          .set({ 
            workStatus: "ACTIVE",
            leaveStartDate: null,
            leaveEndDate: null,
            updatedAt: new Date()
          })
          .where(eq(employees.id, emp.id));
        
        endedEmployees.push(`${emp.firstName} ${emp.lastName}`);
      }
    }

    return NextResponse.json({
      success: true,
      checked: employeesWithLeaveDates.length,
      started: startedEmployees.length,
      ended: endedEmployees.length,
      startedEmployees,
      endedEmployees,
    });
  } catch (error) {
    console.error("Check expired leaves error:", error);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}