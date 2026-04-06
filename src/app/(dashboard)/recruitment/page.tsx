import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { jobPostings, departments } from "@/lib/schema";
import dynamic from "next/dynamic";

const RecruitmentClient = dynamic(() => import("@/components/recruitment/RecruitmentClient"), {
  loading: () => <div className="p-6"><div className="animate-pulse space-y-4"><div className="h-32 bg-gray-200 rounded"></div><div className="h-64 bg-gray-200 rounded"></div></div></div>,
  ssr: false,
});

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
