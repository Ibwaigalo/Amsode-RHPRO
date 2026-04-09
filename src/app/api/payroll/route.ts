// src/app/api/payroll/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { payrollPeriods, payslips, employees, departments, positions } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { calculatePayroll } from "@/lib/payroll-engine";
import { generatePayslipPDF } from "@/lib/pdf-generator";
import { z } from "zod";

const periodSchema = z.object({
  month: z.number().min(1).max(12),
  year: z.number().min(2020).max(2099),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const role = (session.user as any).role;
  if (!["ADMIN_RH", "PRESIDENT"].includes(role)) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const periods = await db.select().from(payrollPeriods).orderBy(payrollPeriods.year, payrollPeriods.month);
  return NextResponse.json(periods);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const role = (session.user as any).role;
  if (role !== "ADMIN_RH") return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const body = await req.json();
  const parsed = periodSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { month, year } = parsed.data;

  // Check for existing period
  const existing = await db.query.payrollPeriods.findFirst({
    where: and(eq(payrollPeriods.month, month), eq(payrollPeriods.year, year)),
  });
  if (existing) return NextResponse.json({ error: "Cette période de paie existe déjà" }, { status: 409 });

  // Create period
  const [period] = await db.insert(payrollPeriods).values({ month, year, status: "DRAFT" }).returning();

  // Get all active employees
  const empList = await db
    .select({
      id: employees.id,
      baseSalary: employees.baseSalary,
      firstName: employees.firstName,
      lastName: employees.lastName,
    })
    .from(employees)
    .where(eq(employees.isActive, true));

  // Calculate payroll for each employee
  let totalGross = 0;
  let totalNet = 0;

  for (const emp of empList) {
    const calc = calculatePayroll({ baseSalary: parseFloat(emp.baseSalary) });
    totalGross += calc.grossSalary;
    totalNet += calc.netSalary;

    await db.insert(payslips).values({
      periodId: period.id,
      employeeId: emp.id,
      baseSalary: String(calc.baseSalary),
      transportAllowance: "0",
      housingAllowance: "0",
      performanceBonus: "0",
      otherBonuses: "0",
      grossSalary: String(calc.grossSalary),
      cnssEmployee: String(calc.cnssEmployee),
      cnssEmployer: String(calc.cnssEmployer),
      imuEmployee: "0",
      advanceDeduction: "0",
      otherDeductions: String(calc.totalDeductions),
      netSalary: String(calc.netSalary),
    });
  }

  // Update period totals
  await db.update(payrollPeriods)
    .set({ totalGross: String(totalGross), totalNet: String(totalNet) })
    .where(eq(payrollPeriods.id, period.id));

  return NextResponse.json({ ...period, totalGross, totalNet, count: empList.length }, { status: 201 });
}
