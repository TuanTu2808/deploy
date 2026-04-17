import express from "express";
import database from "../database.js";
import { requireAdminAuth } from "../middleware/auth.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const [rows] = await database.query(`
      SELECT 
        c.Id_category_products,
        c.Name_category,
        c.Is_active,
        COUNT(p.Id_product) AS total_products
      FROM Categories_Product c
      LEFT JOIN Products p 
        ON p.Id_category_product = c.Id_category_products
        AND p.Status = 1
      GROUP BY c.Id_category_products, c.Name_category
      ORDER BY c.Is_active DESC
    `);

    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi lấy danh mục" });
  }
});


router.patch("/:id/status", requireAdminAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ message: "ID không hợp lệ" });
    }

    // Lấy trạng thái hiện tại
    const [rows] = await database.query(
      `SELECT Is_active 
       FROM Categories_Product 
       WHERE Id_category_products = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy danh mục" });
    }

    const currentStatus = rows[0].Is_active;
    const newStatus = currentStatus === 1 ? 0 : 1; // toggle

    // Cập nhật trạng thái
    await database.query(
      `UPDATE Categories_Product 
       SET Is_active = ? 
       WHERE Id_category_products = ?`,
      [newStatus, id]
    );

    res.json({
      message: newStatus === 1
        ? "Hiện danh mục thành công"
        : "Ẩn danh mục thành công",
      Is_active: newStatus,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi cập nhật trạng thái danh mục" });
  }
});

// PUT /api/danhmucsanpham/:id
router.put("/:id", requireAdminAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { Name_category } = req.body;

    await database.query(
      `UPDATE Categories_Product 
       SET Name_category = ?
       WHERE Id_category_products = ?`,
      [Name_category, id]
    );

    res.json({ message: "Cập nhật danh mục thành công" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi cập nhật danh mục" });
  }
});
// POST /api/danhmucsanpham
router.post("/", requireAdminAuth, async (req, res) => {
  try {
    const { Name_category } = req.body;

    // Validate
    if (!Name_category || !Name_category.trim()) {
      return res.status(400).json({
        message: "Tên danh mục không được để trống",
      });
    }

    // Kiểm tra trùng tên (optional nhưng nên có)
    const [exist] = await database.query(
      `SELECT Id_category_products 
       FROM Categories_Product 
       WHERE Name_category = ?`,
      [Name_category.trim()]
    );

    if (exist.length > 0) {
      return res.status(409).json({
        message: "Danh mục đã tồn tại",
      });
    }

    // Insert danh mục mới (mặc định active = 1)
    const [result] = await database.query(
      `INSERT INTO Categories_Product
       (Name_category, Is_active) 
       VALUES (?, 1)`,
      [Name_category.trim()]
    );

    res.status(201).json({
      message: "Thêm danh mục thành công",
      Id_category_products: result.insertId,
      Name_category,
      Is_active: 1,
      total_products: 0,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Lỗi thêm danh mục",
    });
  }
});
export default router;
