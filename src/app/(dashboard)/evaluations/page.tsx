import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { eq, desc } from "drizzle-orm";
import { evaluations, employees } from "@/lib/schema";
import { PerformanceClient } from "@/components/performance/PerformanceClient";

export default async function EvaluationsPage() {
  const session = await auth();
  if (!session) redirect("/auth/login");

  const userRole = (session.user as any)?.role || "EMPLOYE";

  const evsRaw = await db
    .select({
      id: evaluations.id,
      period: evaluations.period,
      type: evaluations.type,
      globalScore: evaluations.globalScore,
      overallScore: evaluations.globalScore,
      status: evaluations.status,
      createdAt: evaluations.createdAt,
      employeeId: evaluations.employeeId,
      employeeFirstName: employees.firstName,
      employeeLastName: employees.lastName,
    })
    .from(evaluations)
    .leftJoin(employees, eq(evaluations.employeeId, employees.id))
    .orderBy(desc(evaluations.createdAt))
    .limit(50);

  const evs = evsRaw.map(ev => ({
    ...ev,
    status: ev.status || "BROUILLON",
    createdAt: ev.createdAt || new Date(),
  }));

  const emps = await db
    .select({ id: employees.id, firstName: employees.firstName, lastName: employees.lastName })
    .from(employees)
    .where(eq(employees.isActive, true)) as { id: string; firstName: string; lastName: string }[];

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
