import express from "express";
import database from "../database.js";

const router = express.Router();

// GET: Lấy tất cả voucher
router.get("/", async (req, res) => {
  try {
    const [rows] = await database.query(
      `SELECT * FROM vouchers_product ORDER BY id_voucher DESC`
    );
    res.json(rows);
  } catch (error) {
    console.error("Lỗi GET vouchers:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
});

// GET: Lấy voucher theo ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await database.query(
      `SELECT * FROM vouchers_product WHERE id_voucher = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Voucher không tồn tại" });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error("Lỗi GET voucher theo ID:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
});

// POST: Tạo voucher mới
router.post("/", async (req, res) => {
  try {
    let {
      Name,
      Description,
      Voucher_Coder,
      Status = 1,
      Min_order_value = 0,
      Discount_value = 0,
      Discount_type = "fixed",
      Max_discount = null,
      Start_date = null,
      End_date = null,
    } = req.body;

    // ✅ FIX 1: Default nếu thiếu
    Name = Name || "Voucher mặc định";
    Description = Description || "";

    // ✅ FIX 2: Kiểm tra mã voucher trùng lặp
    if (Voucher_Coder) {
      const [existing] = await database.query(
        `SELECT id_voucher FROM vouchers_product WHERE Voucher_Coder = ?`,
        [Voucher_Coder]
      );
      if (existing.length > 0) {
        return res.status(400).json({ message: "Mã voucher đã tồn tại" });
      }
    }

    // ✅ FIX 3: Normalize discount type
    const normalizedDiscountType =
      Discount_type === "percentage" ? "percent" : Discount_type;
    if (!["percent", "fixed"].includes(normalizedDiscountType)) {
      return res.status(400).json({ message: "Discount_type không hợp lệ" });
    }

    // ✅ FIX 4: Format datetime cho MySQL
    const formatDate = (d) =>
      d ? new Date(d).toISOString().slice(0, 19).replace("T", " ") : null;

    Start_date = formatDate(Start_date) || formatDate(new Date());
    End_date =
      formatDate(End_date) ||
      formatDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));

    const [result] = await database.query(
      `INSERT INTO vouchers_product
      (Name, Description, Voucher_Coder, Status, Min_order_value, Discount_value, Discount_type, Max_discount, Start_date, End_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        Name,
        Description,
        Voucher_Coder,
        Status,
        Min_order_value,
        Discount_value,
        normalizedDiscountType,
        Max_discount,
        Start_date,
        End_date,
      ]
    );

    res.status(201).json({ id: result.insertId });

  } catch (error) {
    console.error("❌ Lỗi tạo voucher:", error); // 👈 QUAN TRỌNG
    res.status(500).json({ message: error.message });
  }
});

// PATCH: Cập nhật trạng thái voucher
router.patch("/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { Status } = req.body;

    if (Status === undefined) {
      return res.status(400).json({ message: "Thiếu trạng thái" });
    }

    const [result] = await database.query(
      `UPDATE vouchers_product SET Status = ? WHERE id_voucher = ?`,
      [Status, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Không tìm thấy voucher" });
    }

    res.json({ message: "Cập nhật trạng thái thành công" });
  } catch (error) {
    console.error("Lỗi cập nhật status:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
});

// PUT: Cập nhật voucher
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    let {
      Name,
      Description,
      Voucher_Coder,
      Status,
      Min_order_value,
      Discount_value,
      Discount_type,
      Max_discount,
      Start_date,
      End_date,
    } = req.body;

    // ✅ FIX 1: Kiểm tra mã voucher trùng lặp (loại trừ voucher hiện tại)
    if (Voucher_Coder) {
      const [existing] = await database.query(
        `SELECT id_voucher FROM vouchers_product WHERE Voucher_Coder = ? AND id_voucher != ?`,
        [Voucher_Coder, id]
      );
      if (existing.length > 0) {
        return res.status(400).json({ message: "Mã voucher đã tồn tại" });
      }
    }

    const formatDate = (d) =>
      d ? new Date(d).toISOString().slice(0, 19).replace("T", " ") : null;

    Start_date = formatDate(Start_date);
    End_date = formatDate(End_date);

    await database.query(
      `UPDATE vouchers_product
       SET Name = ?, Description = ?, Voucher_Coder = ?, Status = ?, Min_order_value = ?, Discount_value = ?, Discount_type = ?, Max_discount = ?, Start_date = ?, End_date = ?
       WHERE id_voucher = ?`,
      [
        Name,
        Description,
        Voucher_Coder,
        Status,
        Min_order_value,
        Discount_value,
        Discount_type,
        Max_discount,
        Start_date,
        End_date,
        id,
      ]
    );

    const [updated] = await database.query(
      `SELECT * FROM vouchers_product WHERE id_voucher = ?`,
      [id]
    );

    res.json(updated[0]);
  } catch (error) {
    console.error("Lỗi cập nhật voucher:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
});

// DELETE: Xóa voucher
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await database.query(
      `DELETE FROM vouchers_product WHERE id_voucher = ?`,
      [id]
    );
    res.json({ message: "Xóa thành công" });
  } catch (error) {
    console.error("Lỗi xóa voucher:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
});

export default router;