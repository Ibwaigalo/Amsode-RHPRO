// src/app/api/payroll/[periodId]/payslip/[employeeId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { payslips, employees, departments, positions, payrollPeriods, organizationSettings } from "../../../../../../db/schema";
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
      performanceBonus: payslips.performanceBonus,
      otherAllowances: payslips.otherAllowances,
      grossSalary: payslips.grossSalary,
      cnssEmployee: payslips.cnssEmployee,
      incomeTax: payslips.incomeTax,
      totalDeductions: payslips.totalDeductions,
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

  const [orgSettings] = await db.select().from(organizationSettings).limit(1);

  const pdfBytes = await generatePayslipPDF({
    employee: {
      name: `${payslip.firstName} ${payslip.lastName}`,
      position: payslip.positionTitle || "—",
      department: payslip.departmentName || "—",
      employeeNumber: payslip.employeeNumber,
      contractType: payslip.contractType,
    },
    period: { month: payslip.month, year: payslip.year },
    payroll: {
      baseSalary: parseFloat(payslip.baseSalary),
      transportAllowance: parseFloat(payslip.transportAllowance || "0"),
      housingAllowance: parseFloat(payslip.housingAllowance || "0"),
      performanceBonus: parseFloat(payslip.performanceBonus || "0"),
      otherAllowances: parseFloat(payslip.otherAllowances || "0"),
      grossSalary: parseFloat(payslip.grossSalary),
      cnssEmployee: parseFloat(payslip.cnssEmployee || "0"),
      incomeTax: parseFloat(payslip.incomeTax || "0"),
      totalDeductions: parseFloat(payslip.totalDeductions),
      netSalary: parseFloat(payslip.netSalary),
    },
    organization: {
      name: orgSettings?.name || "AMSODE",
      address: orgSettings?.address || undefined,
      cnssNumber: orgSettings?.cnssNumber || undefined,
      presidentName: orgSettings?.presidentName || undefined,
    },
  });

  return new NextResponse(pdfBytes, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="bulletin-${payslip.employeeNumber}-${payslip.month}-${payslip.year}.pdf"`,
    },
  });
}
