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
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const role = (session.user as any).role;
    const userId = (session.user as any).id;

    console.log("PATCH leave - userId:", userId, "role:", role, "leaveId:", params.id);

    if (!["ADMIN_RH", "MANAGER", "PRESIDENT"].includes(role)) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    const leave = await db.query.leaveRequests.findFirst({ where: eq(leaveRequests.id, params.id) });
    if (!leave) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

    console.log("Leave found:", leave);

    const { employee, manager, managerRole } = await getRequesterInfo(params.id);
    console.log("Employee:", employee, "Manager:", manager, "ManagerRole:", managerRole);
    
    let newStatus = "APPROVED";
    let notifyTitle = "Demande approuvée";
    let notifyMessage = "Votre demande de congé a été définitivement approuvée";

    if (parsed.data.action === "reject") {
      newStatus = "REJECTED";
      notifyTitle = "Demande refusée";
      notifyMessage = parsed.data.rejectionReason ? `Raison: ${parsed.data.rejectionReason}` : "Votre demande a été refusée";
    } else {
      if (role === "MANAGER") {
        newStatus = "PENDING_RH";
        notifyTitle = "Demande approuvée par le Manager";
        notifyMessage = "En attente de validation RH";
      }
    }

    console.log("Updating with status:", newStatus);

    const [updated] = await db
      .update(leaveRequests)
      .set({
        status: newStatus as any,
        approverId: userId,
        approvedAt: new Date(),
        approverNote: parsed.data.rejectionReason || null,
        updatedAt: new Date(),
      })
      .where(eq(leaveRequests.id, params.id))
      .returning();

    console.log("Updated leave:", updated);

    if (employee) {
      const empUser = await db.query.users.findFirst({ where: eq(users.employeeId, employee.id) });
      if (empUser) {
        await db.insert(notifications).values({
          userId: empUser.id,
          title: notifyTitle,
          message: notifyMessage,
          type: "INFO",
          link: "/leaves",
        });
      }
    }

    return NextResponse.json(updated);
  } catch (e: any) {
    console.error("Error in PATCH leave:", e);
    return NextResponse.json({ error: e.message || "Erreur serveur" }, { status: 500 });
  }
}
