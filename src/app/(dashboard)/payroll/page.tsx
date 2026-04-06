import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { payrollPeriods, employees } from "@/lib/schema";
import PayrollClient from "@/components/payroll/PayrollClient";

export const metadata = { title: "Paie | AMSODE RH" };

async function getData() {
  const rawPeriods = await db.select().from(payrollPeriods);
  const periods = rawPeriods.map(p => ({
    ...p,
    status: p.status || "BROUILLON",
    createdAt: p.createdAt || new Date(),
  }));
  const employeesList = await db.select().from(employees);
  return { periods, employeeCount: employeesList.length };
}

export default async function PayrollPage() {
  const session = await auth();
  const { periods, employeeCount } = await getData();
  return (
    <PayrollClient 
      periods={periods}
      employeeCount={employeeCount}
    />
  );
}
