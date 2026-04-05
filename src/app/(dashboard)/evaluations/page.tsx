import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { eq, desc } from "drizzle-orm";
import { evaluations, employees } from "@/lib/schema";
import { PerformanceClient } from "@/components/performance/PerformanceClient";

export default async function EvaluationsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login");

  const userRole = (session.user as any)?.role || "EMPLOYEE";

  const evs = await db
    .select({
      id: evaluations.id,
      period: evaluations.period,
      type: evaluations.type,
      overallScore: evaluations.overallScore,
      status: evaluations.status,
      createdAt: evaluations.createdAt,
      employeeFirstName: employees.firstName,
      employeeLastName: employees.lastName,
    })
    .from(evaluations)
    .leftJoin(employees, eq(evaluations.employeeId, employees.id))
    .orderBy(desc(evaluations.createdAt))
    .limit(50);

  const emps = await db
    .select({ id: employees.id, firstName: employees.firstName, lastName: employees.lastName })
    .from(employees)
    .where(eq(employees.isActive, true));

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Évaluations</h1>
        <p className="text-sm text-gray-500 mt-1">Suivi des performances des membres</p>
      </div>
      <PerformanceClient evaluations={evs} employees={emps} />
    </div>
  );
}
