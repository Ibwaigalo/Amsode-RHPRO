// src/app/api/employees/create-accounts/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { employees, users } from "@/lib/schema";
import { eq, isNull, and } from "drizzle-orm";
import { hash } from "bcryptjs";
import { randomBytes } from "crypto";

async function createUserAccount(employeeId: string, firstName: string, lastName: string, email: string | null) {
  const tempPassword = randomBytes(8).toString("hex");
  const hashedPassword = await hash(tempPassword, 12);
  
  const [user] = await db.insert(users).values({
    name: `${firstName} ${lastName}`,
    email: email || `${firstName.toLowerCase()}.${lastName.toLowerCase()}@amsode.ml`,
    password: hashedPassword,
    role: "EMPLOYE",
    employeeId: employeeId,
    isActive: true,
  }).returning();
  
  return { user, tempPassword };
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
  const { employeeIds, createAll = false } = body;

  try {
    let targetEmployees;
    
    if (createAll) {
      targetEmployees = await db
        .select()
        .from(employees)
        .where(and(eq(employees.isActive, true), isNull(employees.userId)));
    } else if (employeeIds && employeeIds.length > 0) {
      targetEmployees = await db
        .select()
        .from(employees)
        .where(eq(employees.id, employeeIds[0] as any));
    } else {
      return NextResponse.json({ error: "Aucun employé sélectionné" }, { status: 400 });
    }

    const results: { success: any[]; failed: any[] } = { success: [], failed: [] };

    for (const emp of targetEmployees) {
      if (emp.userId) {
        results.failed.push({ 
          id: emp.id, 
          name: `${emp.firstName} ${emp.lastName}`, 
          reason: "Compte déjà existant" 
        });
        continue;
      }

      try {
        const email = emp.workEmail || `${emp.firstName.toLowerCase()}.${emp.lastName.toLowerCase()}@amsode.ml`;
        
        const account = await createUserAccount(emp.id, emp.firstName, emp.lastName, emp.workEmail);
        
        await db.update(employees)
          .set({ userId: account.user.id })
          .where(eq(employees.id, emp.id));
        
        results.success.push({
          id: emp.id,
          name: `${emp.firstName} ${emp.lastName}`,
          email: account.user.email,
          tempPassword: account.tempPassword,
        });
      } catch (e: any) {
        results.failed.push({
          id: emp.id,
          name: `${emp.firstName} ${emp.lastName}`,
          reason: e.message,
        });
      }
    }

    return NextResponse.json(results);
  } catch (e: any) {
    console.error("Error creating accounts:", e);
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

  const employeesWithoutAccount = await db
    .select({
      id: employees.id,
      employeeNumber: employees.employeeNumber,
      firstName: employees.firstName,
      lastName: employees.lastName,
      workEmail: employees.workEmail,
      isActive: employees.isActive,
    })
    .from(employees)
    .where(and(eq(employees.isActive, true), isNull(employees.userId)));

  return NextResponse.json({ 
    count: employeesWithoutAccount.length,
    employees: employeesWithoutAccount 
  });
}