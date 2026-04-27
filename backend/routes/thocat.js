import express from "express";
import database from "../database.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const { store, role } = req.query;

    let query = `
      SELECT 
        u.Id_user,
        u.Name_user,
        u.Email,
        u.Phone,
        u.Pass_word,
        u.Address,
        u.role,
        u.Image,
        s.Name_store
      FROM Users u
      LEFT JOIN Stores s ON u.Id_store = s.Id_store
      WHERE u.role IN ('stylist')
    `;

    if (store) {
      query += ` AND u.Id_store = ${Number(store)}`;
    }

    if (role) {
      query += ` AND u.role = '${role}'`;
    }

    const [rows] = await database.query(query);

    res.json(rows);
  } catch (error) {
    console.error("THOCAT ERROR:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
});

export default router;