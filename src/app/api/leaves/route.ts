// src/app/api/leaves/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { leaveRequests, employees, users, notifications } from "@/lib/schema";
import { eq, inArray, or, and, isNull } from "drizzle-orm";
import { z } from "zod";

const createSchema = z.object({
  leaveType: z.enum(["CONGE_PAYE", "MALADIE", "MATERNITE", "PATERNITE", "SANS_SOLDE", "AUTRE"]),
  startDate: z.string(),
  endDate: z.string(),
  totalDays: z.number().positive(),
  reason: z.string().min(10),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const role = (session.user as any).role;
  const userId = (session.user as any).id;

  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!user) return NextResponse.json([]);

  if (role === "ADMIN_RH" || role === "PRESIDENT") {
    const list = await db.select().from(leaveRequests).orderBy(leaveRequests.createdAt);
    return NextResponse.json(list);
  } 
  
  if (role === "MANAGER" && user.employeeId) {
    const managedEmployees = await db.select({ id: employees.id }).from(employees).where(eq(employees.managerId, user.employeeId));
    const managedIds = managedEmployees.map(e => e.id);
    
    if (managedIds.length > 0) {
      const ownLeaves = await db.select().from(leaveRequests).where(eq(leaveRequests.employeeId, user.employeeId));
      const managedLeaves = await db.select().from(leaveRequests).where(
        inArray(leaveRequests.employeeId, managedIds)
      );
      return NextResponse.json([...ownLeaves, ...managedLeaves]);
    }
    const ownLeaves = await db.select().from(leaveRequests).where(eq(leaveRequests.employeeId, user.employeeId));
    return NextResponse.json(ownLeaves);
  }
  
  if (user.employeeId) {
    const list = await db.select().from(leaveRequests).where(eq(leaveRequests.employeeId, user.employeeId));
    return NextResponse.json(list);
  }
  
  return NextResponse.json([]);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const userId = (session.user as any).id;
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  
  if (!user?.employeeId) {
    return NextResponse.json({ error: "Aucun profil employé lié à ce compte" }, { status: 400 });
  }

  const [request] = await db.insert(leaveRequests).values({
    employeeId: user.employeeId,
    leaveType: parsed.data.leaveType as any,
    startDate: parsed.data.startDate,
    endDate: parsed.data.endDate,
    daysCount: parsed.data.totalDays,
    reason: parsed.data.reason,
    status: "PENDING" as any,
  }).returning();

  const admins = await db.query.users.findMany({ where: eq(users.role, "ADMIN_RH") });
  for (const admin of admins) {
    await db.insert(notifications).values({
      userId: admin.id,
      title: "Nouvelle demande de congés",
      message: `${session.user?.name} a soumis une demande de ${parsed.data.leaveType} (${parsed.data.totalDays} jours)`,
      type: "INFO",
      link: "/leaves",
    });
  }

  return NextResponse.json(request, { status: 201 });
}
