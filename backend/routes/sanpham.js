import express from "express";
import database from "../database.js";
import multer from "multer";
import path from "path";
import { requireAdminAuth } from "../middleware/auth.js";

const router = express.Router();

/* ================= MULTER CONFIG ================= */
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

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

/**
 * =========================
 * GET: Lấy tất cả sản phẩm + ảnh đại diện
 * =========================
 */
router.get("/", async (req, res) => {
  try {
    const [rows] = await database.query(`
      SELECT 
        p.*,
        c.Name_category AS Category_Name,
        b.Name_brand AS Brand_Name,
        (SELECT Image_url 
         FROM Image_products 
         WHERE Id_product = p.Id_product 
         LIMIT 1) AS Thumbnail
      FROM Products p
      LEFT JOIN Categories_Product c 
        ON p.Id_category_product = c.Id_category_products
      LEFT JOIN Brands b 
        ON p.Id_brand = b.Id_brand
      ORDER BY p.Id_product DESC
    `);

    res.json(rows);
  } catch (error) {
    console.error("Lỗi GET sản phẩm:", error);
    res.status(500).json({ error: "Lỗi server" });
  }
});

/**
 * =========================
 * POST: Tạo sản phẩm + upload nhiều ảnh
 * =========================
 */
router.post("/", requireAdminAuth, upload.array("images", 10), async (req, res) => {
  const connection = await database.getConnection();

  try {
    await connection.beginTransaction();

    const {
      Name_product,
      Quantity,
      Size,
      Price,
      Sale_Price,
      Description,
      Status,
      Id_category_product,
      Id_brand,
      Usage_Instructions,
      Ingredients,
    } = req.body;

    // Validate
    if (
      !Name_product ||
      Quantity == null ||
      Price == null ||
      !Id_category_product ||
      !Id_brand
    ) {
      return res.status(400).json({
        error: "Thiếu thông tin sản phẩm",
      });
    }

    // 1. Insert sản phẩm
    const [productResult] = await connection.query(
      `INSERT INTO Products 
      (Name_product, Quantity, Size, Price, Sale_Price, Description, Status, 
       Id_category_product, Id_brand, Usage_Instructions, Ingredients)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        Name_product,
        Number(Quantity),
        Size || null,
        Number(Price),
        Sale_Price || null,
        Description || null,
        Status || 1,
        Number(Id_category_product),
        Number(Id_brand),
        Usage_Instructions || null,
        Ingredients || null,
      ]
    );

    const productId = productResult.insertId;

    // 2. Insert nhiều ảnh nếu có
    if (req.files && req.files.length > 0) {
      const imageValues = req.files.map((file) => [
        productId,
        `/image/sanpham/${file.filename}`, // URL public
      ]);

      await connection.query(
        `INSERT INTO Image_products (Id_product, Image_url)
         VALUES ?`,
        [imageValues]
      );
    }

    await connection.commit();

    res.status(201).json({
      message: "Tạo sản phẩm + ảnh thành công",
      Id_product: productId,
    });
  } catch (error) {
    await connection.rollback();
    console.error("Lỗi tạo sản phẩm:", error);
    res.status(500).json({
      error: "Lỗi server khi tạo sản phẩm",
    });
  } finally {
    connection.release();
  }
});
router.patch("/:id/status", requireAdminAuth, async (req, res) => {
  const id = req.params.id;
  const { Status } = req.body;

  await database.query(
    "UPDATE Products SET Status = ? WHERE Id_product = ?",
    [Status, id]
  );

  res.json({ message: "Cập nhật trạng thái thành công" });
});
/**
 * =========================
 * PUT: Cập nhật sản phẩm + upload ảnh mới
 * =========================
 */
router.put("/:id", requireAdminAuth, upload.array("images", 10), async (req, res) => {
  const connection = await database.getConnection();
  try {
    await connection.beginTransaction();
    const productId = req.params.id;

    const {
      Name_product,
      Quantity,
      Price,
      Id_category_product,
      Id_brand,
    } = req.body;

    if (!Name_product || Quantity == null || Price == null || !Id_category_product || !Id_brand) {
      return res.status(400).json({ error: "Thiếu thông tin sản phẩm" });
    }

    // Update product
    await connection.query(
      `UPDATE Products 
       SET Name_product = ?, Quantity = ?, Price = ?, Id_category_product = ?, Id_brand = ?
       WHERE Id_product = ?`,
      [
        Name_product,
        Number(Quantity),
        Number(Price),
        Number(Id_category_product),
        Number(Id_brand),
        productId,
      ]
    );

    // Thêm ảnh mới nếu có
    if (req.files && req.files.length > 0) {
      const imageValues = req.files.map((file) => [
        productId,
        `/image/sanpham/${file.filename}`,
      ]);

      await connection.query(
        `INSERT INTO Image_products (Id_product, Image_url) VALUES ?`,
        [imageValues]
      );
    }

    await connection.commit();
    res.json({ message: "Cập nhật sản phẩm thành công" });
  } catch (error) {
    await connection.rollback();
    console.error("Lỗi cập nhật sản phẩm:", error);
    res.status(500).json({ error: "Lỗi server khi cập nhật sản phẩm" });
  } finally {
    connection.release();
  }
});

export default router;
