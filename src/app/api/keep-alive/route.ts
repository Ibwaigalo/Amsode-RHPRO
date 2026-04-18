// src/app/api/keep-alive/route.ts
import { NextRequest, NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: "Non autorisé" },
      { status: 401 }
    );
  }

  try {
    const start = Date.now();

    await db.execute(sql`SELECT 1`);

    const duration = Date.now() - start;

    console.log(`[keep-alive] Supabase ping OK — ${duration}ms — ${new Date().toISOString()}`);

    return NextResponse.json({
      status: "ok",
      message: "Base de données active",
      duration_ms: duration,
      timestamp: new Date().toISOString(),
      project: "AMSODE RH PRO",
    });
  } catch (error: any) {
    console.error("[keep-alive] Erreur ping Supabase :", error);

    return NextResponse.json(
      {
        status: "error",
        message: error.message ?? "Erreur inconnue",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}