// src/app/api/payroll/[periodId]/payslip/[employeeId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { payslips, employees, departments, positions, payrollPeriods, orgSettings } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { generatePayslipPDF } from "@/lib/pdf-generator";

export async function GET(
  req: NextRequest,
  { params }: { params: { periodId: string; employeeId: string } }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const [payslip] = await db
    .select({
      id: payslips.id,
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
      month: payrollPeriods.month,
      year: payrollPeriods.year,
      firstName: employees.firstName,
      lastName: employees.lastName,
      employeeNumber: employees.employeeNumber,
      contractType: employees.contractType,
      departmentName: departments.name,
      positionTitle: positions.title,
    })
    .from(payslips)
    .innerJoin(payrollPeriods, eq(payslips.periodId, payrollPeriods.id))
    .innerJoin(employees, eq(payslips.employeeId, employees.id))
    .leftJoin(departments, eq(employees.departmentId, departments.id))
    .leftJoin(positions, eq(employees.positionId, positions.id))
    .where(and(
      eq(payslips.periodId, params.periodId),
      eq(payslips.employeeId, params.employeeId),
    ));

  if (!payslip) return NextResponse.json({ error: "Bulletin introuvable" }, { status: 404 });

  const orgSettingsRecords = await db.select().from(orgSettings).limit(1);
  const orgMap: Record<string, string> = {};
  orgSettingsRecords.forEach((s) => {
    if (s.key && s.value) orgMap[s.key] = s.value;
  });

  const pdfBytes = await generatePayslipPDF({
    employee: {
      name: `${payslip.firstName} ${payslip.lastName}`,
      position: payslip.positionTitle || "—",
      department: payslip.departmentName || "—",
      employeeNumber: payslip.employeeNumber || "",
      contractType: payslip.contractType || "CDI",
    },
    period: { month: payslip.month, year: payslip.year },
    payroll: {
      baseSalary: parseFloat(payslip.baseSalary as string),
      transportAllowance: parseFloat((payslip.transportAllowance as string) || "0"),
      housingAllowance: parseFloat((payslip.housingAllowance as string) || "0"),
      performanceBonus: parseFloat((payslip.performanceBonus as string) || "0"),
      otherAllowances: parseFloat((payslip.otherBonuses as string) || "0"),
      grossSalary: parseFloat(payslip.grossSalary as string),
      cnssEmployee: parseFloat((payslip.cnssEmployee as string) || "0"),
      incomeTax: parseFloat((payslip.imuEmployee as string) || "0"),
      totalDeductions: parseFloat((payslip.otherDeductions as string) || "0"),
      netSalary: parseFloat(payslip.netSalary as string),
    },
    organization: {
      name: orgMap["org_name"] || "AMSODE",
      address: orgMap["org_address"] || undefined,
      cnssNumber: orgMap["cnss_number"] || undefined,
      presidentName: orgMap["president_name"] || undefined,
    },
  });

  return new Response(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="bulletin-${payslip.employeeNumber}-${payslip.month}-${payslip.year}.pdf"`,
    },
  });
}