// src/lib/db.ts
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "../../drizzle/schema";

type DBType = ReturnType<typeof drizzle<typeof schema>>;

declare global {
  var _dbPool: Pool | undefined;
  var _db: DBType | undefined;
}

function createDb() {
  const connectionString = process.env.DATABASE_URL || "";
  
  if (!connectionString) {
    throw new Error("DATABASE_URL not defined");
  }
  
  console.log("[DB] Connecting to:", connectionString.replace(/:[^:]+@/, ":****@"));
  
  const pool = new Pool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 20000,
    connectionTimeoutMillis: 15000,
  });

  pool.on("error", (err) => {
    console.error("[DB] Pool error:", err.message);
  });

  return { pool, db: drizzle(pool, { schema }) };
}

let pool: Pool;
let db: DBType;

if (process.env.NODE_ENV === "production") {
  const created = createDb();
  pool = created.pool;
  db = created.db;
} else {
  if (!globalThis._db) {
    const created = createDb();
    globalThis._dbPool = created.pool;
    globalThis._db = created.db;
  }
  pool = globalThis._dbPool!;
  db = globalThis._db!;
}

export { db };
export type DB = DBType;

export async function testConnection(): Promise<boolean> {
  try {
    const result = await pool.query("SELECT 1 as test");
    console.log("[DB] Connection OK:", result.rows);
    return true;
  } catch (error: any) {
    console.error("[DB] Connection failed:", error.message);
    return false;
  }
}
