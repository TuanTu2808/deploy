import express from "express";
import database from "../database.js";

const router = express.Router();

/**
 * =========================
 * GET: Lấy tất cả danh mục dịch vụ kèm số lượng dịch vụ
 * =========================
 */
router.get("/", async (req, res) => {
  try {
    console.log("Đang gọi API: /api/danhmucdichvu");

    const [rows] = await database.query(
      `SELECT 
        c.Id_category_service,
        c.Name,
        c.Is_active,
        COUNT(s.Id_services) as total_services
       FROM Categories_service c
       LEFT JOIN services s ON c.Id_category_service = s.Id_category_service
       GROUP BY c.Id_category_service, c.Name, c.Is_active
       ORDER BY c.Id_category_service DESC`
    );

    return res.status(200).json(rows);
  } catch (error) {
    console.error("Lỗi GET danh mục dịch vụ:", error);
    return res.status(500).json({
      error: "Lỗi server khi lấy danh mục dịch vụ",
      message: error.message,
    });
  }
});

/**
 * =========================
 * POST: Thêm danh mục dịch vụ mới
 * =========================
 */
router.post("/", async (req, res) => {
  const { Name } = req.body;
  if (!Name || Name.trim().length < 3) {
    return res.status(400).json({ error: "Tên danh mục không hợp lệ (ít nhất 3 ký tự)." });
  }

  try {
    const [result] = await database.query(
      "INSERT INTO Categories_service (Name, Is_active) VALUES (?, 1)",
      [Name.trim()]
    );
    return res.status(201).json({ message: "Thêm thành công", id: result.insertId });
  } catch (error) {
    console.error("Lỗi POST danh mục dịch vụ:", error);
    return res.status(500).json({ error: "Lỗi server khi thêm danh mục" });
  }
});

/**
 * =========================
 * PUT: Cập nhật tên danh mục
 * =========================
 */
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { Name } = req.body;

  if (!Name || Name.trim().length < 3) {
    return res.status(400).json({ error: "Tên danh mục không hợp lệ (ít nhất 3 ký tự)." });
  }

  try {
    const [result] = await database.query(
      "UPDATE Categories_service SET Name = ? WHERE Id_category_service = ?",
      [Name.trim(), id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Không tìm thấy danh mục" });
    }

    return res.status(200).json({ message: "Cập nhật thành công" });
  } catch (error) {
    console.error("Lỗi PUT danh mục dịch vụ:", error);
    return res.status(500).json({ error: "Lỗi server khi cập nhật danh mục" });
  }
});

/**
 * =========================
 * PATCH: Ẩn/hiện danh mục (Is_active)
 * =========================
 */
router.patch("/:id/status", async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await database.query(
      "SELECT Is_active FROM Categories_service WHERE Id_category_service = ?",
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Không tìm thấy danh mục" });
    }

    const currentStatus = rows[0].Is_active;
    const newStatus = currentStatus === 1 ? 0 : 1;

    await database.query(
      "UPDATE Categories_service SET Is_active = ? WHERE Id_category_service = ?",
      [newStatus, id]
    );

    return res.status(200).json({ message: "Cập nhật trạng thái thành công", status: newStatus });
  } catch (error) {
    console.error("Lỗi PATCH status danh mục dịch vụ:", error);
    return res.status(500).json({ error: "Lỗi server khi cập nhật trạng thái" });
  }
});

export default router;