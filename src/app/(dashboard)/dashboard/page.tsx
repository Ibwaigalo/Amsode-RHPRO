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
      total: sql<number>`COALESCE(SUM(${employees.baseSalary})::numeric, 0)`,
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
      total: sql<number>`COALESCE(SUM(${employees.baseSalary})::numeric, 0)`,
    }).from(employees).where(eq(employees.isActive, true));

    const contractTypes = await db.select({
      type: employees.contractType,
      count: count(),
    })
      .from(employees)
      .where(eq(employees.isActive, true))
      .groupBy(employees.contractType);

    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);
    
    const leavesByMonth = await db.select({
      month: sql<number>`EXTRACT(MONTH FROM ${leaveRequests.startDate})`,
      year: sql<number>`EXTRACT(YEAR FROM ${leaveRequests.startDate})`,
      leaveType: leaveRequests.leaveType,
      days: sum(leaveRequests.daysCount),
    })
      .from(leaveRequests)
      .where(sql`${leaveRequests.startDate} >= ${sixMonthsAgo.toISOString()}`)
      .groupBy(
        sql`EXTRACT(MONTH FROM ${leaveRequests.startDate})`,
        sql`EXTRACT(YEAR FROM ${leaveRequests.startDate})`,
        leaveRequests.leaveType
      );

    const leavesByMonthFormatted: Record<string, { paie: number; maladie: number; autres: number }> = {};
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
    
    leavesByMonth.forEach(l => {
      const key = `${months[Number(l.month) - 1]}`;
      if (!leavesByMonthFormatted[key]) {
        leavesByMonthFormatted[key] = { paie: 0, maladie: 0, autres: 0 };
      }
      if (l.leaveType === 'CONGE_PAYE') leavesByMonthFormatted[key].paie += Number(l.days);
      else if (l.leaveType === 'MALADIE') leavesByMonthFormatted[key].maladie += Number(l.days);
      else leavesByMonthFormatted[key].autres += Number(l.days);
    });

    const monthlyLeaves = months.slice(-6).map(m => ({
      month: m,
      paie: leavesByMonthFormatted[m]?.paie || 0,
      maladie: leavesByMonthFormatted[m]?.maladie || 0,
      autres: leavesByMonthFormatted[m]?.autres || 0,
    }));

    const employeeCountByMonth = await db.select({
      month: sql<number>`EXTRACT(MONTH FROM ${employees.hireDate})`,
      year: sql<number>`EXTRACT(YEAR FROM ${employees.hireDate})`,
      count: count(),
    })
      .from(employees)
      .where(sql`${employees.hireDate} >= ${sixMonthsAgo.toISOString()}`)
      .groupBy(
        sql`EXTRACT(MONTH FROM ${employees.hireDate})`,
        sql`EXTRACT(YEAR FROM ${employees.hireDate})`
      );

    const currentCount = Number(empCount.count);
    const monthlyHeadcount = months.slice(-6).map((m, i) => {
      const monthIdx = (now.getMonth() - 5 + i + 12) % 12 + 1;
      const year = now.getMonth() - 5 + i < 0 ? now.getFullYear() - 1 : now.getFullYear();
      const hiredInMonth = employeeCountByMonth.find(l => Number(l.month) === monthIdx && Number(l.year) === year);
      const count = hiredInMonth ? currentCount - (Number(hiredInMonth.count) - 1) : currentCount;
      return {
        month: m,
        effectif: Math.max(count, 1),
        recrutements: hiredInMonth ? Number(hiredInMonth.count) : 0,
        departs: 0,
      };
    });

    return {
      activeEmployees: empCount.count,
      pendingLeaves: leaveCount.count,
      salaryByDept: salaryByDept
        .filter(d => d.name !== null)
        .map(d => ({ dept: d.name!, masse: d.total })),
      deptEmployees: deptEmployees
        .filter(d => d.name !== null)
        .map(d => ({ dept: d.name!, count: Number(d.count) })),
      totalMass: totalMassResult[0]?.total || 0,
      contractTypes: contractTypes
        .filter(c => c.type)
        .map(c => ({ name: c.type!, value: Number(c.count) })),
      monthlyHeadcount,
      monthlyLeaves,
    };
  } catch (e: any) {
    console.error("Dashboard stats error:", e);
    return { activeEmployees: 0, pendingLeaves: 0, salaryByDept: [], deptEmployees: [], totalMass: 0, contractTypes: [], monthlyHeadcount: [], monthlyLeaves: [] };
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
    contractTypes: stats.contractTypes,
    monthlyHeadcount: stats.monthlyHeadcount,
    monthlyLeaves: stats.monthlyLeaves,
  } : undefined} />;
}
