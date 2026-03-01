const pool = require("./config/db");

(async () => {
  try {
    const [rows] = await pool.query("SELECT 1");
    console.log("MySQL Connected ✅");
    console.log(rows);
  } catch (err) {
    console.error(err);
  }
})();