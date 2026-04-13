import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { employees } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const role = (session.user as any)?.role;
    if (!["ADMIN_RH", "PRESIDENT"].includes(role)) {
      return NextResponse.json({ error: "Accès refusé. Seul Admin RH peut effectuer cette action." }, { status: 403 });
    }

    const { id } = await params;
    
    const employee = await db.query.employees.findFirst({
      where: eq(employees.id, id),
    });

    if (!employee) {
      return NextResponse.json({ error: "Employé introuvable" }, { status: 404 });
    }

    if (employee.workStatus !== "EN_CONGE") {
      return NextResponse.json({ error: "L'employé n'est pas en congé" }, { status: 400 });
    }

    const [updated] = await db
      .update(employees)
      .set({ 
        workStatus: "ACTIVE",
        updatedAt: new Date()
      })
      .where(eq(employees.id, id))
      .returning();

    return NextResponse.json({
      success: true,
      employee: updated,
      message: `${employee.firstName} ${employee.lastName} est maintenant actif`
    });
  } catch (error) {
    console.error("POST return from leave error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
