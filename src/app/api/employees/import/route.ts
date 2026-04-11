// src/app/api/employees/import/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { employees, departments, positions } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { parseExcelFile, EmployeeImportRow } from "@/lib/excel-import";

function generateEmployeeNumber(): string {
  const year = new Date().getFullYear().toString().slice(-2);
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `AMS-${year}-${rand}`;
}

async function getOrCreateDepartment(name: string): Promise<string | null> {
  if (!name) return null;
  const existing = await db.select().from(departments).where(eq(departments.name, name)).limit(1);
  if (existing.length > 0) return existing[0].id;
  const [created] = await db.insert(departments).values({ name, code: name.substring(0, 10).toUpperCase() }).returning();
  return created.id;
}

async function getOrCreatePosition(title: string, departmentId?: string): Promise<string | null> {
  if (!title) return null;
  const existing = await db.select().from(positions).where(eq(positions.title, title)).limit(1);
  if (existing.length > 0) return existing[0].id;
  const [created] = await db.insert(positions).values({ title, departmentId: departmentId || undefined }).returning();
  return created.id;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const role = (session.user as any).role;
  if (!["ADMIN_RH", "MANAGER"].includes(role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return NextResponse.json({ error: "Aucun fichier fourni" }, { status: 400 });
    }

    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      return NextResponse.json({ error: "Format invalide. Utilisez .xlsx ou .xls" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = parseExcelFile(buffer);

    if (result.employees.length === 0) {
      return NextResponse.json({
        error: "Aucune donnée valide trouvée",
        details: result.errors,
      }, { status: 400 });
    }

    const created: any[] = [];
    const failed: { row: number; message: string }[] = [...result.errors];

    const employeeMap: Record<string, string> = {};
    const departmentMap: Record<string, string> = {};

    for (let i = 0; i < result.employees.length; i++) {
      const emp = result.employees[i];
      try {
        let departmentId: string | undefined = undefined;
        if (emp.departmentId && !departmentMap[emp.departmentId]) {
          const deptId = await getOrCreateDepartment(emp.departmentId);
          departmentMap[emp.departmentId] = deptId || "";
        }
        if (emp.departmentId && departmentMap[emp.departmentId]) {
          departmentId = departmentMap[emp.departmentId] || undefined;
        }

        let positionId: string | undefined = undefined;
        if (emp.positionId && !/^[0-9a-f-]{36}$/i.test(emp.positionId)) {
          positionId = await getOrCreatePosition(emp.positionId, departmentId) || undefined;
        }

        const [newEmployee] = await db.insert(employees).values({
          employeeNumber: generateEmployeeNumber(),
          firstName: emp.firstName,
          lastName: emp.lastName,
          workEmail: emp.workEmail || null,
          personalEmail: emp.personalEmail || null,
          phone: emp.phone || null,
          cin: emp.cin || null,
          dateOfBirth: emp.dateOfBirth || null,
          gender: emp.gender || null,
          nationality: emp.nationality || "Malienne",
          address: emp.address || null,
          city: emp.city || "Bamako",
          zone: emp.zone || null,
          // AJOUT: Statut matrimonial et enfants à charge
          statutMatrimonial: emp.statutMatrimonial || "Célibataire",
          nbEnfantsCharge: emp.nbEnfantsCharge || 0,
          emergencyContact: emp.emergencyContact || null,
          emergencyPhone: emp.emergencyPhone || null,
          contractType: emp.contractType,
          startDate: emp.startDate,
          endDate: emp.endDate || null,
          departmentId: departmentId || null,
          positionId: positionId || null,
          baseSalary: emp.baseSalary,
          isActive: true,
        }).returning();
        
        if (emp.managerId) {
          employeeMap[emp.managerId] = newEmployee.id;
        }
        created.push(newEmployee);
      } catch (e: any) {
        failed.push({ row: i + 2, message: `${emp.firstName} ${emp.lastName}: ${e.message}` });
      }
    }

    for (const emp of result.employees) {
      if (emp.managerId && employeeMap[emp.managerId]) {
        const empToUpdate = created.find(e => e.firstName === emp.firstName && e.lastName === emp.lastName);
        if (empToUpdate) {
          await db.update(employees).set({ managerId: employeeMap[emp.managerId] }).where(eq(employees.id, empToUpdate.id));
        }
      }
    }

    return NextResponse.json({
      success: true,
      imported: created.length,
      failed: failed.length,
      details: failed,
      employees: created,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
