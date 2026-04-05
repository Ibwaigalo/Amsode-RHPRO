// src/app/api/employees/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { employees } from "@/lib/schema";
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
  address: z.string().optional(),
  contractType: z.enum(["CDI", "CDD", "STAGE", "CONSULTANT"]),
  startDate: z.string(),
  endDate: z.string().optional(),
  departmentId: z.string().uuid().optional(),
  positionId: z.string().uuid().optional(),
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

  const list = await db.select().from(employees).where(eq(employees.isActive, true));
  return NextResponse.json(list);
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
    baseSalary: data.baseSalary,
    isActive: true,
  }).returning();

  return NextResponse.json(created, { status: 201 });
}
