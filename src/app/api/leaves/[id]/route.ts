// src/app/api/leaves/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { leaveRequests, notifications, users, employees } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const patchSchema = z.object({
  action: z.enum(["approve", "reject"]),
  rejectionReason: z.string().optional(),
});

async function getRequesterInfo(leaveId: string) {
  const leave = await db.query.leaveRequests.findFirst({ where: eq(leaveRequests.id, leaveId) });
  if (!leave?.employeeId) return { employee: null, manager: null, managerRole: null };
  
  const employee = await db.query.employees.findFirst({ where: eq(employees.id, leave.employeeId) });
  if (!employee?.managerId) return { employee, manager: null, managerRole: null };
  
  const manager = await db.query.employees.findFirst({ where: eq(employees.id, employee.managerId) });
  let managerRole = null;
  
  if (manager?.userId) {
    const managerUser = await db.query.users.findFirst({ where: eq(users.id, manager.userId) });
    managerRole = managerUser?.role || null;
  }
  
  return { employee, manager, managerRole };
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
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

  const { employee, manager, managerRole } = await getRequesterInfo(params.id);
  
  let newStatus = "APPROVED";
  let notifyTitle = "Demande approuvée";
  let notifyMessage = "Votre demande de congé a été définitivement approuvée";

  if (parsed.data.action === "reject") {
    newStatus = "REJECTED";
    notifyTitle = "Demande refusée";
    notifyMessage = parsed.data.rejectionReason ? `Raison: ${parsed.data.rejectionReason}` : "Votre demande a été refusée";
  } else {
    if (role === "ADMIN_RH") {
      if (managerRole === "PRESIDENT") {
        newStatus = "APPROVED";
        notifyTitle = "Demande approuvée par la RH";
        notifyMessage = "Votre demande de congé a été définitivement approuvée";
      } else if (managerRole === "MANAGER") {
        newStatus = "APPROVED";
        notifyTitle = "Demande approuvée par la RH";
        notifyMessage = "Votre demande de congé a été définitivement approuvée";
      } else if (!manager || managerRole === "EMPLOYE" || !managerRole) {
        newStatus = "APPROVED";
        notifyTitle = "Demande approuvée par la RH";
        notifyMessage = "Votre demande de congé a été définitivement approuvée";
      } else {
        newStatus = "APPROVED";
        notifyTitle = "Demande approuvée par la RH";
        notifyMessage = "Votre demande de congé a été définitivement approuvée";
      }
    } 
    else if (role === "PRESIDENT") {
      if (managerRole === "MANAGER" || managerRole === "EMPLOYE" || !managerRole) {
        newStatus = "PENDING_RH";
        notifyTitle = "Demande approuvée par le Président";
        notifyMessage = "En attente de validation RH";
      } else {
        newStatus = "APPROVED";
        notifyTitle = "Demande approuvée par le Président";
        notifyMessage = "Votre demande de congé a été définitivement approuvée";
      }
    } 
    else if (role === "MANAGER") {
      if (managerRole === "MANAGER") {
        newStatus = "PENDING_RH";
        notifyTitle = "Demande approuvée par le Manager";
        notifyMessage = "En attente de validation RH";
      } else if (managerRole === "EMPLOYE" || !managerRole || managerRole === null) {
        newStatus = "PENDING_RH";
        notifyTitle = "Demande approuvée par le Manager";
        notifyMessage = "En attente de validation RH";
      } else {
        newStatus = "APPROVED";
        notifyTitle = "Demande approuvée";
        notifyMessage = "Votre demande de congé a été définitivement approuvée";
      }
    }
  }

  const [updated] = await db
    .update(leaveRequests)
    .set({
      status: newStatus as any,
      approverId: userId,
      approvedAt: new Date(),
      approverNote: parsed.data.rejectionReason,
      updatedAt: new Date(),
    })
    .where(eq(leaveRequests.id, params.id))
    .returning();

  const emp = await db.query.users.findFirst({ where: eq(users.employeeId, leave.employeeId) });
  if (emp) {
    await db.insert(notifications).values({
      userId: emp.id,
      title: notifyTitle,
      message: notifyMessage,
      type: "INFO",
      link: "/leaves",
    });
  }

  return NextResponse.json(updated);
}
