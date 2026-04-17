import express from "express";
import database from "../database.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import { requireAdminAuth } from "../middleware/auth.js";

const router = express.Router();

/* MULTER */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join("public", "image", "sanpham"));
  },
  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() + "-" + file.originalname.replace(/\s/g, "_");
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

/**
 * =========================
 * GET: Lấy tất cả ảnh theo sản phẩm
 * =========================
 */
router.get("/:productId", async (req, res) => {
  try {
    const { productId } = req.params;

    const [rows] = await database.query(
      "SELECT * FROM Image_products WHERE Id_product = ?",
      [productId]
    );

    res.json(rows);
  } catch (error) {
    console.error("Lỗi lấy ảnh sản phẩm:", error);
    res.status(500).json({ error: "Lỗi server" });
  }
});

/**
 * =========================
 * POST: Upload thêm ảnh cho sản phẩm
 * =========================
 */
router.post(
  "/:productId",
  requireAdminAuth,
  upload.array("images", 10),
  async (req, res) => {
    try {
      const { productId } = req.params;

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: "Không có file ảnh" });
      }

      const imageValues = req.files.map((file) => [
        productId,
        `/image/sanpham/${file.filename}`,
      ]);

      await database.query(
        `INSERT INTO Image_products (Id_product, Image_url)
         VALUES ?`,
        [imageValues]
      );

      res.json({ message: "Upload ảnh thành công" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Lỗi upload ảnh" });
    }
  }
);

/**
 * =========================
 * DELETE: Xóa 1 ảnh sản phẩm
 * =========================
 */
router.delete("/:imageId", requireAdminAuth, async (req, res) => {
  try {
    const { imageId } = req.params;

    const [rows] = await database.query(
      "SELECT Image_url FROM Image_products WHERE Id_image = ?",
      [imageId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Không tìm thấy ảnh" });
    }

    const imagePath = rows[0].Image_url;
    const fullPath = path.join(
      process.cwd(),
      "public",
      imagePath.replace("/image/", "image/")
    );

    // Xóa file vật lý
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }

    // Xóa DB
    await database.query(
      "DELETE FROM Image_products WHERE Id_image = ?",
      [imageId]
    );

    res.json({ message: "Xóa ảnh thành công" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Lỗi xóa ảnh" });
  }
});

export default router;
