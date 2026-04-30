import express from "express";
import database from "../database.js";
import { requireAuth } from "../middleware/auth.js";
import fs from "fs";
import path from "path";
import multer from "multer";

const router = express.Router();

const resultUploadDir = path.join(process.cwd(), "public", "image", "results");
fs.mkdirSync(resultUploadDir, { recursive: true });

const resultStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, resultUploadDir),
  filename: (_req, file, cb) => {
    const safeOriginal = file.originalname.replace(/[^\w.-]/g, "_");
    cb(null, `${Date.now()}-${safeOriginal}`);
  },
});

const uploadResult = multer({
  storage: resultStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

const normalizePhone = (value) => String(value ?? "").replace(/[^\d]/g, "");
const ALLOWED_STATUS = ["pending", "confirmed", "processing", "completed", "cancelled"];
const toBookingCode = (id) => `BKG-${String(id).padStart(6, "0")}`;
const parseBookingId = (raw) => {
  const digits = String(raw ?? "").replace(/[^\d]/g, "");
  return Number(digits);
};
const createError = (message, status = 400) => {
  const error = new Error(message);
  error.status = status;
  return error;
};
const toMinutes = (timeStr) => {
  if (!timeStr) return 0;
  if (typeof timeStr === 'number') return timeStr;
  const StringTime = String(timeStr);
  if (!StringTime.includes(':')) return Number(StringTime) || 0;
  const parts = StringTime.split(':');
  const h = Number(parts[0]) || 0;
  const m = Number(parts[1]) || 0;
  return h * 60 + m;
};

const toTimeString = (minutes) => {
  const total = Number(minutes);
  if (!Number.isFinite(total)) return "00:00:00";
  const hrs = Math.floor(total / 60);
  const mins = total % 60;
  return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(
    2,
    "0"
  )}:00`;
};

router.get("/me", requireAuth, async (req, res) => {
  try {
    const userId = req.auth.id;
    const status = String(req.query.status ?? "").trim().toLowerCase();
    const search = String(req.query.search ?? "").trim();

    let query = `
      SELECT
        b.Id_booking,
        b.Booking_date,
        b.Start_time,
        b.Status,
        b.Total_price,
        b.Note,
        b.Created_booking,
        b.Id_store,
        b.Description_cancel,
        b.Discount_amount,
        b.Final_price,
        s.Name_store AS Store_name,
        s.Address AS Store_address,
        s.Province AS Store_province,
        s.Ward AS Store_ward,
        b.Id_stylist,
        st.Name_user AS Stylist_name
      FROM Bookings b
      LEFT JOIN Stores s ON b.Id_store = s.Id_store
      LEFT JOIN Users st ON b.Id_stylist = st.Id_user
      WHERE b.Id_user = ?
    `;
    const params = [userId];

    if (status && ALLOWED_STATUS.includes(status)) {
      query += " AND b.Status = ?";
      params.push(status);
    }

    if (search) {
      const maybeId = parseBookingId(search);
      query += " AND (b.Id_booking = ? OR s.Name_store LIKE ? OR st.Name_user LIKE ?)";
      params.push(Number.isFinite(maybeId) ? maybeId : 0);
      params.push(`%${search}%`);
      params.push(`%${search}%`);
    }

    query += " ORDER BY b.Start_time DESC, b.Id_booking DESC";

    const [bookingRows] = await database.query(query, params);
    if (!bookingRows.length) {
      return res.json({ bookings: [] });
    }

    const bookingIds = bookingRows.map((row) => row.Id_booking);
    const [detailRows] = await database.query(
      `
        SELECT
          bd.Id_booking,
          bd.Id_Booking_detail,
          bd.Price_at_booking,
          bd.Duration_time,
          bd.Id_services,
          bd.Id_combo,
          sv.Name AS Service_name,
          cb.Name AS Combo_name
        FROM Booking_detail bd
        LEFT JOIN Services sv ON sv.Id_services = bd.Id_services
        LEFT JOIN Combos cb ON cb.Id_combo = bd.Id_combo
        WHERE bd.Id_booking IN (?)
        ORDER BY bd.Id_Booking_detail ASC
      `,
      [bookingIds]
    );

    const detailMap = new Map();
    for (const detail of detailRows) {
      const list = detailMap.get(detail.Id_booking) || [];
      list.push(detail);
      detailMap.set(detail.Id_booking, list);
    }

    const bookings = bookingRows.map((booking) => {
      const details = detailMap.get(booking.Id_booking) || [];
      const names = details
        .map((item) => item.Combo_name || item.Service_name)
        .filter(Boolean);

      const totalDuration = details.reduce((sum, item) => {
        const raw = String(item.Duration_time || "");
        if (!raw.includes(":")) return sum;
        const [h = "0", m = "0"] = raw.split(":");
        return sum + Number(h || 0) * 60 + Number(m || 0);
      }, 0);

      return {
        ...booking,
        Booking_code: toBookingCode(booking.Id_booking),
        Total_items: details.length,
        Duration_minutes: totalDuration,
        Services_preview: names.slice(0, 3),
      };
    });

    return res.json({ bookings });
  } catch (error) {
    console.error("Loi lay lich su dat lich cua toi:", error);
    return res.status(500).json({ message: "Loi server." });
  }
});

router.get("/me/:bookingId", requireAuth, async (req, res) => {
  try {
    const userId = req.auth.id;
    const bookingId = parseBookingId(req.params.bookingId);

    if (!bookingId) {
      return res.status(400).json({ message: "Ma lich hen khong hop le." });
    }

    const [bookingRows] = await database.query(
      `
        SELECT
          b.Id_booking,
          b.Booking_date,
          b.Start_time,
          b.Status,
          b.Total_price,
          b.Note,
          b.Created_booking,
          b.Id_store,
          b.Description_cancel,
          b.Discount_amount,
          b.Final_price,
          s.Name_store AS Store_name,
          s.Address AS Store_address,
          s.Province AS Store_province,
          s.Ward AS Store_ward,
          s.Phone AS Store_phone,
          b.Id_stylist,
          st.Name_user AS Stylist_name,
          st.Phone AS Stylist_phone
        FROM Bookings b
        LEFT JOIN Stores s ON b.Id_store = s.Id_store
        LEFT JOIN Users st ON b.Id_stylist = st.Id_user
        WHERE b.Id_booking = ? AND b.Id_user = ?
        LIMIT 1
      `,
      [bookingId, userId]
    );

    const booking = bookingRows[0];
    if (!booking) {
      return res.status(404).json({ message: "Khong tim thay lich hen." });
    }

    const [details] = await database.query(
      `
        SELECT
          bd.Id_Booking_detail,
          bd.Price_at_booking,
          bd.Duration_time,
          bd.Id_services,
          bd.Id_combo,
          sv.Name AS Service_name,
          cb.Name AS Combo_name,
          br.Rating AS Item_rating,
          br.Description AS Item_description
        FROM Booking_detail bd
        LEFT JOIN Services sv ON sv.Id_services = bd.Id_services
        LEFT JOIN Combos cb ON cb.Id_combo = bd.Id_combo
        LEFT JOIN booking_rating br ON br.Id_booking_detail = bd.Id_Booking_detail AND br.Id_user = ?
        WHERE bd.Id_booking = ?
        ORDER BY bd.Id_Booking_detail ASC
      `,
      [userId, bookingId]
    );

    const items = details.map((item) => ({
      Id_Booking_detail: item.Id_Booking_detail,
      Id_services: item.Id_services,
      Id_combo: item.Id_combo,
      Item_type: item.Id_combo ? "combo" : "service",
      Name: item.Combo_name || item.Service_name || "Dich vu",
      Price_at_booking: Number(item.Price_at_booking || 0),
      Duration_time: item.Duration_time,
      Rating: item.Item_rating || null,
      Description: item.Item_description || null,
    }));

    const durationMinutes = items.reduce((sum, item) => {
      const raw = String(item.Duration_time || "");
      if (!raw.includes(":")) return sum;
      const [h = "0", m = "0"] = raw.split(":");
      return sum + Number(h || 0) * 60 + Number(m || 0);
    }, 0);

    const [imageRows] = await database.query(
      `SELECT Image FROM booking_result_images WHERE Id_booking = ?`,
      [bookingId]
    );

    return res.json({
      booking: {
        ...booking,
        Booking_code: toBookingCode(booking.Id_booking),
        Duration_minutes: durationMinutes,
        items,
        resultImages: imageRows.map(r => r.Image).filter(Boolean),
      },
    });
  } catch (error) {
    console.error("Loi lay chi tiet lich su dat lich:", error);
    return res.status(500).json({ message: "Loi server." });
  }
});

router.get("/", async (req, res) => {
  try {
    const { status, storeId, stylistId, date } = req.query;
    let query = `
      SELECT
        b.Id_booking AS id,
        b.Booking_date AS booking_date,
        b.Start_time AS start_time,
        b.Status AS status,
        b.Total_price AS total_price,
        b.Note AS note,
        b.Description_cancel AS description_cancel,
        b.Created_booking AS created_booking,
        s.Name_store AS store_name,
        u.Name_user AS customer_name,
        u.Phone AS customer_phone,
        b.Id_stylist AS stylist_id,
        st.Name_user AS stylist_name
      FROM Bookings b
      LEFT JOIN Users u ON b.Id_user = u.Id_user
      LEFT JOIN Stores s ON b.Id_store = s.Id_store
      LEFT JOIN Users st ON b.Id_stylist = st.Id_user
    `;
    const params = [];

    if (status) {
      query += " WHERE b.Status = ?";
      params.push(String(status));
    }

    if (storeId) {
      query += params.length ? " AND" : " WHERE";
      query += " b.Id_store = ?";
      params.push(Number(storeId));
    }

    if (stylistId) {
      query += params.length ? " AND" : " WHERE";
      query += " b.Id_stylist = ?";
      params.push(Number(stylistId));
    }

    if (date) {
      query += params.length ? " AND" : " WHERE";
      query += " b.Booking_date = ?";
      params.push(String(date));
    }

    query += " ORDER BY b.Start_time ASC";

    const [rows] = await database.query(query, params);

    const [serviceRows] = await database.query(`
      SELECT
        bd.Id_booking AS booking_id,
        GROUP_CONCAT(sv.Name SEPARATOR ', ') AS service_names,
        GROUP_CONCAT(cb.Name SEPARATOR ', ') AS combo_names,
        GROUP_CONCAT(bd.Id_services SEPARATOR ',') AS service_ids,
        GROUP_CONCAT(bd.Id_combo SEPARATOR ',') AS combo_ids
      FROM Booking_detail bd
      LEFT JOIN Services sv ON bd.Id_services = sv.Id_services
      LEFT JOIN Combos cb ON bd.Id_combo = cb.Id_combo
      GROUP BY bd.Id_booking
    `);

    const [durationRows] = await database.query(`
      SELECT Id_booking AS booking_id, Duration_time
      FROM Booking_detail
    `);

    const serviceMap = new Map(
      serviceRows.map((row) => [row.booking_id, row])
    );

    const durationMap = {};
    for (const r of durationRows) {
      if (!durationMap[r.booking_id]) durationMap[r.booking_id] = 0;
      durationMap[r.booking_id] += toMinutes(r.Duration_time);
    }

    const data = rows.map((row) => {
      const svData = serviceMap.get(row.id);
      return {
        ...row,
        service_names: svData?.service_names || null,
        combo_names: svData?.combo_names || null,
        service_ids: svData?.service_ids ? Array.from(new Set(svData.service_ids.split(',').filter(id => id && id !== 'null').map(Number))) : [],
        combo_ids: svData?.combo_ids ? Array.from(new Set(svData.combo_ids.split(',').filter(id => id && id !== 'null').map(Number))) : [],
        total_duration_minutes: durationMap[row.id] || 0
      };
    });

    res.json(data);
  } catch (error) {
    console.error("Lỗi lấy lịch hẹn:", error);
    res.status(500).json({ message: "Lỗi server." });
  }
});

router.post("/", async (req, res) => {
  const phone = normalizePhone(req.body?.phone);
  const storeId = Number(req.body?.storeId);

  let stylistId = req.body?.stylistId;
  stylistId = (stylistId !== undefined && stylistId !== null) ? Number(stylistId) : null;
  if (stylistId === -1 || Number.isNaN(stylistId)) stylistId = null;

  const date = String(req.body?.date ?? "").trim();
  const time = String(req.body?.time ?? "").trim();
  const serviceIds = Array.isArray(req.body?.serviceIds)
    ? Array.from(
      new Set(
        req.body.serviceIds
          .map((id) => Number(id))
          .filter((id) => Number.isFinite(id) && id > 0)
      )
    ).slice(0, 3)
    : [];
  const comboIds = Array.isArray(req.body?.comboIds)
    ? Array.from(
      new Set(
        req.body.comboIds
          .map((id) => Number(id))
          .filter((id) => Number.isFinite(id) && id > 0)
      )
    )
    : [];
  if (!phone) {
    return res.status(400).json({ message: "Vui lòng nhập số điện thoại." });
  }

  if (phone.length < 9 || phone.length > 11) {
    return res.status(400).json({ message: "Số điện thoại không hợp lệ." });
  }

  if (!storeId) {
    return res.status(400).json({ message: "Thiếu thông tin salon." });
  }

  if (!date || !time) {
    return res.status(400).json({ message: "Thiếu ngày hoặc giờ hẹn." });
  }

  if (serviceIds.length === 0 && comboIds.length === 0) {
    return res.status(400).json({ message: "Chưa chọn dịch vụ hoặc combo." });
  }

  const connection = await database.getConnection();

  try {
    await connection.beginTransaction();
    const [storeRows] = await connection.query(
      "SELECT Id_store FROM Stores WHERE Id_store = ? LIMIT 1",
      [storeId]
    );
    if (!storeRows.length) {
      throw createError("Salon không tồn tại.");
    }

    // ===== CHECK STYLIST =====
    if (stylistId !== null) {
      const [stylistRows] = await connection.query(
        "SELECT Id_user FROM Users WHERE Id_user = ? LIMIT 1",
        [stylistId]
      );
      if (!stylistRows.length) {
        throw createError("Stylist không tồn tại.");
      }
    }

    // ===== FETCH SERVICES =====
    let serviceRows = [];
    if (serviceIds.length > 0) {
      const [rows] = await connection.query(
        `
        SELECT Id_services, Price, Sale_Price, Duration_time
        FROM Services
        WHERE Id_services IN (?)
        `,
        [serviceIds]
      );

      if (rows.length !== serviceIds.length) {
        throw createError("Dịch vụ không hợp lệ.");
      }

      serviceRows = rows;
    }

    // ===== FETCH COMBOS =====
    let comboRows = [];
    if (comboIds.length > 0) {
      const [rows] = await connection.query(
        `
        SELECT Id_combo, Price, Duration_time
        FROM Combos
        WHERE Id_combo IN (?)
        `,
        [comboIds]
      );

      if (rows.length !== comboIds.length) {
        throw createError("Combo không hợp lệ.");
      }

      comboRows = rows;
    }

    // ===== CALCULATE TOTAL =====
    const totalService = serviceRows.reduce((sum, item) => {
      const price =
        Number(item.Sale_Price) > 0
          ? Number(item.Sale_Price)
          : Number(item.Price);
      return sum + (Number.isFinite(price) ? price : 0);
    }, 0);

    const totalCombo = comboRows.reduce((sum, item) => {
      const price = Number(item.Price);
      return sum + (Number.isFinite(price) ? price : 0);
    }, 0);

    const total = totalService + totalCombo;

    let voucherCode = String(req.body?.voucherCode || "").trim();
    let voucherData = null;
    let discountAmount = 0;
    let finalTotal = total - discountAmount;

    if (voucherCode) {
      const [vouchers] = await connection.query(
        "SELECT * FROM vouchers_booking WHERE Voucher_code = ? LIMIT 1",
        [voucherCode]
      );
      if (!vouchers || vouchers.length === 0) {
        throw createError("Mã voucher không tồn tại hoặc không hợp lệ.");
      }

      const voucher = vouchers[0];

      if (Number(voucher.Status) !== 1) {
        throw createError("Voucher hiện không khả dụng.");
      }

      const now = new Date();
      const startDate = new Date(voucher.Start_date);
      const endDate = new Date(voucher.End_date);
      if (now < startDate || now > endDate) {
        throw createError("Mã voucher đã hết hạn hoặc chưa đến thời gian áp dụng.");
      }

      const minValue = Number(voucher.Min_order_value || 0);
      if (total < minValue) {
        throw createError(
          `Tổng đơn phải lớn hơn hoặc bằng ${minValue.toLocaleString("vi-VN")} VNĐ để sử dụng mã.`
        );
      }

      const discountValue = Number(voucher.Discount_value || 0);
      if (voucher.Discount_type === "percent") {
        discountAmount = Math.floor((total * discountValue) / 100);
      } else {
        discountAmount = discountValue;
      }

      const maxDiscount = Number(voucher.Max_discount_amount || 0);
      if (maxDiscount > 0) {
        discountAmount = Math.min(discountAmount, maxDiscount);
      }

      if (discountAmount < 0) discountAmount = 0;
      finalTotal = Math.max(0, total - discountAmount);
      voucherData = voucher;
    }

    // ===== GET / CREATE USER =====
    const [userRows] = await connection.query(
      "SELECT Id_user FROM Users WHERE Phone = ? LIMIT 1",
      [phone]
    );

    let userId = userRows?.[0]?.Id_user;

    if (!userId) {
      const email = `${phone}@quick.25zone`;
      const [userResult] = await connection.query(
        `
        INSERT INTO Users
        (Name_user, Phone, Email, Pass_word, Address, Image, role, Id_store)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          "Khách đặt lịch",
          phone,
          email,
          "123",
          "Đặt lịch online",
          null,
          "user",
          storeId,
        ]
      );
      userId = userResult.insertId;
    }

    // ===== CHECK EXISTING BOOKING (SAME DAY - NOT COMPLETED) =====
    const [existingBooking] = await connection.query(
      `
  SELECT Id_booking
  FROM Bookings
  WHERE Id_user = ?
    AND Booking_date = ?
    AND Status IN ('pending', 'confirmed', 'processing')
  LIMIT 1
  `,
      [userId, date] // ⚠️ dùng date user chọn
    );

    if (existingBooking.length > 0) {
      throw createError(
        "Bạn đã có lịch hẹn trong ngày này chưa hoàn thành. Vui lòng hoàn tất trước khi đặt lịch mới."
      );
    }

    // ===== CREATE BOOKING =====
    const startTime = `${date} ${time}:00`;
    let note = "Đặt lịch theo luồng website.";
    if (voucherData) {
      note += ` Áp dụng voucher: ${voucherCode}, giảm ${discountAmount.toLocaleString("vi-VN")} VNĐ`;
    }

    const [bookingResult] = await connection.query(
      `
  INSERT INTO Bookings
  (Booking_date, Start_time, Phone, Note, Total_price, Discount_amount, Final_price, Status, Id_store, Id_user, Id_stylist)
  VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)
  `,
      [
        date,
        startTime,
        phone,
        note,

        total,
        discountAmount,
        finalTotal,

        storeId,
        userId,
        stylistId
      ]
    );

    const bookingId = bookingResult.insertId;

    // ===== BUILD BOOKING DETAILS =====
    const serviceDetails = serviceRows.map((service) => {
      const price =
        Number(service.Sale_Price) > 0
          ? Number(service.Sale_Price)
          : Number(service.Price);

      const duration = String(service.Duration_time ?? "");
      const durationTime =
        duration.includes(":") ? duration : toTimeString(duration);

      return [price, durationTime, bookingId, service.Id_services, null];
    });

    const comboDetails = comboRows.map((combo) => {
      const price = Number(combo.Price);

      const duration = String(combo.Duration_time ?? "");
      const durationTime =
        duration.includes(":") ? duration : toTimeString(duration);

      return [price, durationTime, bookingId, null, combo.Id_combo];
    });

    const detailValues = [...serviceDetails, ...comboDetails];

    // ===== INSERT DETAILS =====
    if (detailValues.length > 0) {
      await connection.query(
        `
        INSERT INTO Booking_detail
        (Price_at_booking, Duration_time, Id_booking, Id_services, Id_combo)
        VALUES ?
        `,
        [detailValues]
      );
    }

    // ===== UPDATE SLOT STATUS (MULTI-SLOT LOCKING) =====
    const totalDurationMinutes =
      serviceRows.reduce((sum, s) => sum + toMinutes(s.Duration_time), 0) +
      comboRows.reduce((sum, c) => sum + toMinutes(c.Duration_time), 0);

    const slotDurationMinutes = 30;
    const numSlotsToLock = Math.ceil(totalDurationMinutes / slotDurationMinutes);

    if (stylistId) {
      const [shiftRows] = await connection.query(
        "SELECT Id_work_shifts FROM Work_shifts WHERE Id_user = ? AND Shift_date = ?",
        [stylistId, date]
      );

      if (shiftRows.length > 0) {
        const shiftId = shiftRows[0].Id_work_shifts;
        const normalizedStartTime = time.length === 5 ? `${time}:00` : time;

        const [allSlots] = await connection.query(
          "SELECT Id_work_shifts_hour, Hours, Status FROM Work_shifts_hours WHERE Id_work_shifts = ? ORDER BY Hours ASC",
          [shiftId]
        );

        const startIndex = allSlots.findIndex(
          (s) =>
            String(s.Hours).substring(0, 5) ===
            normalizedStartTime.substring(0, 5)
        );

        if (startIndex !== -1) {
          const slotsToLock = allSlots.slice(
            startIndex,
            startIndex + numSlotsToLock
          );

          // ✅ CHECK TRÙNG SLOT (QUAN TRỌNG)
          const conflictSlots = slotsToLock.filter((s) => s.Status === 0);

          if (conflictSlots.length > 0) {
            throw createError(
              "Khung giờ này đã được đặt. Vui lòng chọn thời gian khác."
            );
          }

          const slotIds = slotsToLock.map((s) => s.Id_work_shifts_hour);

          if (slotIds.length > 0) {
            await connection.query(
              "UPDATE Work_shifts_hours SET Status = 0 WHERE Id_work_shifts_hour IN (?)",
              [slotIds]
            );
          }
        }
      }
    }
    await connection.commit();

    res.json({
      message: "Đặt lịch thành công.",
      bookingId,
      total,
      discountAmount,
      finalTotal,
      voucherCode: voucherData ? voucherCode : null,
    });
  } catch (error) {
    await connection.rollback();
    const status = typeof error?.status === "number" ? error.status : 500;

    console.error("Lỗi tạo lịch hẹn:", error);

    res.status(status).json({
      message:
        status === 500
          ? "Lỗi server."
          : error?.message || "Lỗi dữ liệu.",
    });
  } finally {
    connection.release();
  }
});

router.post("/rating", requireAuth, async (req, res) => {
  try {
    const userId = req.auth.id;
    const { detailId, rating, description } = req.body;

    if (!detailId || !rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Dữ liệu đánh giá không hợp lệ." });
    }

    const [bookingRows] = await database.query(`
      SELECT b.Status
      FROM Booking_detail bd
      INNER JOIN Bookings b ON b.Id_booking = bd.Id_booking
      WHERE bd.Id_Booking_detail = ? AND b.Id_user = ?
    `, [detailId, userId]);

    if (!bookingRows.length) {
      return res.status(404).json({ message: "Không tìm thấy dịch vụ." });
    }
    if (bookingRows[0].Status !== 'completed') {
      return res.status(400).json({ message: "Chỉ có thể đánh giá dịch vụ đã hoàn thành." });
    }

    const [existing] = await database.query(`
      SELECT Id_Booking_rating FROM booking_rating WHERE Id_booking_detail = ? AND Id_user = ?
    `, [detailId, userId]);

    if (existing.length > 0) {
      await database.query(`
        UPDATE booking_rating SET Rating = ?, Description = ? WHERE Id_Booking_rating = ?
      `, [rating, description || null, existing[0].Id_Booking_rating]);
    } else {
      await database.query(`
        INSERT INTO booking_rating (Id_booking_detail, Id_user, Rating, Description) VALUES (?, ?, ?, ?)
      `, [detailId, userId, rating, description || null]);
    }

    return res.json({ message: "Đánh giá thành công." });
  } catch (error) {
    console.error("Lỗi đánh giá dịch vụ:", error);
    return res.status(500).json({ message: "Lỗi server." });
  }
});

router.patch("/:id", async (req, res) => {
  const bookingId = Number(req.params.id);
  if (!bookingId) {
    return res.status(400).json({ message: "Id lịch hẹn không hợp lệ." });
  }

  const { status, stylistId, date, time, note, description_cancel, serviceIds, comboIds } = req.body;
  const updates = [];
  const params = [];
  const allowedStatuses = [
    "pending",
    "confirmed",
    "processing",
    "completed",
    "cancelled",
  ];

  if (status) {
    if (!allowedStatuses.includes(String(status))) {
      return res.status(400).json({ message: "Trạng thái không hợp lệ." });
    }
    updates.push("Status = ?");
    params.push(String(status));
  }

  if (description_cancel !== undefined) {
    updates.push("Description_cancel = ?");
    params.push(String(description_cancel || ""));
  }

  if (stylistId !== undefined) {
    updates.push("Id_stylist = ?");
    params.push(stylistId ? Number(stylistId) : null);
  }

  if (note !== undefined) {
    updates.push("Note = ?");
    params.push(String(note ?? ""));
  }

  if (date && time) {
    const timeValue = String(time).length === 5 ? `${time}:00` : String(time);
    const startTime = `${date} ${timeValue}`;
    updates.push("Start_time = ?");
    params.push(startTime);
    updates.push("Booking_date = ?");
    params.push(String(date));
  } else if (date) {
    updates.push("Booking_date = ?");
    params.push(String(date));
  }

  const hasServiceChanges = Array.isArray(serviceIds) || Array.isArray(comboIds);

  if (updates.length === 0 && !hasServiceChanges) {
    return res.status(400).json({ message: "Không có dữ liệu để cập nhật." });
  }

  const connection = await database.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Lấy thông tin lịch hẹn hiện tại (để biết slots cũ)
    const [b] = await connection.query(
      "SELECT Id_stylist, Booking_date, Start_time, Total_price, Discount_amount, Final_price FROM Bookings WHERE Id_booking = ?",
      [bookingId]
    );

    if (b.length === 0) {
      throw createError("Không tìm thấy lịch hẹn.", 404);
    }
    const currentBooking = b[0];

    // Lấy details cũ để tính thời lượng cũ
    const [oldDetails] = await connection.query(
      "SELECT Duration_time FROM Booking_detail WHERE Id_booking = ?",
      [bookingId]
    );
    let oldTotalDurationMin = oldDetails.reduce((sum, item) => sum + toMinutes(item.Duration_time), 0);

    // Function giải phóng slot cũ
    const releaseOldSlots = async () => {
      const { Id_stylist, Booking_date, Start_time } = currentBooking;
      if (!Id_stylist) return;

      const [shiftRows] = await connection.query(
        "SELECT Id_work_shifts FROM Work_shifts WHERE Id_user = ? AND Shift_date = ?",
        [Id_stylist, Booking_date]
      );
      if (shiftRows.length > 0) {
        let timeOnly = "";
        if (Start_time instanceof Date) {
          timeOnly = Start_time.toTimeString().split(" ")[0];
        } else {
          const parts = String(Start_time).split(" ");
          timeOnly = parts.length > 1 ? parts[1] : parts[0];
          if (timeOnly.length === 5) timeOnly += ":00";
        }

        const numSlotsToUpdate = Math.max(1, Math.ceil(oldTotalDurationMin / 30));
        const [allSlots] = await connection.query(
          "SELECT Id_work_shifts_hour, Hours, Status FROM Work_shifts_hours WHERE Id_work_shifts = ? ORDER BY Hours ASC",
          [shiftRows[0].Id_work_shifts]
        );
        const startIndex = allSlots.findIndex(s => String(s.Hours).substring(0, 5) === timeOnly.substring(0, 5));
        if (startIndex !== -1) {
          const slotsToUpdate = allSlots.slice(startIndex, startIndex + numSlotsToUpdate);
          const slotIds = slotsToUpdate.map(s => s.Id_work_shifts_hour);
          if (slotIds.length > 0) {
            await connection.query(
              "UPDATE Work_shifts_hours SET Status = 1 WHERE Id_work_shifts_hour IN (?)",
              [slotIds]
            );
          }
        }
      }
    };

    let newTotalDurationMin = oldTotalDurationMin;

    // 2. Nếu có thay đổi dịch vụ
    if (hasServiceChanges) {
      let serviceRows = [];
      const safeServiceIds = Array.isArray(serviceIds) ? Array.from(new Set(serviceIds.map(Number).filter(id => id > 0))) : [];
      if (safeServiceIds.length > 0) {
        const [rows] = await connection.query(
          "SELECT Id_services, Price, Sale_Price, Duration_time FROM Services WHERE Id_services IN (?)",
          [safeServiceIds]
        );
        if (rows.length !== safeServiceIds.length) throw createError("Dịch vụ không hợp lệ.");
        serviceRows = rows;
      }

      let comboRows = [];
      const safeComboIds = Array.isArray(comboIds) ? Array.from(new Set(comboIds.map(Number).filter(id => id > 0))) : [];
      if (safeComboIds.length > 0) {
        const [rows] = await connection.query(
          "SELECT Id_combo, Price, Duration_time FROM Combos WHERE Id_combo IN (?)",
          [safeComboIds]
        );
        if (rows.length !== safeComboIds.length) throw createError("Combo không hợp lệ.");
        comboRows = rows;
      }

      if (safeServiceIds.length === 0 && safeComboIds.length === 0) {
        throw createError("Chưa chọn dịch vụ hoặc combo.");
      }

      const totalService = serviceRows.reduce((sum, item) => {
        const price = Number(item.Sale_Price) > 0 ? Number(item.Sale_Price) : Number(item.Price);
        return sum + (Number.isFinite(price) ? price : 0);
      }, 0);

      const totalCombo = comboRows.reduce((sum, item) => {
        const price = Number(item.Price);
        return sum + (Number.isFinite(price) ? price : 0);
      }, 0);

      const newTotal = totalService + totalCombo;
      const discountAmount = Number(currentBooking.Discount_amount || 0);
      const newFinalPrice = Math.max(0, newTotal - discountAmount);

      updates.push("Total_price = ?");
      params.push(newTotal);
      updates.push("Final_price = ?");
      params.push(newFinalPrice);

      newTotalDurationMin =
        serviceRows.reduce((sum, s) => sum + toMinutes(s.Duration_time), 0) +
        comboRows.reduce((sum, c) => sum + toMinutes(c.Duration_time), 0);

      // Xoá details cũ và thêm details mới
      await connection.query("DELETE FROM Booking_detail WHERE Id_booking = ?", [bookingId]);

      const serviceDetails = serviceRows.map((service) => {
        const price = Number(service.Sale_Price) > 0 ? Number(service.Sale_Price) : Number(service.Price);
        const duration = String(service.Duration_time ?? "");
        const durationTime = duration.includes(":") ? duration : toTimeString(duration);
        return [price, durationTime, bookingId, service.Id_services, null];
      });

      const comboDetails = comboRows.map((combo) => {
        const price = Number(combo.Price);
        const duration = String(combo.Duration_time ?? "");
        const durationTime = duration.includes(":") ? duration : toTimeString(duration);
        return [price, durationTime, bookingId, null, combo.Id_combo];
      });

      const detailValues = [...serviceDetails, ...comboDetails];
      if (detailValues.length > 0) {
        await connection.query(
          "INSERT INTO Booking_detail (Price_at_booking, Duration_time, Id_booking, Id_services, Id_combo) VALUES ?",
          [detailValues]
        );
      }
    }

    // 3. Thực hiện update bảng Bookings
    if (updates.length > 0) {
      await connection.query(
        `UPDATE Bookings SET ${updates.join(", ")} WHERE Id_booking = ?`,
        [...params, bookingId]
      );
    }

    // 4. Quản lý Slot (Khung giờ làm việc)
    // Cần thay đổi slot nếu: status đổi thành cancelled (giải phóng), 
    // hoặc có đổi stylistId, hoặc có đổi service (thời lượng thay đổi), hoặc đổi thời gian/ngày.
    // Đơn giản nhất: Nếu huỷ -> giải phóng. Nếu confirm/processing/pending mà có update liên quan tới slot -> giải phóng cũ, khoá mới.
    const isCancelled = status === "cancelled";
    const slotRelevantChanges = stylistId || date || time || hasServiceChanges;

    // Nếu status là cancelled -> chỉ cần giải phóng slot cũ (nếu có)
    if (isCancelled) {
      await releaseOldSlots();
    } else if (slotRelevantChanges) {
      // Giải phóng slot cũ
      await releaseOldSlots();

      // Tính slot mới cần khoá
      const targetStylistId = stylistId || currentBooking.Id_stylist;
      const targetDate = date || currentBooking.Booking_date;
      const targetStartRaw = time ? (time.length === 5 ? `${time}:00` : time) : currentBooking.Start_time;
      let targetTimeOnly = "";
      if (targetStartRaw instanceof Date) {
        targetTimeOnly = targetStartRaw.toTimeString().split(" ")[0];
      } else {
        const parts = String(targetStartRaw).split(" ");
        targetTimeOnly = parts.length > 1 ? parts[1] : parts[0];
        if (targetTimeOnly.length === 5) targetTimeOnly += ":00";
      }

      if (targetStylistId && targetDate && targetTimeOnly) {
        const [shiftRows] = await connection.query(
          "SELECT Id_work_shifts FROM Work_shifts WHERE Id_user = ? AND Shift_date = ?",
          [targetStylistId, targetDate]
        );

        if (shiftRows.length > 0) {
          const shiftId = shiftRows[0].Id_work_shifts;
          const numSlotsToLock = Math.ceil(newTotalDurationMin / 30);

          const [allSlots] = await connection.query(
            "SELECT Id_work_shifts_hour, Hours, Status FROM Work_shifts_hours WHERE Id_work_shifts = ? ORDER BY Hours ASC",
            [shiftId]
          );

          const startIndex = allSlots.findIndex(s => String(s.Hours).substring(0, 5) === targetTimeOnly.substring(0, 5));

          if (startIndex !== -1) {
            const slotsToLock = allSlots.slice(startIndex, startIndex + numSlotsToLock);

            // Kiểm tra xem đủ slot không và các slot có trống không (Status == 1)
            if (slotsToLock.length < numSlotsToLock) {
              throw createError("Thợ không đủ thời gian cho dịch vụ này.");
            }

            const conflictSlots = slotsToLock.filter(s => s.Status === 0);
            if (conflictSlots.length > 0) {
              throw createError("Khung giờ này của thợ đã bị trùng lịch.");
            }

            const slotIds = slotsToLock.map(s => s.Id_work_shifts_hour);
            if (slotIds.length > 0) {
              await connection.query(
                "UPDATE Work_shifts_hours SET Status = 0 WHERE Id_work_shifts_hour IN (?)",
                [slotIds]
              );
            }
          } else {
            throw createError("Không tìm thấy khung giờ phù hợp của thợ.");
          }
        } else {
          throw createError("Thợ không có ca làm việc trong ngày này.");
        }
      }
    }

    await connection.commit();
    res.json({ message: "Cập nhật thành công." });
  } catch (error) {
    await connection.rollback();
    console.error("Lỗi cập nhật lịch hẹn stateful:", error);
    const statusCode = typeof error.status === "number" ? error.status : 500;
    res.status(statusCode).json({ message: error.message || "Lỗi server." });
  } finally {
    connection.release();
  }
});


// GET images for booking
router.get("/:id/results", async (req, res) => {
  try {
    const [rows] = await database.query(
      "SELECT Image FROM booking_result_images WHERE Id_booking = ?",
      [req.params.id]
    );
    res.json({ images: rows.map(r => r.Image) });
  } catch (e) {
    console.error("GET results error:", e);
    res.status(500).json({ message: "Lỗi server" });
  }
});

// POST images for booking
router.post("/:id/results", uploadResult.array("images", 5), async (req, res) => {
  try {
    const bookingId = req.params.id;
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "Vui lòng chọn ảnh." });
    }

    const connection = await database.getConnection();
    try {
      await connection.beginTransaction();

      const insertData = req.files.map((file) => {
        return [bookingId, `/image/results/${file.filename}`];
      });

      await connection.query(
        "INSERT INTO booking_result_images (Id_booking, Image) VALUES ?",
        [insertData]
      );

      await connection.commit();

      const [rows] = await connection.query(
        "SELECT Image FROM booking_result_images WHERE Id_booking = ?",
        [bookingId]
      );

      res.json({ message: "Đã tải lên hình ảnh kết quả thành công.", uploadedCount: req.files.length, images: rows.map(r => r.Image) });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Lỗi upload ảnh kết quả:", error);
    res.status(500).json({ message: "Lỗi server." });
  }
});

export default router;