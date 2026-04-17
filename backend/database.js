import mysql from "mysql2/promise";

const dbPort = Number(process.env.DB_PORT || 3306);

const database = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  port: Number.isFinite(dbPort) ? dbPort : 3306,
  database: process.env.DB_NAME || process.env.MYSQL_DATABASE || "25zone",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true, // 🔥 QUAN TRỌNG
});

export default database;
