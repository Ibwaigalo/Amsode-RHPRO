import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { employees, leaveRequests, jobPostings, evaluations } from '@/lib/schema';
import { eq, count, sql } from 'drizzle-orm';
import DashboardClient from '../../../components/dashboard/DashboardClient';

export const metadata = { title: 'Tableau de bord' };

async function getDashboardStats() {
  try {
    const [empCount] = await db.select({ count: count() }).from(employees).where(eq(employees.isActive, true));
    const [leaveCount] = await db.select({ count: count() }).from(leaveRequests).where(eq(leaveRequests.status, 'EN_ATTENTE'));
    const [jobCount] = await db.select({ count: count() }).from(jobPostings).where(eq(jobPostings.status, 'OUVERT'));
    const [evalCount] = await db.select({ count: count() }).from(evaluations).where(eq(evaluations.status, 'EN_COURS'));
    return {
      activeEmployees: empCount.count,
      pendingLeaves: leaveCount.count,
      openJobs: jobCount.count,
      pendingEvals: evalCount.count,
    };
  } catch {
    return { activeEmployees: 0, pendingLeaves: 0, openJobs: 0, pendingEvals: 0 };
  }
}

export default async function DashboardPage() {
  const session = await auth();
  const stats = await getDashboardStats();
  return <DashboardClient stats={stats} user={session?.user} />;
}
