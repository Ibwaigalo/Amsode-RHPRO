import { db } from "@/lib/db";
import { users, employees } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function GET() {
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
}

export async function POST(request: Request) {
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

  const bcrypt = require("bcryptjs");
  const hashedPassword = await bcrypt.hash(password, 10);

  const [created] = await db.insert(users).values({
    name,
    email,
    password: hashedPassword,
    role: userRole as any,
    employeeId: employeeId || null,
  }).returning();

  return NextResponse.json(created);
}

export async function PUT(request: Request) {
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

  const [updated] = await db.update(users)
    .set({ name, email, role: userRole, isActive, employeeId })
    .where(eq(users.id, id))
    .returning();

  return NextResponse.json(updated);
}

export async function DELETE(request: Request) {
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
}
