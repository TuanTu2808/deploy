import express from "express";
import database from "../database.js";

const router = express.Router();

/**
 * =========================
 * GET: Lấy tất cả danh mục dịch vụ
 * =========================
 */
router.get("/", async (req, res) => {
  try {
    console.log("Đang gọi API: /api/danhmucdichvu");

    const [rows] = await database.query(
      `SELECT 
        Id_category_service,
        Name,
        Is_active
       FROM Categories_service
       ORDER BY Id_category_service DESC`
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



export default router;