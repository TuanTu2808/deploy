import mysql from "mysql2/promise";

export const database = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "",
    port: 3307,
    database: "25ZONE",
});
