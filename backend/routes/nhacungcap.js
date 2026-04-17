// routes/brand.js
import express from "express";
import database from "../database.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const [rows] = await database.query(`
      SELECT Id_brand, Name_brand
      FROM Brands
    `);

    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi lấy brand" });
  }
});

export default router;