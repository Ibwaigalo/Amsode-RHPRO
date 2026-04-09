import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, employees } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { hash } from "bcryptjs";
import { randomBytes } from "crypto";
import { z } from "zod";

const resetSchema = z.object({
  employeeId: z.string().uuid(),
  newPassword: z.string().min(6).optional(),
});

function generateTempPassword(): string {
  return randomBytes(6).toString("hex");
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const role = (session.user as any).role;
  if (!["ADMIN_RH", "PRESIDENT"].includes(role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = resetSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { employeeId, newPassword } = parsed.data;

  try {
    const employee = await db.query.employees.findFirst({
      where: eq(employees.id, employeeId),
    });

    if (!employee) {
      return NextResponse.json({ error: "Employé non trouvé" }, { status: 404 });
    }

    let user = await db.query.users.findFirst({
      where: eq(users.employeeId, employeeId),
    });

    const tempPassword = newPassword || generateTempPassword();
    const hashedPassword = await hash(tempPassword, 12);

    if (user) {
      await db.update(users)
        .set({ password: hashedPassword })
        .where(eq(users.id, user.id));
    } else {
      const email = employee.workEmail || `${employee.firstName.toLowerCase()}.${employee.lastName.toLowerCase()}@amsode.ml`;
      
      [user] = await db.insert(users).values({
        name: `${employee.firstName} ${employee.lastName}`,
        email,
        password: hashedPassword,
        role: "EMPLOYE",
        employeeId: employee.id,
        isActive: true,
      }).returning();

      await db.update(employees)
        .set({ userId: user.id })
        .where(eq(employees.id, employeeId));
    }

    return NextResponse.json({
      success: true,
      name: `${employee.firstName} ${employee.lastName}`,
      email: user?.email,
      tempPassword,
    });
  } catch (e: any) {
    console.error("Error resetting password:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const role = (session.user as any).role;
  if (!["ADMIN_RH", "PRESIDENT"].includes(role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const employeesWithUsers = await db
    .select({
      id: employees.id,
      employeeNumber: employees.employeeNumber,
      firstName: employees.firstName,
      lastName: employees.lastName,
      workEmail: employees.workEmail,
      hasAccount: employees.userId,
    })
    .from(employees)
    .where(eq(employees.isActive, true));

  return NextResponse.json(employeesWithUsers);
}