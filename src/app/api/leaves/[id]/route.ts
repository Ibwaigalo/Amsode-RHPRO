// src/app/api/leaves/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { leaveRequests, employees, users, notifications } from "@/lib/schema";
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

    let newStatus: string;
    let approverNote = parsed.data.rejectionReason || null;

    if (role === "MANAGER") {
      if (leave.status !== "PENDING") {
        return NextResponse.json({ error: "Cette demande a déjà été traitée par le manager" }, { status: 400 });
      }
      
      if (parsed.data.action === "reject") {
        newStatus = "REJECTED";
        const employeeUser = await db.query.users.findFirst({ 
          where: eq(users.employeeId, leave.employeeId) 
        });
        if (employeeUser) {
          await db.insert(notifications).values({
            userId: employeeUser.id,
            title: "Demande de congés refusée",
            message: `Votre demande de congés a été refusée par le manager. Motif: ${approverNote || "Aucun"}`,
            type: "ERROR",
            link: "/leaves",
          });
        }
      } else {
        newStatus = "PENDING_RH";
      }
    } else {
      if (leave.status !== "PENDING_RH") {
        if (leave.status === "REJECTED") {
          return NextResponse.json({ error: "Cette demande a déjà été refusée" }, { status: 400 });
        }
        if (leave.status === "APPROVED") {
          return NextResponse.json({ error: "Cette demande a déjà été approuvée" }, { status: 400 });
        }
        return NextResponse.json({ error: "Le manager doit d'abord valider cette demande" }, { status: 400 });
      }

      if (parsed.data.action === "reject") {
        newStatus = "REJECTED";
        const employeeUser = await db.query.users.findFirst({ 
          where: eq(users.employeeId, leave.employeeId) 
        });
        if (employeeUser) {
          await db.insert(notifications).values({
            userId: employeeUser.id,
            title: "Demande de congés refusée",
            message: `Votre demande de congés a été refusée par le RH. Motif: ${approverNote || "Aucun"}`,
            type: "ERROR",
            link: "/leaves",
          });
        }
      } else {
        newStatus = "APPROVED";
        const employeeUser = await db.query.users.findFirst({ 
          where: eq(users.employeeId, leave.employeeId) 
        });
        if (employeeUser) {
          await db.insert(notifications).values({
            userId: employeeUser.id,
            title: "Demande de congés approuvée",
            message: "Votre demande de congés a été approuvée par le RH.",
            type: "SUCCESS",
            link: "/leaves",
          });
        }
      }
    }

    const [updated] = await db
      .update(leaveRequests)
      .set({
        status: newStatus as any,
        approvedAt: new Date(),
        approverNote: approverNote,
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
