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
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL!,
    max: 1,
    idleTimeoutMillis: 20000,
    connectionTimeoutMillis: 10000,
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
