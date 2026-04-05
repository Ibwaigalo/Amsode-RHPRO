// src/app/api/recruitment/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { jobPostings } from "../../../../db/schema";
import { z } from "zod";

const schema = z.object({
  title: z.string().min(3),
  departmentId: z.string().uuid().optional(),
  contractType: z.enum(["CDI", "CDD", "STAGE", "CONSULTANT"]).optional(),
  description: z.string().min(20),
  requirements: z.string().optional(),
  location: z.string().optional(),
  salaryMin: z.string().optional(),
  salaryMax: z.string().optional(),
  deadline: z.string().optional(),
});

export async function GET() {
  const postings = await db.select().from(jobPostings);
  return NextResponse.json(postings);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const role = (session.user as any).role;
  if (!["ADMIN_RH", "MANAGER"].includes(role)) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const [posting] = await db.insert(jobPostings).values({
    ...parsed.data,
    createdById: (session.user as any).id,
    status: "OPEN",
  }).returning();

  return NextResponse.json(posting, { status: 201 });
}
