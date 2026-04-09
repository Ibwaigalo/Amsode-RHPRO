import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { hash } from "bcryptjs";
import { z } from "zod";

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Mot de passe actuel requis"),
  newPassword: z.string().min(6, "Nouveau mot de passe minimum 6 caractères"),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const body = await req.json();
  const parsed = changePasswordSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { currentPassword, newPassword } = parsed.data;

  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user || !user.password) {
    return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
  }

  const bcrypt = require("bcryptjs");
  const valid = await bcrypt.compare(currentPassword, user.password);
  if (!valid) {
    return NextResponse.json({ error: "Mot de passe actuel incorrect" }, { status: 400 });
  }

  const hashedPassword = await hash(newPassword, 12);
  await db.update(users).set({ password: hashedPassword }).where(eq(users.id, userId));

  return NextResponse.json({ success: true, message: "Mot de passe modifié avec succès" });
}