// src/app/api/contracts/expiring/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { employees, departments } from "@/lib/schema";
import { eq, and, isNotNull, lte, gte, sql } from "drizzle-orm";
import { desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const role = (session.user as any).role;
  if (role !== "ADMIN_RH" && role !== "PRESIDENT") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const days = parseInt(searchParams.get("days") || "30", 10);
  const limit = parseInt(searchParams.get("limit") || "10", 10);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const futureDate = new Date(today);
  futureDate.setDate(futureDate.getDate() + days);

  const result = await db
    .select({
      id: employees.id,
      employeeNumber: employees.employeeNumber,
      firstName: employees.firstName,
      lastName: employees.lastName,
      contractType: employees.contractType,
      startDate: employees.startDate,
      endDate: employees.endDate,
      departmentId: employees.departmentId,
      isActive: employees.isActive,
    })
    .from(employees)
    .leftJoin(departments, eq(employees.departmentId, departments.id))
    .where(
      and(
        isNotNull(employees.endDate),
        eq(employees.isActive, true),
        gte(employees.endDate, today.toISOString().split("T")[0]),
        lte(employees.endDate, futureDate.toISOString().split("T")[0])
      )
    )
    .orderBy(employees.endDate)
    .limit(limit);

  const contractsWithDays = result.map((emp) => {
    const endDate = new Date(emp.endDate!);
    const diffTime = endDate.getTime() - today.getTime();
    const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return {
      ...emp,
      daysRemaining,
    };
  });

  return NextResponse.json({
    contracts: contractsWithDays,
    count: contractsWithDays.length,
    daysThreshold: days,
  });
}