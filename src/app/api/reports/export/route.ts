// src/app/api/reports/export/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { employees, payslips, leaveRequests, departments, positions } from "../../../../../db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "employees";

  const XLSX = await import("xlsx");
  let ws: any;
  let sheetName: string;

  if (type === "employees") {
    const data = await db
      .select({
        matricule: employees.employeeNumber,
        prenom: employees.firstName,
        nom: employees.lastName,
        email: employees.email,
        telephone: employees.phone,
        departement: departments.name,
        poste: positions.title,
        contrat: employees.contractType,
        debut: employees.contractStart,
        fin: employees.contractEnd,
        salaire: employees.baseSalary,
        statut: employees.isActive,
      })
      .from(employees)
      .leftJoin(departments, eq(employees.departmentId, departments.id))
      .leftJoin(positions, eq(employees.positionId, positions.id));

    const rows = data.map(d => ({
      Matricule: d.matricule,
      Prénom: d.prenom,
      Nom: d.nom,
      Email: d.email,
      Téléphone: d.telephone || "",
      Département: d.departement || "",
      Poste: d.poste || "",
      Contrat: d.contrat,
      "Début contrat": d.debut,
      "Fin contrat": d.fin || "",
      "Salaire base (FCFA)": parseFloat(d.salaire),
      Statut: d.statut ? "Actif" : "Inactif",
    }));

    ws = XLSX.utils.json_to_sheet(rows);
    sheetName = "Employés";
  } else if (type === "leaves") {
    const data = await db
      .select({
        nom: employees.firstName,
        prenom: employees.lastName,
        type: leaveRequests.leaveType,
        debut: leaveRequests.startDate,
        fin: leaveRequests.endDate,
        jours: leaveRequests.totalDays,
        statut: leaveRequests.status,
        motif: leaveRequests.reason,
      })
      .from(leaveRequests)
      .leftJoin(employees, eq(leaveRequests.employeeId, employees.id));

    const rows = data.map(d => ({
      Prénom: d.nom || "",
      Nom: d.prenom || "",
      "Type de congé": d.type,
      "Date début": d.debut,
      "Date fin": d.fin,
      "Nombre de jours": parseFloat(d.jours),
      Statut: d.statut,
      Motif: d.motif || "",
    }));

    ws = XLSX.utils.json_to_sheet(rows);
    sheetName = "Congés";
  } else {
    return NextResponse.json({ error: "Type inconnu" }, { status: 400 });
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="rapport-${type}-${new Date().toISOString().slice(0, 10)}.xlsx"`,
    },
  });
}
