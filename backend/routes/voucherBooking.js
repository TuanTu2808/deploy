import express from "express";
import database from "../database.js";

const router = express.Router();

// ✅ Helper: Tính trạng thái voucher (is_expired, is_not_started, is_active)
const computeVoucherStatus = (voucher) => {
  const now = new Date();
  const startDate = voucher.Start_date ? new Date(voucher.Start_date) : null;
  const endDate = voucher.End_date ? new Date(voucher.End_date) : null;

  let is_expired = false;
  let is_not_started = false;
  let is_active = false;

  if (endDate && now > endDate) {
    is_expired = true;
  } else if (startDate && now < startDate) {
    is_not_started = true;
  } else if (voucher.Status === 1) {
    is_active = true;
  }

  return { ...voucher, is_expired, is_not_started, is_active };
};

const syncExpiredBookingVoucherStatus = async () => {
  await database.query(
    `UPDATE vouchers_booking SET Status = 3 WHERE Status = 1 AND End_date IS NOT NULL AND End_date < NOW()`
  );
};

// GET: Lấy tất cả voucher booking (mặc định chỉ hoạt động & chưa hết hạn)
router.get("/", async (req, res) => {
  try {
    await syncExpiredBookingVoucherStatus();

    const { admin } = req.query;
    let queryStr = `SELECT * FROM vouchers_booking`;
    
    // ✅ Nếu admin=true: lấy tất cả vouchers (bao gồm Status=0 và hết hạn)
    // ✅ Ngược lại: chỉ lấy voucher hoạt động (Status=1) và chưa hết hạn
    if (admin !== 'true') {
      queryStr += ` WHERE Status = 1 
                   AND (Start_date IS NULL OR Start_date <= NOW()) 
                   AND (End_date IS NULL OR End_date >= NOW())`;
    }
    
    queryStr += ` ORDER BY Id_voucher DESC`;
    
    const [rows] = await database.query(queryStr);
    
    // ✅ Thêm trạng thái: is_expired, is_not_started, is_active
    const vouchersWithStatus = rows.map(voucher => computeVoucherStatus(voucher));
    
    res.json(vouchersWithStatus);
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

    await syncExpiredBookingVoucherStatus();

    // ✅ CHECK: Status=1, ngày hợp lệ trong SQL
    const [rows] = await database.query(
      `SELECT * FROM vouchers_booking 
       WHERE Voucher_code = ? 
       AND Status = 1 
       AND (Start_date IS NULL OR Start_date <= NOW()) 
       AND (End_date IS NULL OR End_date >= NOW())
       LIMIT 1`,
      [code]
    );

    if (!rows.length) {
      return res.status(404).json({ message: "Mã voucher không tồn tại hoặc đã hết hạn." });
    }

    const voucher = rows[0];

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

    await syncExpiredBookingVoucherStatus();

    // ✅ Lọc trong SQL: Status=1, ngày hợp lệ, giá tối thiểu
    const [rows] = await database.query(
      `SELECT * FROM vouchers_booking 
       WHERE Status = 1 
       AND (Start_date IS NULL OR Start_date <= NOW()) 
       AND (End_date IS NULL OR End_date >= NOW())
       AND (Min_order_value IS NULL OR Min_order_value <= ?)
       ORDER BY Id_voucher DESC`,
      [total]
    );

    // Format lại cho FE dễ dùng
    const result = rows.map((v) => ({
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
    await database.query(
      `UPDATE vouchers_booking SET Status = 3 WHERE Status = 1 AND End_date IS NOT NULL AND End_date < NOW() AND Id_voucher = ?`,
      [Id]
    );

    const [rows] = await database.query(
      `SELECT * FROM vouchers_booking WHERE Id_voucher = ?`,
      [Id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Voucher booking không tồn tại" });
    }

    // ✅ Thêm trạng thái: is_expired, is_not_started, is_active
    const voucherWithStatus = computeVoucherStatus(rows[0]);
    res.json(voucherWithStatus);
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

    const formatDate = (d) => {
      if (!d) return null;
      const date = new Date(d);
      if (Number.isNaN(date.getTime())) return null;
      const YYYY = date.getFullYear();
      const MM = String(date.getMonth() + 1).padStart(2, "0");
      const DD = String(date.getDate()).padStart(2, "0");
      const hh = String(date.getHours()).padStart(2, "0");
      const mm = String(date.getMinutes()).padStart(2, "0");
      const ss = String(date.getSeconds()).padStart(2, "0");
      return `${YYYY}-${MM}-${DD} ${hh}:${mm}:${ss}`;
    };

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

    const formatDate = (d) => {
      if (!d) return null;
      const date = new Date(d);
      if (Number.isNaN(date.getTime())) return null;
      const YYYY = date.getFullYear();
      const MM = String(date.getMonth() + 1).padStart(2, "0");
      const DD = String(date.getDate()).padStart(2, "0");
      const hh = String(date.getHours()).padStart(2, "0");
      const mm = String(date.getMinutes()).padStart(2, "0");
      const ss = String(date.getSeconds()).padStart(2, "0");
      return `${YYYY}-${MM}-${DD} ${hh}:${mm}:${ss}`;
    };

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
