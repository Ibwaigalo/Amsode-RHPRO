import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { leaveRequests, employees } from "@/lib/schema";
import { eq } from "drizzle-orm";
import LeavesClient from "@/components/leaves/LeavesClient";

export const metadata = { title: "Congés | AMSODE RH" };

async function getData() {
  const leaves = await db.select().from(leaveRequests);
  const emps = await db.select({ id: employees.id, firstName: employees.firstName, lastName: employees.lastName }).from(employees);
  return { leaves, employees: emps };
}

export default async function LeavesPage() {
  const session = await auth();
  const { leaves, employees: emps } = await getData();
  const empMap = new Map(emps.map(e => [e.id, e]));
  const requests = leaves.map((l) => {
    const emp = empMap.get(l.employeeId);
    return {
      ...l,
      employeeName: emp?.firstName || null,
      employeeLastName: emp?.lastName || null,
    };
  });
  return (
    <LeavesClient 
      requests={requests} 
      balances={[]}
      userRole={(session?.user as any)?.role || "EMPLOYEE"}
    />
  );
}
