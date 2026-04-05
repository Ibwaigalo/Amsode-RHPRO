// src/app/api/leaves/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { leaveRequests, employees, users, notifications } from "../../../../db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const createSchema = z.object({
  leaveType: z.enum(["ANNUAL", "SICK", "MATERNITY", "PATERNITY", "UNPAID", "SPECIAL"]),
  startDate: z.string(),
  endDate: z.string(),
  totalDays: z.number().positive(),
  reason: z.string().min(10),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const list = await db
    .select()
    .from(leaveRequests)
    .orderBy(leaveRequests.createdAt);
  return NextResponse.json(list);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const userId = (session.user as any).id;

  // Find employee linked to user
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!user?.employeeId) {
    return NextResponse.json({ error: "Aucun profil employé lié à ce compte" }, { status: 400 });
  }

  const [request] = await db.insert(leaveRequests).values({
    employeeId: user.employeeId,
    leaveType: parsed.data.leaveType,
    startDate: parsed.data.startDate,
    endDate: parsed.data.endDate,
    totalDays: String(parsed.data.totalDays),
    reason: parsed.data.reason,
    status: "PENDING",
  }).returning();

  // Notify admins
  const admins = await db.query.users.findMany({ where: eq(users.role, "ADMIN_RH") });
  for (const admin of admins) {
    await db.insert(notifications).values({
      userId: admin.id,
      title: "Nouvelle demande de congé",
      message: `${session.user?.name} a soumis une demande de ${parsed.data.leaveType} (${parsed.data.totalDays} jours)`,
      type: "LEAVE_REQUEST",
      link: "/dashboard/leaves",
    });
  }

  return NextResponse.json(request, { status: 201 });
}
