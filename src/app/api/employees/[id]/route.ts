// src/app/api/employees/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { employees, auditLogs } from "../../../../../db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const updateSchema = z.object({
  firstName: z.string().min(2).optional(),
  lastName: z.string().min(2).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  contractType: z.enum(["CDI", "CDD", "STAGE", "CONSULTANT"]).optional(),
  contractEnd: z.string().optional(),
  departmentId: z.string().uuid().optional(),
  positionId: z.string().uuid().optional(),
  baseSalary: z.string().optional(),
  isActive: z.boolean().optional(),
});

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const emp = await db.query.employees.findFirst({
    where: eq(employees.id, params.id),
    with: { department: true, position: true },
  });

  if (!emp) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  return NextResponse.json(emp);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const role = (session.user as any).role;
  if (!["ADMIN_RH", "MANAGER"].includes(role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const before = await db.query.employees.findFirst({ where: eq(employees.id, params.id) });

  const [updated] = await db
    .update(employees)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(employees.id, params.id))
    .returning();

  // Audit log
  await db.insert(auditLogs).values({
    userId: (session.user as any).id,
    action: "UPDATE",
    entity: "employee",
    entityId: params.id,
    oldValues: before,
    newValues: updated,
    ipAddress: req.headers.get("x-forwarded-for") || "unknown",
  });

  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const role = (session.user as any).role;
  if (role !== "ADMIN_RH") return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  // Soft delete
  await db.update(employees).set({ isActive: false, updatedAt: new Date() }).where(eq(employees.id, params.id));
  await db.insert(auditLogs).values({
    userId: (session.user as any).id,
    action: "DELETE",
    entity: "employee",
    entityId: params.id,
  });

  return NextResponse.json({ success: true });
}
