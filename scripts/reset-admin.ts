import pg from "pg";
import bcrypt from "bcryptjs";

const pool = new pg.Pool({
  connectionString: "postgresql://postgres:gJ6eHXk@M*4mH8m@db.yofetkpdxckqegnjdpaa.supabase.co:5432/postgres",
  ssl: { rejectUnauthorized: false },
});

async function resetPassword() {
  const client = await pool.connect();
  const hashedPassword = await bcrypt.hash("admin123", 12);
  
  await client.query(
    "UPDATE users SET password = $1 WHERE email = $2",
    [hashedPassword, "admin@amsode.ml"]
  );
  
  console.log("Password réinitialisé !");
  console.log("Email: admin@amsode.ml");
  console.log("Password: admin123");
  
  client.release();
  await pool.end();
}

resetPassword();
