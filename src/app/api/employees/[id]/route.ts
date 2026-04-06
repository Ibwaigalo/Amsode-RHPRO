// src/app/api/employees/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { employees } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const updateSchema = z.object({
  firstName: z.string().min(2).optional(),
  lastName: z.string().min(2).optional(),
  workEmail: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  cin: z.string().optional(),
  contractType: z.enum(["CDI", "CDD", "STAGE", "CONSULTANT"]).optional(),
  contractEnd: z.string().optional(),
  departmentId: z.string().uuid().optional().or(z.literal("")),
  managerId: z.string().uuid().optional().or(z.literal("")),
  baseSalary: z.string().optional(),
  isActive: z.boolean().optional(),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const { id } = await params;
    const emp = await db.query.employees.findFirst({
      where: eq(employees.id, id),
      with: { department: true, position: true },
    });

    if (!emp) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
    return NextResponse.json(emp);
  } catch (error) {
    console.error("GET employee error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const role = (session.user as any)?.role;
    if (!["ADMIN_RH", "MANAGER"].includes(role)) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    
    if (!parsed.success) {
      console.error("Validation error:", parsed.error);
      return NextResponse.json({ error: "Données invalides", details: parsed.error.flatten() }, { status: 400 });
    }

    const updateData: any = { updatedAt: new Date() };
    
    if (parsed.data.firstName !== undefined) updateData.firstName = parsed.data.firstName;
    if (parsed.data.lastName !== undefined) updateData.lastName = parsed.data.lastName;
    if (parsed.data.workEmail !== undefined) updateData.workEmail = parsed.data.workEmail || null;
    if (parsed.data.phone !== undefined) updateData.phone = parsed.data.phone || null;
    if (parsed.data.cin !== undefined) updateData.cin = parsed.data.cin || null;
    if (parsed.data.contractType !== undefined) updateData.contractType = parsed.data.contractType;
    if (parsed.data.contractEnd !== undefined) updateData.endDate = parsed.data.contractEnd || null;
    if (parsed.data.departmentId !== undefined) updateData.departmentId = parsed.data.departmentId || null;
    if (parsed.data.managerId !== undefined) updateData.managerId = parsed.data.managerId || null;
    if (parsed.data.baseSalary !== undefined) updateData.baseSalary = parsed.data.baseSalary;
    if (parsed.data.isActive !== undefined) updateData.isActive = parsed.data.isActive;

    const [updated] = await db
      .update(employees)
      .set(updateData)
      .where(eq(employees.id, id))
      .returning();

    if (!updated) return NextResponse.json({ error: "Membre introuvable" }, { status: 404 });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT employee error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const role = (session.user as any)?.role;
    if (role !== "ADMIN_RH") {
      return NextResponse.json({ error: "Accès refusé. Seul un Admin RH peut supprimer." }, { status: 403 });
    }

    const { id } = await params;
    
    // Soft delete - set isActive to false
    const [updated] = await db
      .update(employees)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(employees.id, id))
      .returning();

    if (!updated) return NextResponse.json({ error: "Membre introuvable" }, { status: 404 });

    return NextResponse.json({ success: true, message: "Membre désactivé avec succès" });
  } catch (error) {
    console.error("DELETE employee error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
