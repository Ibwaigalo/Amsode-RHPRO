import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { employees, leaveRequests, users, departments } from '@/lib/schema';
import { eq, count, or, and, sql, sum } from 'drizzle-orm';
import DashboardClient from '../../../components/dashboard/DashboardClient';
import dynamic from 'next/dynamic';

const DashboardCharts = dynamic(
  () => import('../../../components/dashboard/DashboardCharts'),
  {
    loading: () => (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5 h-64 animate-pulse" />
        ))}
      </div>
    ),
    ssr: false,
  }
);

export const metadata = { title: 'Tableau de bord' };

async function getDashboardStats() {
  try {
    const [empCount] = await db.select({ count: count() }).from(employees).where(eq(employees.isActive, true));
    const [leaveCount] = await db.select({ count: count() }).from(leaveRequests).where(
      or(
        eq(leaveRequests.status, 'PENDING'),
        eq(leaveRequests.status, 'PENDING_PRESIDENT'),
        eq(leaveRequests.status, 'PENDING_RH')
      )
    );

    const salaryByDept = await db.select({
      name: departments.name,
      total: sum(employees.baseSalary),
    })
      .from(departments)
      .leftJoin(employees, eq(employees.departmentId, departments.id))
      .groupBy(departments.id, departments.name);

    const deptEmployees = await db.select({
      name: departments.name,
      count: count(employees.id),
    })
      .from(departments)
      .leftJoin(employees, eq(employees.departmentId, departments.id))
      .where(eq(employees.isActive, true))
      .groupBy(departments.id, departments.name);

    const totalMassResult = await db.select({
      total: sum(employees.baseSalary),
    }).from(employees).where(eq(employees.isActive, true));

    return {
      activeEmployees: empCount.count,
      pendingLeaves: leaveCount.count,
      salaryByDept: salaryByDept
        .filter(d => d.name && d.total)
        .map(d => ({ dept: d.name!, masse: Number(d.total) })),
      deptEmployees: deptEmployees
        .filter(d => d.name && d.count)
        .map(d => ({ dept: d.name!, count: Number(d.count) })),
      totalMass: Number(totalMassResult[0]?.total || 0),
    };
  } catch (e: any) {
    console.error("Dashboard stats error:", e);
    return { activeEmployees: 0, pendingLeaves: 0, salaryByDept: [], deptEmployees: [], totalMass: 0 };
  }
}

async function getEmployeeStats(employeeId: string) {
  try {
    const myLeaves = await db.select({ count: count() }).from(leaveRequests).where(eq(leaveRequests.employeeId, employeeId));
    return { myLeaves: myLeaves[0]?.count || 0 };
  } catch {
    return { myLeaves: 0 };
  }
}

async function getManagerStats(managerId: string) {
  try {
    const teamCount = await db.select({ count: count() }).from(employees).where(eq(employees.managerId, managerId));
    const teamLeaves = await db.select({ count: count() }).from(leaveRequests).where(
      and(
        eq(leaveRequests.employeeId, managerId),
        or(
          eq(leaveRequests.status, 'PENDING'),
          eq(leaveRequests.status, 'PENDING_PRESIDENT'),
          eq(leaveRequests.status, 'PENDING_RH')
        )
      )
    );
    return { 
      teamCount: teamCount[0]?.count || 0,
      teamLeaves: teamLeaves[0]?.count || 0
    };
  } catch {
    return { teamCount: 0, teamLeaves: 0 };
  }
}

export default async function DashboardPage() {
  const session = await auth();
  const role = (session?.user as any)?.role;
  const userId = (session?.user as any)?.id;
  
  let stats: any = {};
  let userStats: any = {};

  if (role === 'EMPLOYE' || role === 'MANAGER') {
    const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
    if (user?.employeeId) {
      if (role === 'MANAGER') {
        userStats = await getManagerStats(user.employeeId);
        stats = { ...userStats, activeEmployees: userStats.teamCount, pendingLeaves: userStats.teamLeaves };
      } else {
        userStats = await getEmployeeStats(user.employeeId);
        stats = { activeEmployees: 1, pendingLeaves: 0, myLeaves: userStats.myLeaves };
      }
    }
  } else {
    stats = await getDashboardStats();
  }

  return <DashboardClient stats={stats} user={session?.user} role={role} chartsData={stats.salaryByDept ? {
    salaryByDept: stats.salaryByDept,
    deptEmployees: stats.deptEmployees,
    totalMass: stats.totalMass,
  } : undefined} />;
}
