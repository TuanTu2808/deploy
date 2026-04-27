import express from "express";
import database from "../database.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

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
          cb.Name AS Combo_name
        FROM Booking_detail bd
        LEFT JOIN Services sv ON sv.Id_services = bd.Id_services
        LEFT JOIN Combos cb ON cb.Id_combo = bd.Id_combo
        WHERE bd.Id_booking = ?
        ORDER BY bd.Id_Booking_detail ASC
      `,
      [bookingId]
    );

    const items = details.map((item) => ({
      Id_Booking_detail: item.Id_Booking_detail,
      Id_services: item.Id_services,
      Id_combo: item.Id_combo,
      Item_type: item.Id_combo ? "combo" : "service",
      Name: item.Combo_name || item.Service_name || "Dich vu",
      Price_at_booking: Number(item.Price_at_booking || 0),
      Duration_time: item.Duration_time,
    }));

    const durationMinutes = items.reduce((sum, item) => {
      const raw = String(item.Duration_time || "");
      if (!raw.includes(":")) return sum;
      const [h = "0", m = "0"] = raw.split(":");
      return sum + Number(h || 0) * 60 + Number(m || 0);
    }, 0);

    return res.json({
      booking: {
        ...booking,
        Booking_code: toBookingCode(booking.Id_booking),
        Duration_minutes: durationMinutes,
        items,
      },
    });
  } catch (error) {
    console.error("Loi lay chi tiet lich su dat lich:", error);
    return res.status(500).json({ message: "Loi server." });
  }
});

router.get("/", async (req, res) => {
  try {
    const { status, storeId } = req.query;
    let query = `
      SELECT
        b.Id_booking AS id,
        b.Booking_date AS booking_date,
        b.Start_time AS start_time,
        b.Status AS status,
        b.Total_price AS total_price,
        b.Note AS note,
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

    query += " ORDER BY b.Start_time DESC";

    const [rows] = await database.query(query, params);

    const [serviceRows] = await database.query(`
      SELECT
        bd.Id_booking AS booking_id,
        GROUP_CONCAT(sv.Name SEPARATOR ', ') AS service_names
      FROM Booking_detail bd
      LEFT JOIN Services sv ON bd.Id_services = sv.Id_services
      GROUP BY bd.Id_booking
    `);

    const serviceMap = new Map(
      serviceRows.map((row) => [row.booking_id, row.service_names])
    );

    const data = rows.map((row) => ({
      ...row,
      service_names: serviceMap.get(row.id) || null,
    }));

    res.json(data);
  } catch (error) {
    console.error("Lỗi lấy lịch hẹn:", error);
    res.status(500).json({ message: "Lỗi server." });
  }
});

router.post("/", async (req, res) => {
  const phone = normalizePhone(req.body?.phone);
  const storeId = Number(req.body?.storeId);
  const stylistId = Number(req.body?.stylistId);
  const date = String(req.body?.date ?? "").trim();
  const time = String(req.body?.time ?? "").trim();
  const serviceIds = Array.isArray(req.body?.serviceIds)
    ? req.body.serviceIds.map((id) => Number(id)).filter(Boolean)
    : [];

  if (!phone) {
    return res.status(400).json({ message: "Vui lòng nhập số điện thoại." });
  }

  if (phone.length < 9 || phone.length > 11) {
    return res.status(400).json({ message: "Số điện thoại không hợp lệ." });
  }

  if (!storeId || !stylistId) {
    return res.status(400).json({ message: "Thiếu thông tin salon/stylist." });
  }

  if (!date || !time) {
    return res.status(400).json({ message: "Thiếu ngày hoặc giờ hẹn." });
  }

  if (serviceIds.length === 0) {
    return res.status(400).json({ message: "Chưa chọn dịch vụ." });
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

    const [stylistRows] = await connection.query(
      "SELECT Id_user FROM Users WHERE Id_user = ? LIMIT 1",
      [stylistId]
    );
    if (!stylistRows.length) {
      throw createError("Stylist không tồn tại.");
    }

    const [serviceRows] = await connection.query(
      `
      SELECT Id_services, Price, Sale_Price, Duration_time
      FROM Services
      WHERE Id_services IN (?)
      `,
      [serviceIds]
    );

    if (serviceRows.length !== serviceIds.length) {
      throw createError("Dịch vụ không hợp lệ.");
    }

    const total = serviceRows.reduce((sum, item) => {
      const price =
        Number(item.Sale_Price) > 0 ? Number(item.Sale_Price) : Number(item.Price);
      return sum + (Number.isFinite(price) ? price : 0);
    }, 0);

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

    const startTime = `${date} ${time}:00`;
    const note = "Đặt lịch theo luồng website.";
    
    const [bookingResult] = await connection.query(
      `
      INSERT INTO Bookings
      (Booking_date, Start_time,Phone, Note, Total_price, Status, Id_store, Id_user, Id_stylist)
      VALUES (?, ?, ?, ?,?, 'pending', ?, ?, ?)
      `,
      [date, startTime,phone, note, total, storeId, userId, stylistId]
    );

    const bookingId = bookingResult.insertId;
    const detailValues = serviceRows.map((service) => {
      const price =
        Number(service.Sale_Price) > 0
          ? Number(service.Sale_Price)
          : Number(service.Price);
      const duration = String(service.Duration_time ?? "");
      const durationTime =
        duration.includes(":") ? duration : toTimeString(duration);
      return [price, durationTime, bookingId, service.Id_services, null];
    });

    await connection.query(
      `
      INSERT INTO Booking_detail
      (Price_at_booking, Duration_time, Id_booking, Id_services, Id_combo)
      VALUES ?
      `,
      [detailValues]
    );

    await connection.commit();

    res.json({ message: "Đặt lịch thành công.", bookingId });
  } catch (error) {
    await connection.rollback();
    const status = typeof error?.status === "number" ? error.status : 500;
    console.error("Lỗi tạo lịch hẹn:", error);
    res.status(status).json({
      message: status === 500 ? "Lỗi server." : error?.message || "Lỗi dữ liệu.",
    });
  } finally {
    connection.release();
  }
});

router.patch("/:id", async (req, res) => {
  const bookingId = Number(req.params.id);
  if (!bookingId) {
    return res.status(400).json({ message: "Id lịch hẹn không hợp lệ." });
  }

  const { status, stylistId, date, time, note } = req.body;
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

  if (stylistId) {
    updates.push("Id_stylist = ?");
    params.push(Number(stylistId));
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

  if (updates.length === 0) {
    return res.status(400).json({ message: "Không có dữ liệu để cập nhật." });
  }

  try {
    const [result] = await database.query(
      `UPDATE Bookings SET ${updates.join(", ")} WHERE Id_booking = ?`,
      [...params, bookingId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Không tìm thấy lịch hẹn." });
    }

    res.json({ message: "Cập nhật thành công." });
  } catch (error) {
    console.error("Lỗi cập nhật lịch hẹn:", error);
    res.status(500).json({ message: "Lỗi server." });
  }
});

export default router;
