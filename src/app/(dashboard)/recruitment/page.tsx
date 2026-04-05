import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { jobPostings, departments } from "@/lib/schema";
import RecruitmentClient from "@/components/recruitment/RecruitmentClient";

export const metadata = { title: "Recrutement | AMSODE RH" };

async function getData() {
  const jobs = await db.select().from(jobPostings);
  const depts = await db.select().from(departments);
  return { jobs, departments: depts };
}

export default async function RecruitmentPage() {
  const session = await auth();
  const { jobs, departments: depts } = await getData();
  return (
    <RecruitmentClient 
      postings={jobs}
      departments={depts}
      userRole={(session?.user as any)?.role || "EMPLOYEE"}
    />
  );
}
