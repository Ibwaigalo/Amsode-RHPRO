import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { payrollPeriods, employees } from "@/lib/schema";
import PayrollClient from "@/components/payroll/PayrollClient";

export const metadata = { title: "Paie | AMSODE RH" };

async function getData() {
  const periods = await db.select().from(payrollPeriods);
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
      userRole={(session?.user as any)?.role || "EMPLOYEE"}
    />
  );
}
