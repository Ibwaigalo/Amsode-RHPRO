import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { employees, leaveRequests } from "@/lib/schema";
import { eq, and, lte, isNull, or } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const role = (session.user as any)?.role;
    if (!["ADMIN_RH", "PRESIDENT", "MANAGER"].includes(role)) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const today = new Date().toISOString().split("T")[0];
    
    const employeesOnLeave = await db
      .select()
      .from(employees)
      .where(eq(employees.workStatus, "EN_CONGE"));

    const updatedEmployees: string[] = [];

    for (const emp of employeesOnLeave) {
      const approvedLeave = await db.query.leaveRequests.findFirst({
        where: and(
          eq(leaveRequests.employeeId, emp.id),
          eq(leaveRequests.status, "APPROVED" as any)
        ),
        orderBy: (leaveRequests, { desc }) => [desc(leaveRequests.endDate)],
      });

      if (approvedLeave && approvedLeave.endDate) {
        const endDate = new Date(approvedLeave.endDate).toISOString().split("T")[0];
        
        if (endDate < today) {
          await db
            .update(employees)
            .set({ 
              workStatus: "ACTIVE",
              updatedAt: new Date()
            })
            .where(eq(employees.id, emp.id));
          
          updatedEmployees.push(`${emp.firstName} ${emp.lastName}`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      checked: employeesOnLeave.length,
      updated: updatedEmployees.length,
      updatedEmployees,
    });
  } catch (error) {
    console.error("Check expired leaves error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
