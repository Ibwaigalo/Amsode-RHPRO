import { db } from "@/lib/db";
import { users, employees } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const role = (session.user as any).role;
    if (role !== "ADMIN_RH") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const allUsers = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      isActive: users.isActive,
      employeeId: users.employeeId,
    }).from(users);

    return NextResponse.json(allUsers);
  } catch (e: any) {
    console.error("GET users error:", e);
    return NextResponse.json({ error: "Erreur serveur", message: e.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const role = (session.user as any).role;
    if (role !== "ADMIN_RH") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const body = await request.json();
    const { name, email, password, role: userRole, employeeId } = body;

    if (!email || !password || !userRole) {
      return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
    }

    if (userRole === "PRESIDENT") {
      const existingPresident = await db.query.users.findFirst({ where: eq(users.role, "PRESIDENT") });
      if (existingPresident) {
        return NextResponse.json({ error: "Un président existe déjà. Veuillez d'abord désactiver le président actuel." }, { status: 400 });
      }
    }

    const { hash } = await import("bcryptjs");
    const hashedPassword = await hash(password, 10);

    const [created] = await db.insert(users).values({
      name,
      email,
      password: hashedPassword,
      role: userRole as any,
      employeeId: employeeId || null,
    }).returning();

    return NextResponse.json(created);
  } catch (e: any) {
    console.error("POST users error:", e);
    return NextResponse.json({ error: "Erreur serveur", message: e.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const role = (session.user as any).role;
    if (role !== "ADMIN_RH") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const body = await request.json();
    const { id, name, email, role: userRole, isActive, employeeId } = body;

    if (!id) {
      return NextResponse.json({ error: "ID requis" }, { status: 400 });
    }

    const updateData: any = { name, email, role: userRole, isActive, updatedAt: new Date() };
    if (employeeId !== undefined) {
      updateData.employeeId = employeeId || null;
    }

    const [updated] = await db.update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (e: any) {
    console.error("PUT users error:", e);
    return NextResponse.json({ error: "Erreur serveur", message: e.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const role = (session.user as any).role;
    if (role !== "ADMIN_RH") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID requis" }, { status: 400 });
    }

    await db.delete(users).where(eq(users.id, id));

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error("DELETE users error:", e);
    return NextResponse.json({ error: "Erreur serveur", message: e.message }, { status: 500 });
  }
}
