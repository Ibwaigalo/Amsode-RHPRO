// src/app/api/documents/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { documents } from "@/lib/schema";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const list = await db.select().from(documents);
  return NextResponse.json(list);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const employeeId = formData.get("employeeId") as string;
    const type = formData.get("type") as string;
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;

    if (!file || !type || !name) {
      return NextResponse.json({ error: "Fichier, type et nom requis" }, { status: 400 });
    }

    // In production: upload to Vercel Blob or S3
    // const { url } = await put(file.name, file, { access: "public" });
    // For now, use a placeholder path
    const fileUrl = `/uploads/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;

    const [doc] = await db.insert(documents).values({
      title: name,
      type: type as any,
      fileUrl,
      fileSize: file.size,
      mimeType: file.type,
      employeeId: employeeId || null,
      uploadedBy: (session.user as any).id,
    }).returning();

    return NextResponse.json(doc, { status: 201 });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Erreur lors de l'upload" }, { status: 500 });
  }
}
