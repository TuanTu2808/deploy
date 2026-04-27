import express from "express";
import database from "../database.js";

const router = express.Router();

// get comments for a specific product
router.get("/:productId", async (req, res) => {
  const { productId } = req.params;
  try {
    const [rows] = await database.query(
      `SELECT pc.id_product_comment, pc.Content, pc.Created_at, pc.Id_user, pc.rating
       FROM product_comments pc
       WHERE pc.Id_product = ?
       ORDER BY pc.Created_at DESC`,
      [productId]
    );
    res.json(rows);
  } catch (err) {
    console.error("error fetching comments", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// post a new comment
router.post("/", async (req, res) => {
  const { productId, userId, content, rating } = req.body;
  if (!productId || !userId || !content) {
    return res.status(400).json({ error: "missing fields" });
  }

  try {
    const [result] = await database.query(
      "INSERT INTO product_comments (Content, Created_at, Id_user, Id_product, rating) VALUES (?, NOW(), ?, ?, ?)",
      [content, userId, productId, rating || 5]
    );
    res.json({ insertId: result.insertId });
  } catch (err) {
    console.error("error inserting comment", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
