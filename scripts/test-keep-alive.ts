// scripts/test-keep-alive.ts
// Teste le keep-alive en local avant de déployer
// Usage : npx tsx scripts/test-keep-alive.ts

import "dotenv/config";

async function testKeepAlive() {
  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const secret = process.env.CRON_SECRET ?? "";

  console.log(`\n🔍 Test keep-alive → ${baseUrl}/api/keep-alive`);

  try {
    const res = await fetch(`${baseUrl}/api/keep-alive`, {
      headers: {
        Authorization: `Bearer ${secret}`,
      },
    });

    const data = await res.json();

    if (res.ok) {
      console.log("✅ Succès :", data);
    } else {
      console.error("❌ Erreur HTTP", res.status, ":", data);
    }
  } catch (err: any) {
    console.error("❌ Erreur réseau :", err.message);
    console.log("   → Vérifie que npm run dev est lancé");
  }
}

testKeepAlive();