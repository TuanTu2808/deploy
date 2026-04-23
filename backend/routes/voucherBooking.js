import express from "express";
import database from "../database.js";

const router = express.Router();

// GET: Lấy tất cả voucher booking
router.get("/", async (req, res) => {
  try {
    const [rows] = await database.query(
      `SELECT * FROM vouchers_booking ORDER BY Id_voucher DESC`
    );
    res.json(rows);
  } catch (error) {
    console.error("Lỗi GET vouchers_booking:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
});

// GET: Kiểm tra mã voucher booking (cho booking flow)
router.get("/check", async (req, res) => {
  try {
    const code = String(req.query.code ?? "").trim();
    const total = Number(req.query.total ?? 0);

    if (!code) {
      return res.status(400).json({ message: "Mã voucher không được để trống." });
    }

    const [rows] = await database.query(
      `SELECT * FROM vouchers_booking WHERE Voucher_code = ? LIMIT 1`,
      [code]
    );

    if (!rows.length) {
      return res.status(404).json({ message: "Mã voucher không tồn tại." });
    }

    const voucher = rows[0];

    if (Number(voucher.Status) !== 1) {
      return res.status(400).json({ message: "Voucher hiện không khả dụng." });
    }

    const now = new Date();
    const startDate = new Date(voucher.Start_date);
    const endDate = new Date(voucher.End_date);
    if (now < startDate || now > endDate) {
      return res.status(400).json({ message: "Mã voucher đã hết hạn hoặc chưa đến hạn." });
    }

    const minValue = Number(voucher.Min_order_value || 0);
    if (total < minValue) {
      return res.status(400).json({
        message: `Tổng đơn phải lớn hơn hoặc bằng ${minValue.toLocaleString("vi-VN")} VNĐ.`,
      });
    }

    let discount = 0;
    const discountValue = Number(voucher.Discount_value || 0);
    if (voucher.Discount_type === "percent") {
      discount = Math.floor((total * discountValue) / 100);
    } else {
      discount = discountValue;
    }

    const maxDiscount = Number(voucher.Max_discount_amount || 0);
    if (maxDiscount > 0) {
      discount = Math.min(discount, maxDiscount);
    }

    if (discount < 0) discount = 0;
    const finalTotal = Math.max(0, total - discount);

    res.json({
      voucher: {
        id: voucher.Id_voucher,
        code: voucher.Voucher_code,
        name: voucher.Name,
        description: voucher.Description,
        discountType: voucher.Discount_type,
        discountValue: Number(voucher.Discount_value || 0),
        maxDiscountAmount: Number(voucher.Max_discount_amount || 0),
      },
      total,
      discount,
      finalTotal,
    });
  } catch (error) {
    console.error("Lỗi check voucher booking:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
});

// GET: Lấy danh sách voucher khả dụng cho booking
router.get("/available", async (req, res) => {
  try {
    const total = Number(req.query.total ?? 0);
    const now = new Date();

    const [rows] = await database.query(
      `SELECT * FROM vouchers_booking WHERE Status = 1`
    );

    // lọc logic giống /check
    const validVouchers = rows.filter((v) => {
      const start = new Date(v.Start_date);
      const end = new Date(v.End_date);

      if (now < start || now > end) return false;

      const minValue = Number(v.Min_order_value || 0);
      if (total < minValue) return false;

      return true;
    });

    // format lại cho FE dễ dùng
    const result = validVouchers.map((v) => ({
      id: v.Id_voucher,
      code: v.Voucher_code,
      name: v.Name,
      description: v.Description,
      discountType: v.Discount_type,
      discountValue: Number(v.Discount_value || 0),
      maxDiscountAmount: Number(v.Max_discount_amount || 0),
      minOrderValue: Number(v.Min_order_value || 0),
    }));

    res.json(result);
  } catch (error) {
    console.error("Lỗi GET available vouchers:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
});

// GET: Lấy voucher booking theo ID
router.get("/:Id", async (req, res) => {
  try {
    const { Id } = req.params;
    const [rows] = await database.query(
      `SELECT * FROM vouchers_booking WHERE Id_voucher = ?`,
      [Id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Voucher booking không tồn tại" });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error("Lỗi GET voucher booking theo ID:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
});


// POST: Tạo voucher booking mới
router.post("/", async (req, res) => {
  try {
    let {
      Name,
      Description,
      Voucher_code,
      Status = 1,
      Min_order_value = 0,
      Discount_value = 0,
      Discount_type = "fixed",
      Max_discount_amount = null,
      Start_date = null,
      End_date = null,
    } = req.body;

    Name = Name || "Voucher booking";
    Description = Description || "";

    if (!Voucher_code || String(Voucher_code).trim() === "") {
      return res.status(400).json({ message: "Voucher_code không được để trống" });
    }

    // Trùng mã voucher booking
    const [existing] = await database.query(
      `SELECT Id_voucher FROM vouchers_booking WHERE Voucher_code = ?`,
      [Voucher_code]
    );
    if (existing.length > 0) {
      return res.status(400).json({ message: "Mã voucher booking đã tồn tại" });
    }

    const normalizedDiscountType =
      Discount_type === "percentage" ? "percent" : Discount_type;
    if (!["percent", "fixed"].includes(normalizedDiscountType)) {
      return res.status(400).json({ message: "Discount_type không hợp lệ" });
    }

    const formatDate = (d) =>
      d ? new Date(d).toISOString().slice(0, 19).replace("T", " ") : null;

    const startDateFormatted = formatDate(Start_date) || formatDate(new Date());
    const endDateFormatted =
      formatDate(End_date) || formatDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));

    const [result] = await database.query(
      `INSERT INTO vouchers_booking
         (Name, Description, Voucher_code, Status, Min_order_value, Discount_value, Discount_type, Max_discount_amount, Start_date, End_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        Name,
        Description,
        Voucher_code,
        Status,
        Min_order_value,
        Discount_value,
        normalizedDiscountType,
        Max_discount_amount,
        startDateFormatted,
        endDateFormatted,
      ]
    );

    res.status(201).json({ Id_voucher: result.insertId });
  } catch (error) {
    console.error("Lỗi tạo voucher booking:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
});

// PATCH: Cập nhật status voucher booking
router.patch("/:Id/status", async (req, res) => {
  try {
    const { Id } = req.params;
    const { Status } = req.body;

    if (Status === undefined) {
      return res.status(400).json({ message: "Thiếu trạng thái" });
    }

    const [result] = await database.query(
      `UPDATE vouchers_booking SET Status = ? WHERE Id_voucher = ?`,
      [Status, Id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Không tìm thấy voucher booking" });
    }

    res.json({ message: "Cập nhật trạng thái thành công" });
  } catch (error) {
    console.error("Lỗi cập nhật status voucher booking:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
});

// PUT: Cập nhật voucher booking
router.put("/:Id", async (req, res) => {
  try {
    const { Id } = req.params;
    const {
      Name,
      Description,
      Voucher_code,
      Status,
      Min_order_value,
      Discount_value,
      Discount_type,
      Max_discount_amount,
      Start_date,
      End_date,
      Voucher_Coder,
    } = req.body;

    const codeValue = (Voucher_code ?? Voucher_Coder ?? "").toString().trim();

    if (!codeValue) {
      return res.status(400).json({ message: "Voucher_code không được để trống" });
    }

    const formatDate = (d) =>
      d ? new Date(d).toISOString().slice(0, 19).replace("T", " ") : null;

    await database.query(
      `UPDATE vouchers_booking
       SET Name = ?, Description = ?, Voucher_code = ?, Status = ?, Min_order_value = ?, Discount_value = ?, Discount_type = ?, Max_discount_amount = ?, Start_date = ?, End_date = ?
       WHERE Id_voucher = ?`,
      [
        Name,
        Description,
        codeValue,
        Status,
        Min_order_value,
        Discount_value,
        Discount_type,
        Max_discount_amount,
        formatDate(Start_date),
        formatDate(End_date),
        Id,
      ]
    );

    const [updated] = await database.query(
      `SELECT * FROM vouchers_booking WHERE Id_voucher = ?`,
      [Id]
    );

    res.json(updated[0]);
  } catch (error) {
    console.error("Lỗi cập nhật voucher booking:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
});

export default router;
