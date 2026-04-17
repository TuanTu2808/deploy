import express from "express";
import database from "../database.js";

const router = express.Router();

const normalizePhone = (value) => String(value ?? "").replace(/[^\d]/g, "");
const createError = (message, status = 400) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

router.post("/", async (req, res) => {
  const digits = normalizePhone(req.body?.phone);

  if (!digits) {
    return res.status(400).json({ message: "Vui lòng nhập số điện thoại." });
  }

  if (digits.length < 9 || digits.length > 11) {
    return res.status(400).json({ message: "Số điện thoại không hợp lệ." });
  }

  const connection = await database.getConnection();

  try {
    await connection.beginTransaction();

    const [storeRows] = await connection.query(
      "SELECT Id_store FROM Stores WHERE Status = 1 ORDER BY Id_store ASC LIMIT 1"
    );
    const storeId = storeRows?.[0]?.Id_store;
    if (!storeId) {
      throw createError("Chưa có salon hoạt động để nhận lịch.", 400);
    }

    const [stylistRows] = await connection.query(
      "SELECT Id_user FROM Users WHERE role = 'stylist' ORDER BY Id_user ASC LIMIT 1"
    );
    const stylistId = stylistRows?.[0]?.Id_user;
    if (!stylistId) {
      throw createError("Chưa có stylist để gán lịch.", 400);
    }

    const [userRows] = await connection.query(
      "SELECT Id_user FROM Users WHERE Phone = ? LIMIT 1",
      [digits]
    );

    let userId = userRows?.[0]?.Id_user;

    if (!userId) {
      const email = `${digits}@quick.25zone`;
      const [userResult] = await connection.query(
        `
        INSERT INTO Users
        (Name_user, Phone, Email, Pass_word, Address, Image, role, Id_store)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          "Khách đặt nhanh",
          digits,
          email,
          "quick_booking",
          "Đặt lịch nhanh",
          null,
          "user",
          storeId,
        ]
      );

      userId = userResult.insertId;
    }

    const note = `Đặt lịch nhanh từ trang chủ. SĐT: ${digits}`;
    const [bookingResult] = await connection.query(
      `
      INSERT INTO Bookings
      (Booking_date, Start_time, Note, Total_price, Status, Id_strore, Id_user, Id_stylist)
      VALUES (CURDATE(), NOW(), ?, ?, 'pending', ?, ?, ?)
      `,
      [note, 0, storeId, userId, stylistId]
    );

    await connection.commit();

    res.json({
      message: "Đã ghi nhận đặt lịch.",
      bookingId: bookingResult.insertId,
    });
  } catch (error) {
    await connection.rollback();
    const status = typeof error?.status === "number" ? error.status : 500;
    const message =
      status === 500 ? "Lỗi server." : error?.message || "Lỗi dữ liệu.";
    console.error("Lỗi đặt lịch nhanh:", error);
    res.status(status).json({ message });
  } finally {
    connection.release();
  }
});

export default router;
