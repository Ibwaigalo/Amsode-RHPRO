import pg from "pg";
import bcrypt from "bcryptjs";

const pool = new pg.Pool({
  connectionString: "postgresql://postgres:gJ6eHXk@M*4mH8m@db.yofetkpdxckqegnjdpaa.supabase.co:5432/postgres",
  ssl: { rejectUnauthorized: false },
});

async function checkAndCreateAdmin() {
  const client = await pool.connect();
  
  try {
    // Check columns
    const cols = await client.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name = 'users'"
    );
    const colNames = cols.rows.map(r => r.column_name);
    console.log("Columns:", colNames);
    
    // Use correct column name (is_active)
    const hashedPassword = await bcrypt.hash("admin123", 12);
    
    await client.query(
      `INSERT INTO users (name, email, password, role, is_active) 
       VALUES ($1, $2, $3, $4, $5)`,
      ["Administrateur", "admin@amsode.ml", hashedPassword, "ADMIN_RH", true]
    );
    
    console.log("✅ Admin user ready!");
    console.log("Email: admin@amsode.ml");
    console.log("Password: admin123");
    
  } catch (error) {
    console.error("Error:", error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkAndCreateAdmin();