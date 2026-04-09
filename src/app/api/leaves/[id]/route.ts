// src/app/api/leaves/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { leaveRequests } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const patchSchema = z.object({
  action: z.enum(["approve", "reject"]),
  rejectionReason: z.string().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const role = (session.user as any).role;
    const userId = (session.user as any).id;

    if (!["ADMIN_RH", "MANAGER", "PRESIDENT"].includes(role)) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    const leave = await db.query.leaveRequests.findFirst({ where: eq(leaveRequests.id, params.id) });
    if (!leave) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

    const newStatus = parsed.data.action === "reject" ? "REJECTED" : "PENDING_RH";

    const [updated] = await db
      .update(leaveRequests)
      .set({
        status: newStatus,
        approvedAt: new Date(),
        approverNote: parsed.data.rejectionReason || null,
        updatedAt: new Date(),
      })
      .where(eq(leaveRequests.id, params.id))
      .returning();

    return NextResponse.json(updated);
  } catch (e: any) {
    console.error("PATCH leave error:", e);
    return NextResponse.json({ 
      error: "Erreur serveur", 
      message: e.message 
    }, { status: 500 });
  }
}
