import pg from "pg";
import bcrypt from "bcryptjs";

const pool = new pg.Pool({
  connectionString: "postgresql://postgres:gJ6eHXk@M*4mH8m@db.yofetkpdxckqegnjdpaa.supabase.co:5432/postgres",
  ssl: { rejectUnauthorized: false },
});

async function testLogin() {
  const client = await pool.connect();
  
  try {
    const email = "admin@amsode.ml";
    const password = "admin123";
    
    // Find user
    const userResult = await client.query(
      "SELECT id, email, password, role, name FROM users WHERE email = $1",
      [email]
    );
    
    console.log("User found:", userResult.rows[0] ? "YES" : "NO");
    
    if (userResult.rows[0]) {
      const user = userResult.rows[0];
      console.log("Stored password hash:", user.password.substring(0, 20) + "...");
      
      // Verify password
      const isValid = await bcrypt.compare(password, user.password);
      console.log("Password valid:", isValid ? "YES" : "NO");
      
      if (!isValid) {
        // Try with new hash
        const newHash = await bcrypt.hash(password, 12);
        console.log("New hash:", newHash);
        
        // Update password
        await client.query(
          "UPDATE users SET password = $1 WHERE email = $2",
          [newHash, email]
        );
        console.log("Password updated!");
        
        // Verify again
        const updated = await client.query(
          "SELECT password FROM users WHERE email = $1",
          [email]
        );
        const isNowValid = await bcrypt.compare(password, updated.rows[0].password);
        console.log("Password now valid:", isNowValid ? "YES" : "NO");
      }
    }
    
  } catch (error) {
    console.error("Error:", error);
  } finally {
    client.release();
    await pool.end();
  }
}

testLogin();