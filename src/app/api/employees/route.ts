// src/app/api/employees/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { employees, users } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const createSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  workEmail: z.string().email().optional(),
  phone: z.string().optional(),
  cin: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(["M", "F"]).optional(),
  // AJOUT: Statut matrimonial
  statutMatrimonial: z.enum(["Célibataire", "Marié", "Veuf/Veuve", "Divorcé/Séparé"]).optional(),
  // AJOUT: Enfants à charge
  nbEnfantsCharge: z.number().min(0).max(10).optional(),
  address: z.string().optional(),
  contractType: z.enum(["CDI", "CDD", "STAGE", "CONSULTANT"]),
  startDate: z.string(),
  endDate: z.string().optional(),
  departmentId: z.string().uuid().optional(),
  positionId: z.string().uuid().optional(),
  managerId: z.string().uuid().optional(),
  baseSalary: z.string(),
});

function generateEmployeeNumber(): string {
  const year = new Date().getFullYear().toString().slice(-2);
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `AMS-${year}-${rand}`;
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const role = (session.user as any).role;
  const userId = (session.user as any).id;
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });

  let list: any[] = [];

  if (role === "ADMIN_RH" || role === "PRESIDENT") {
    list = await db.select().from(employees).where(eq(employees.isActive, true));
  } else if (role === "MANAGER" && user?.employeeId) {
    list = await db.select().from(employees).where(
      eq(employees.managerId, user.employeeId)
    );
  } else if (user?.employeeId) {
    list = await db.select().from(employees).where(eq(employees.id, user.employeeId));
  } else {
    list = [];
  }
  
  const managerIds = [...new Set(list.map(emp => emp.managerId).filter(Boolean))];
  let managerMap = new Map();
  if (managerIds.length > 0) {
    const managers = await db.select({
      id: employees.id,
      firstName: employees.firstName,
      lastName: employees.lastName,
    }).from(employees).where(
      managerIds.length === 1 
        ? eq(employees.id, managerIds[0])
        : eq(employees.id, managerIds[0] as any)
    );
    for (const m of managers) {
      managerMap.set(m.id, m);
    }
  }
  
  const listWithManager = list.map((emp) => {
    const manager = emp.managerId ? managerMap.get(emp.managerId) : null;
    
    if (role === "EMPLOYE") {
      return {
        id: emp.id,
        employeeNumber: emp.employeeNumber,
        firstName: emp.firstName,
        lastName: emp.lastName,
        workEmail: emp.workEmail,
        departmentId: emp.departmentId,
        positionId: emp.positionId,
        manager,
        isActive: emp.isActive,
      };
    }
    
    return { ...emp, manager };
  });
  
  return NextResponse.json(listWithManager);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const role = (session.user as any).role;
  if (!["ADMIN_RH", "MANAGER"].includes(role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;

  const [created] = await db.insert(employees).values({
    employeeNumber: generateEmployeeNumber(),
    firstName: data.firstName,
    lastName: data.lastName,
    workEmail: data.workEmail || null,
    phone: data.phone,
    cin: data.cin,
    dateOfBirth: data.dateOfBirth,
    gender: data.gender,
    address: data.address,
    contractType: data.contractType,
    startDate: data.startDate,
    endDate: data.endDate,
    departmentId: data.departmentId,
    positionId: data.positionId,
    managerId: data.managerId || null,
    baseSalary: data.baseSalary,
    // AJOUT: Statut matrimonial et enfants à charge
    statutMatrimonial: data.statutMatrimonial || "Célibataire",
    nbEnfantsCharge: data.nbEnfantsCharge || 0,
    isActive: true,
  }).returning();

  return NextResponse.json(created, { status: 201 });
}
