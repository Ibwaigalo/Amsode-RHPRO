import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { employees, employeeAuditLogs } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const statusChangeSchema = z.object({
  workStatus: z.enum([
    "ACTIVE", 
    "ON_TRIAL", 
    "EN_CONGE", 
    "SUSPENDED", 
    "RESIGNED", 
    "TERMINATED", 
    "CONTRACT_ENDED", 
    "JOB_ABANDONMENT", 
    "MUTUAL_AGREEMENT", 
    "RETIRED"
  ]),
  statusReason: z.string().optional(),
  noticePeriodEnd: z.string().optional(),
  exitInterviewDone: z.boolean().optional(),
});

const exitReasons = {
  RESIGNED: "Démission",
  TERMINATED: "Renvoyé/Licenciement",
  CONTRACT_ENDED: "Fin de contrat",
  JOB_ABANDONMENT: "Abandon de poste",
  MUTUAL_AGREEMENT: "Rupture conventionnelle",
  RETIRED: "Retraite",
};

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const exitStatuses = ["RESIGNED", "TERMINATED", "CONTRACT_ENDED", "JOB_ABANDONMENT", "MUTUAL_AGREEMENT", "RETIRED"];

    let query = db.query.employees.findMany({
      with: { department: true, position: true },
      orderBy: (employees, { desc }) => [desc(employees.updatedAt)],
    });

    if (status === "exited") {
      query = db.query.employees.findMany({
        where: eq(employees.workStatus, "RESIGNED"),
        with: { department: true, position: true },
        orderBy: (employees, { desc }) => [desc(employees.updatedAt)],
      });
    } else if (status === "all") {
      query = db.query.employees.findMany({
        with: { department: true, position: true },
        orderBy: (employees, { desc }) => [desc(employees.updatedAt)],
      });
    } else if (status) {
      query = db.query.employees.findMany({
        where: eq(employees.workStatus, status as any),
        with: { department: true, position: true },
        orderBy: (employees, { desc }) => [desc(employees.updatedAt)],
      });
    } else {
      query = db.query.employees.findMany({
        where: eq(employees.workStatus, "ACTIVE"),
        with: { department: true, position: true },
        orderBy: (employees, { desc }) => [desc(employees.updatedAt)],
      });
    }

    const result = await query;
    return NextResponse.json(result);
  } catch (error) {
    console.error("GET employees by status error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const role = (session.user as any)?.role;
    if (role !== "ADMIN_RH") {
      return NextResponse.json({ error: "Accès refusé. Seul Admin RH peut modifier le statut." }, { status: 403 });
    }

    const body = await req.json();
    const { employeeId, ...data } = body;
    
    if (!employeeId) {
      return NextResponse.json({ error: "ID employé requis" }, { status: 400 });
    }

    const parsed = statusChangeSchema.safeParse(data);
    if (!parsed.success) {
      return NextResponse.json({ error: "Données invalides", details: parsed.error.flatten() }, { status: 400 });
    }

    const employee = await db.query.employees.findFirst({
      where: eq(employees.id, employeeId),
    });

    if (!employee) {
      return NextResponse.json({ error: "Employé introuvable" }, { status: 404 });
    }

    const oldStatus = employee.workStatus;
    const isExitStatus = ["RESIGNED", "TERMINATED", "CONTRACT_ENDED", "JOB_ABANDONMENT", "MUTUAL_AGREEMENT", "RETIRED"].includes(parsed.data.workStatus);

    const updateData: any = {
      workStatus: parsed.data.workStatus,
      statusDate: new Date().toISOString().split("T")[0],
      statusReason: parsed.data.statusReason || (isExitStatus ? exitReasons[parsed.data.workStatus as keyof typeof exitReasons] : null),
      exitInterviewDone: isExitStatus ? (parsed.data.exitInterviewDone || false) : null,
      updatedAt: new Date(),
    };

    if (parsed.data.noticePeriodEnd) {
      updateData.noticePeriodEnd = parsed.data.noticePeriodEnd;
    }

    if (isExitStatus) {
      updateData.isActive = false;
      updateData.departureReason = parsed.data.statusReason || exitReasons[parsed.data.workStatus as keyof typeof exitReasons];
    } else if (parsed.data.workStatus === "ACTIVE") {
      updateData.isActive = true;
    }

    const [updated] = await db
      .update(employees)
      .set(updateData)
      .where(eq(employees.id, employeeId))
      .returning();

    await db.insert(employeeAuditLogs).values({
      employeeId,
      changedBy: (session.user as any)?.employeeId,
      field: "workStatus",
      oldValue: oldStatus,
      newValue: parsed.data.workStatus,
    });

    return NextResponse.json({
      success: true,
      employee: updated,
      message: isExitStatus 
        ? `Employé marqué comme ${exitReasons[parsed.data.workStatus as keyof typeof exitReasons]}`
        : "Statut mis à jour avec succès"
    });
  } catch (error) {
    console.error("PATCH employee status error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
