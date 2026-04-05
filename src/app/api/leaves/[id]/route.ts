// src/app/api/leaves/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { leaveRequests, notifications, users } from "../../../../../db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const patchSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED", "CANCELLED"]),
  rejectionReason: z.string().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const role = (session.user as any).role;
  if (!["ADMIN_RH", "MANAGER"].includes(role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const leave = await db.query.leaveRequests.findFirst({ where: eq(leaveRequests.id, params.id) });
  if (!leave) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const [updated] = await db
    .update(leaveRequests)
    .set({
      status: parsed.data.status,
      approvedById: (session.user as any).id,
      approvedAt: new Date(),
      rejectionReason: parsed.data.rejectionReason,
      updatedAt: new Date(),
    })
    .where(eq(leaveRequests.id, params.id))
    .returning();

  // Notify the employee
  const emp = await db.query.users.findFirst({ where: eq(users.employeeId, leave.employeeId) });
  if (emp) {
    await db.insert(notifications).values({
      userId: emp.id,
      title: parsed.data.status === "APPROVED" ? "Congé approuvé ✓" : "Congé refusé",
      message: parsed.data.status === "APPROVED"
        ? "Votre demande de congé a été approuvée."
        : `Votre demande a été refusée. ${parsed.data.rejectionReason || ""}`,
      type: "LEAVE_UPDATE",
      link: "/dashboard/leaves",
    });
  }

  return NextResponse.json(updated);
}
