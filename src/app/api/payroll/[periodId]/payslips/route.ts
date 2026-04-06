// src/app/api/payroll/[periodId]/payslips/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { payslips, employees } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest, { params }: { params: Promise<{ periodId: string }> }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const { periodId } = await params;

    const results = await db
      .select({
        id: payslips.id,
        employeeId: payslips.employeeId,
        baseSalary: payslips.baseSalary,
        transportAllowance: payslips.transportAllowance,
        housingAllowance: payslips.housingAllowance,
        mealAllowance: payslips.mealAllowance,
        performanceBonus: payslips.performanceBonus,
        otherBonuses: payslips.otherBonuses,
        grossSalary: payslips.grossSalary,
        cnssEmployee: payslips.cnssEmployee,
        cnssEmployer: payslips.cnssEmployer,
        imuEmployee: payslips.imuEmployee,
        advanceDeduction: payslips.advanceDeduction,
        otherDeductions: payslips.otherDeductions,
        netSalary: payslips.netSalary,
        isEmailSent: payslips.isEmailSent,
        firstName: employees.firstName,
        lastName: employees.lastName,
        employeeNumber: employees.employeeNumber,
      })
      .from(payslips)
      .innerJoin(employees, eq(payslips.employeeId, employees.id))
      .where(eq(payslips.periodId, periodId));

    return NextResponse.json(results);
  } catch (error) {
    console.error("Error fetching payslips:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
