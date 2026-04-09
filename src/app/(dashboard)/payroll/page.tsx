import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { payrollPeriods, employees } from "@/lib/schema";
import dynamic from "next/dynamic";

const PayrollClient = dynamic(() => import("@/components/payroll/PayrollClient"), {
  loading: () => <div className="p-6"><div className="animate-pulse space-y-4"><div className="h-32 bg-gray-200 rounded"></div><div className="h-64 bg-gray-200 rounded"></div></div></div>,
  ssr: false,
});

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
