// src/app/api/training/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { trainings } from "../../../../db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const schema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  provider: z.string().optional(),
  duration: z.number().positive().optional(),
  durationUnit: z.string().default("hours"),
  cost: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  maxParticipants: z.number().positive().optional(),
});

export async function GET() {
  const list = await db.select().from(trainings).where(eq(trainings.isActive, true));
  return NextResponse.json(list);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const role = (session.user as any).role;
  if (!["ADMIN_RH", "MANAGER"].includes(role)) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const [training] = await db.insert(trainings).values({
    ...parsed.data,
    isActive: true,
  }).returning();

  return NextResponse.json(training, { status: 201 });
}
