import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { jobPostings, departments } from "@/lib/schema";
import RecruitmentClient from "@/components/recruitment/RecruitmentClient";

export const metadata = { title: "Recrutement | AMSODE RH" };

async function getData() {
  const rawJobs = await db.select().from(jobPostings);
  const depts = await db.select().from(departments);
  const deptMap = new Map(depts.map(d => [d.id, d.name]));
  const jobs = rawJobs.map(job => ({
    ...job,
    status: job.status || "OUVERT",
    createdAt: job.createdAt || new Date(),
    departmentName: job.departmentId ? deptMap.get(job.departmentId) || null : null,
  }));
  return { jobs, departments: depts };
}

export default async function RecruitmentPage() {
  const { jobs, departments: depts } = await getData();
  return (
    <RecruitmentClient 
      postings={jobs}
      departments={depts}
    />
  );
}
