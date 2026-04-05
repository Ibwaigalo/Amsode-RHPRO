// src/app/api/performance/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { evaluations } from "../../../../db/schema";
import { z } from "zod";

const schema = z.object({
  employeeId: z.string().uuid(),
  period: z.string().min(3),
  type: z.string().default("ANNUAL"),
  scores: z.record(z.number()),
  overallScore: z.string(),
  strengths: z.string(),
  improvements: z.string(),
  goals: z.array(z.any()).optional().default([]),
});

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const list = await db.select().from(evaluations);
  return NextResponse.json(list);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const [evaluation] = await db.insert(evaluations).values({
    employeeId: parsed.data.employeeId,
    evaluatorId: (session.user as any).id,
    period: parsed.data.period,
    type: parsed.data.type,
    scores: parsed.data.scores,
    overallScore: parsed.data.overallScore,
    strengths: parsed.data.strengths,
    improvements: parsed.data.improvements,
    goals: parsed.data.goals,
    status: "SUBMITTED",
  }).returning();

  return NextResponse.json(evaluation, { status: 201 });
}
