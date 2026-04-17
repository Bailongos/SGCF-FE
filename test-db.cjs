const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:86fFoauqJRTkEuEC@db.ztrorjkvkbhcjpdqbvao.supabase.co:5432/postgres'
});

async function main() {
  try {
    const res = await pool.query('SELECT id_usuario, username, password, activo FROM "control financiero".usuarios');
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error("DB Error:", err);
  } finally {
    pool.end();
  }
}

main();
