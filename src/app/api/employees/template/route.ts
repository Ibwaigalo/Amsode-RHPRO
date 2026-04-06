// src/app/api/employees/template/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { generateEmployeeTemplate } from "@/lib/excel-import";

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const buffer = generateEmployeeTemplate();

  return new Response(Buffer.from(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": "attachment; filename=modele_employes.xlsx",
    },
  });
}
