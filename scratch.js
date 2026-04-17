import database from "./backend/database.js";
try {
  const [rows] = await database.query("DESCRIBE booking_rating");
  console.log("booking_rating:", rows.map(r => r.Field).join(", "));
  const [rows2] = await database.query("DESCRIBE booking_detail");
  console.log("booking_detail:", rows2.map(r => r.Field).join(", "));
  const [rows3] = await database.query("DESCRIBE Danh_Muc_Dich_Vu");
  console.log("Danh_Muc_Dich_Vu:", rows3.map(r => r.Field).join(", "));
  const [rows4] = await database.query("SELECT * FROM Danh_Muc_Dich_Vu LIMIT 10");
  console.log("Danh_Muc_Dich_Vu Data:", rows4.map(r => r.Name_Categories).join(", "));
  process.exit(0);
} catch(e) { console.error(e); process.exit(1); }
