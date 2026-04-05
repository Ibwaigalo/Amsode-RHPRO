// src/app/api/employees/import/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { employees } from "@/lib/schema";
import { parseExcelFile, EmployeeImportRow } from "@/lib/excel-import";

function generateEmployeeNumber(): string {
  const year = new Date().getFullYear().toString().slice(-2);
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `AMS-${year}-${rand}`;
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

    for (let i = 0; i < result.employees.length; i++) {
      const emp = result.employees[i];
      try {
        const [newEmployee] = await db.insert(employees).values({
          employeeNumber: generateEmployeeNumber(),
          firstName: emp.firstName,
          lastName: emp.lastName,
          workEmail: emp.workEmail || null,
          phone: emp.phone || null,
          cin: emp.cin || null,
          dateOfBirth: emp.dateOfBirth || null,
          gender: emp.gender || null,
          contractType: emp.contractType,
          startDate: emp.startDate,
          endDate: emp.endDate || null,
          departmentId: emp.departmentId || null,
          positionId: emp.positionId || null,
          baseSalary: emp.baseSalary,
          isActive: true,
        }).returning();
        created.push(newEmployee);
      } catch (e: any) {
        failed.push({ row: i + 2, message: `${emp.firstName} ${emp.lastName}: ${e.message}` });
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
