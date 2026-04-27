import express from "express";
import database from "../database.js";
import { hashPassword } from "../utils/password.js";

const router = express.Router();

const normalizeText = (value) => String(value ?? "").trim();
const normalizeEmail = (value) => String(value ?? "").trim().toLowerCase();
const normalizePhone = (value) => String(value ?? "").replace(/[^\d]/g, "");
const toBool = (value) => value === true || value === 1 || value === "1" || value === "true";
const isValidEmail = (value) => /^\S+@\S+\.\S+$/.test(value);

const ALLOWED_ROLES = ["user", "stylist", "admin", "staff"];

const getUserById = async (userId) => {
  const [rows] = await database.query(
    `
      SELECT
        Id_user,
        Name_user,
        Phone,
        Email,
        Address,
        Image,
        role,
        Id_store
      FROM Users
      WHERE Id_user = ?
      LIMIT 1
    `,
    [userId]
  );

  return rows[0] || null;
};

const normalizeDefaultAddress = async (connection, userId, preferredAddressId = null) => {
  const [rows] = await connection.query(
    `
      SELECT Id_address_ship, COALESCE(Is_default, 0) AS Is_default
      FROM Address_Ship
      WHERE Id_user = ?
      ORDER BY Id_address_ship DESC
    `,
    [userId]
  );

  if (!rows.length) return null;

  let defaultId = preferredAddressId;
  if (!defaultId) {
    defaultId = rows.find((row) => Number(row.Is_default) === 1)?.Id_address_ship || null;
  }
  if (!defaultId) {
    defaultId = rows[0].Id_address_ship;
  }

  await connection.query(
    `
      UPDATE Address_Ship
      SET Is_default = CASE WHEN Id_address_ship = ? THEN 1 ELSE 0 END
      WHERE Id_user = ?
    `,
    [defaultId, userId]
  );

  return defaultId;
};

const syncUserAddressField = async (connection, userId) => {
  const [rows] = await connection.query(
    `
      SELECT
        Province,
        Ward,
        Address_detail
      FROM Address_Ship
      WHERE Id_user = ?
      ORDER BY Is_default DESC, Id_address_ship DESC
      LIMIT 1
    `,
    [userId]
  );

  const row = rows[0];
  const fullAddress = row
    ? [row.Address_detail, row.Ward, row.Province].filter(Boolean).join(", ")
    : "Chưa cập nhật";

  await connection.query("UPDATE Users SET Address = ? WHERE Id_user = ?", [
    fullAddress,
    userId,
  ]);
};

router.get("/", async (req, res) => {
  try {
    const search = normalizeText(req.query.search);
    const role = normalizeText(req.query.role);

    let query = `
      SELECT
        u.Id_user,
        u.Name_user,
        u.Phone,
        u.Email,
        u.Address,
        u.Image,
        u.role,
        u.Id_store,
        s.Name_store,
        COUNT(DISTINCT a.Id_address_ship) AS Total_addresses,
        COUNT(DISTINCT o.Id_order) AS Total_orders
      FROM Users u
      LEFT JOIN Stores s ON s.Id_store = u.Id_store
      LEFT JOIN Address_Ship a ON a.Id_user = u.Id_user
      LEFT JOIN Orders o ON o.Id_user = u.Id_user
    `;
    const params = [];
    const where = [];

    if (search) {
      where.push("(u.Name_user LIKE ? OR u.Email LIKE ? OR u.Phone LIKE ?)");
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (role && ALLOWED_ROLES.includes(role)) {
      where.push("u.role = ?");
      params.push(role);
    }

    if (where.length) {
      query += ` WHERE ${where.join(" AND ")}`;
    }

    query += `
      GROUP BY
        u.Id_user,
        u.Name_user,
        u.Phone,
        u.Email,
        u.Address,
        u.Image,
        u.role,
        u.Id_store,
        s.Name_store
      ORDER BY u.Id_user DESC
    `;

    const [rows] = await database.query(query, params);
    return res.json(rows);
  } catch (error) {
    console.error("Lỗi lấy danh sách tài khoản:", error);
    return res.status(500).json({ message: "Lỗi server." });
  }
});

router.post("/", async (req, res) => {
  try {
    const name = normalizeText(req.body?.Name_user);
    const email = normalizeEmail(req.body?.Email);
    const phone = normalizePhone(req.body?.Phone);
    const password = String(req.body?.Pass_word || "");
    const address = normalizeText(req.body?.Address) || "Chưa cập nhật";
    const role = normalizeText(req.body?.role || "user");
    const idStore = Number(req.body?.Id_store) || 1;
    const image = normalizeText(req.body?.Image) || null;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({ message: "Thiếu thông tin bắt buộc." });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ message: "Email không hợp lệ." });
    }

    if (phone.length < 9 || phone.length > 11) {
      return res.status(400).json({ message: "Số điện thoại không hợp lệ." });
    }

    if (!ALLOWED_ROLES.includes(role)) {
      return res.status(400).json({ message: "Role không hợp lệ." });
    }

    const [existsRows] = await database.query(
      `
        SELECT Id_user
        FROM Users
        WHERE Email = ? OR Phone = ?
        LIMIT 1
      `,
      [email, phone]
    );

    if (existsRows.length) {
      return res.status(409).json({ message: "Email hoặc số điện thoại đã tồn tại." });
    }

    const hashedPassword = await hashPassword(password);

    const [result] = await database.query(
      `
        INSERT INTO Users
          (Name_user, Phone, Email, Pass_word, Address, Image, role, Id_store)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [name, phone, email, hashedPassword, address, image, role, idStore]
    );

    const user = await getUserById(result.insertId);
    return res.status(201).json({
      message: "Tạo tài khoản thành công.",
      user,
    });
  } catch (error) {
    console.error("Lỗi tạo tài khoản:", error);
    return res.status(500).json({ message: "Lỗi server." });
  }
});

router.get("/:id/addresses", async (req, res) => {
  try {
    const userId = Number(req.params.id);
    if (!userId) {
      return res.status(400).json({ message: "Id người dùng không hợp lệ." });
    }

    const [rows] = await database.query(
      `
        SELECT
          Id_address_ship,
          Receiver_name,
          Phone,
          Province,
          Ward,
          Address_detail,
          COALESCE(Is_default, 0) AS Is_default
        FROM Address_Ship
        WHERE Id_user = ?
        ORDER BY Is_default DESC, Id_address_ship DESC
      `,
      [userId]
    );

    return res.json(rows);
  } catch (error) {
    console.error("Lỗi lấy địa chỉ người dùng:", error);
    return res.status(500).json({ message: "Lỗi server." });
  }
});

router.post("/:id/addresses", async (req, res) => {
  const connection = await database.getConnection();

  try {
    const userId = Number(req.params.id);
    if (!userId) {
      return res.status(400).json({ message: "Id người dùng không hợp lệ." });
    }

    const receiverName = normalizeText(req.body?.Receiver_name);
    const phone = normalizePhone(req.body?.Phone);
    const province = normalizeText(req.body?.Province);
    const ward = normalizeText(req.body?.Ward);
    const addressDetail = normalizeText(req.body?.Address_detail);
    const wantDefault = toBool(req.body?.Is_default);

    if (!receiverName || !phone || !province || !ward || !addressDetail) {
      return res.status(400).json({ message: "Thiếu thông tin địa chỉ." });
    }

    await connection.beginTransaction();

    const [countRows] = await connection.query(
      "SELECT COUNT(*) AS total FROM Address_Ship WHERE Id_user = ?",
      [userId]
    );
    const isFirstAddress = Number(countRows[0]?.total || 0) === 0;
    const finalDefault = wantDefault || isFirstAddress;

    if (finalDefault) {
      await connection.query("UPDATE Address_Ship SET Is_default = 0 WHERE Id_user = ?", [
        userId,
      ]);
    }

    const [insertResult] = await connection.query(
      `
        INSERT INTO Address_Ship
          (Receiver_name, Phone, Province, Ward, Address_detail, Id_user, Is_default)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [receiverName, phone, province, ward, addressDetail, userId, finalDefault ? 1 : 0]
    );

    await normalizeDefaultAddress(
      connection,
      userId,
      finalDefault ? insertResult.insertId : null
    );
    await syncUserAddressField(connection, userId);
    await connection.commit();

    return res.status(201).json({ message: "Thêm địa chỉ thành công." });
  } catch (error) {
    await connection.rollback();
    console.error("Lỗi thêm địa chỉ:", error);
    return res.status(500).json({ message: "Lỗi server." });
  } finally {
    connection.release();
  }
});

router.put("/:id/addresses/:addressId", async (req, res) => {
  const connection = await database.getConnection();

  try {
    const userId = Number(req.params.id);
    const addressId = Number(req.params.addressId);
    if (!userId || !addressId) {
      return res.status(400).json({ message: "Id không hợp lệ." });
    }

    const receiverName = normalizeText(req.body?.Receiver_name);
    const phone = normalizePhone(req.body?.Phone);
    const province = normalizeText(req.body?.Province);
    const ward = normalizeText(req.body?.Ward);
    const addressDetail = normalizeText(req.body?.Address_detail);
    const isDefault = toBool(req.body?.Is_default);

    if (!receiverName || !phone || !province || !ward || !addressDetail) {
      return res.status(400).json({ message: "Thiếu thông tin địa chỉ." });
    }

    await connection.beginTransaction();

    const [existsRows] = await connection.query(
      `
        SELECT Id_address_ship
        FROM Address_Ship
        WHERE Id_address_ship = ? AND Id_user = ?
        LIMIT 1
      `,
      [addressId, userId]
    );

    if (!existsRows.length) {
      await connection.rollback();
      return res.status(404).json({ message: "Không tìm thấy địa chỉ." });
    }

    if (isDefault) {
      await connection.query("UPDATE Address_Ship SET Is_default = 0 WHERE Id_user = ?", [
        userId,
      ]);
    }

    await connection.query(
      `
        UPDATE Address_Ship
        SET
          Receiver_name = ?,
          Phone = ?,
          Province = ?,
          Ward = ?,
          Address_detail = ?,
          Is_default = CASE WHEN ? = 1 THEN 1 ELSE Is_default END
        WHERE Id_address_ship = ? AND Id_user = ?
      `,
      [receiverName, phone, province, ward, addressDetail, isDefault ? 1 : 0, addressId, userId]
    );

    await normalizeDefaultAddress(connection, userId, isDefault ? addressId : null);
    await syncUserAddressField(connection, userId);
    await connection.commit();

    return res.json({ message: "Cập nhật địa chỉ thành công." });
  } catch (error) {
    await connection.rollback();
    console.error("Lỗi cập nhật địa chỉ:", error);
    return res.status(500).json({ message: "Lỗi server." });
  } finally {
    connection.release();
  }
});

router.patch("/:id/addresses/:addressId/default", async (req, res) => {
  const connection = await database.getConnection();

  try {
    const userId = Number(req.params.id);
    const addressId = Number(req.params.addressId);
    if (!userId || !addressId) {
      return res.status(400).json({ message: "Id không hợp lệ." });
    }

    await connection.beginTransaction();

    const [existsRows] = await connection.query(
      `
        SELECT Id_address_ship
        FROM Address_Ship
        WHERE Id_address_ship = ? AND Id_user = ?
        LIMIT 1
      `,
      [addressId, userId]
    );

    if (!existsRows.length) {
      await connection.rollback();
      return res.status(404).json({ message: "Không tìm thấy địa chỉ." });
    }

    await normalizeDefaultAddress(connection, userId, addressId);
    await syncUserAddressField(connection, userId);
    await connection.commit();

    return res.json({ message: "Đặt địa chỉ mặc định thành công." });
  } catch (error) {
    await connection.rollback();
    console.error("Lỗi đặt địa chỉ mặc định:", error);
    return res.status(500).json({ message: "Lỗi server." });
  } finally {
    connection.release();
  }
});

router.delete("/:id/addresses/:addressId", async (req, res) => {
  const connection = await database.getConnection();

  try {
    const userId = Number(req.params.id);
    const addressId = Number(req.params.addressId);
    if (!userId || !addressId) {
      return res.status(400).json({ message: "Id không hợp lệ." });
    }

    await connection.beginTransaction();

    const [result] = await connection.query(
      `
        DELETE FROM Address_Ship
        WHERE Id_address_ship = ? AND Id_user = ?
      `,
      [addressId, userId]
    );

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "Không tìm thấy địa chỉ." });
    }

    await normalizeDefaultAddress(connection, userId);
    await syncUserAddressField(connection, userId);
    await connection.commit();

    return res.json({ message: "Xóa địa chỉ thành công." });
  } catch (error) {
    await connection.rollback();
    console.error("Lỗi xóa địa chỉ:", error);
    return res.status(500).json({ message: "Lỗi server." });
  } finally {
    connection.release();
  }
});

router.get("/:id", async (req, res) => {
  try {
    const userId = Number(req.params.id);
    if (!userId) {
      return res.status(400).json({ message: "Id người dùng không hợp lệ." });
    }

    const user = await getUserById(userId);
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy tài khoản." });
    }

    return res.json(user);
  } catch (error) {
    console.error("Lỗi lấy chi tiết tài khoản:", error);
    return res.status(500).json({ message: "Lỗi server." });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const userId = Number(req.params.id);
    if (!userId) {
      return res.status(400).json({ message: "Id người dùng không hợp lệ." });
    }

    const current = await getUserById(userId);
    if (!current) {
      return res.status(404).json({ message: "Không tìm thấy tài khoản." });
    }

    const name = normalizeText(req.body?.Name_user) || current.Name_user;
    const email = normalizeEmail(req.body?.Email) || current.Email;
    const phone = normalizePhone(req.body?.Phone) || current.Phone;
    const address = normalizeText(req.body?.Address) || current.Address || "Chưa cập nhật";
    const role = normalizeText(req.body?.role || current.role);
    const idStore = Number(req.body?.Id_store || current.Id_store || 1);
    const image = normalizeText(req.body?.Image) || current.Image || null;
    const nextPassword = req.body?.Pass_word ? String(req.body.Pass_word) : null;

    if (!ALLOWED_ROLES.includes(role)) {
      return res.status(400).json({ message: "Role không hợp lệ." });
    }

    const [existsRows] = await database.query(
      `
        SELECT Id_user
        FROM Users
        WHERE (Email = ? OR Phone = ?) AND Id_user <> ?
        LIMIT 1
      `,
      [email, phone, userId]
    );
    if (existsRows.length) {
      return res.status(409).json({ message: "Email hoặc số điện thoại đã tồn tại." });
    }

    let hashedPassword = null;
    if (nextPassword) {
      if (nextPassword.length < 6) {
        return res.status(400).json({ message: "Mật khẩu tối thiểu 6 ký tự." });
      }
      hashedPassword = await hashPassword(nextPassword);
    }

    await database.query(
      `
        UPDATE Users
        SET
          Name_user = ?,
          Phone = ?,
          Email = ?,
          Address = ?,
          Image = ?,
          role = ?,
          Id_store = ?,
          Pass_word = COALESCE(?, Pass_word)
        WHERE Id_user = ?
      `,
      [name, phone, email, address, image, role, idStore, hashedPassword, userId]
    );

    const updated = await getUserById(userId);
    return res.json({
      message: "Cập nhật tài khoản thành công.",
      user: updated,
    });
  } catch (error) {
    console.error("Lỗi cập nhật tài khoản:", error);
    return res.status(500).json({ message: "Lỗi server." });
  }
});

router.delete("/:id", async (req, res) => {
  const connection = await database.getConnection();

  try {
    const userId = Number(req.params.id);
    if (!userId) {
      return res.status(400).json({ message: "Id người dùng không hợp lệ." });
    }

    await connection.beginTransaction();

    const [userRows] = await connection.query(
      "SELECT Id_user FROM Users WHERE Id_user = ? LIMIT 1",
      [userId]
    );
    if (!userRows.length) {
      await connection.rollback();
      return res.status(404).json({ message: "Không tìm thấy tài khoản." });
    }

    const [orderRows] = await connection.query(
      "SELECT COUNT(*) AS total FROM Orders WHERE Id_user = ?",
      [userId]
    );
    const [bookingRows] = await connection.query(
      "SELECT COUNT(*) AS total FROM Bookings WHERE Id_user = ? OR Id_stylist = ?",
      [userId, userId]
    );

    if (Number(orderRows[0]?.total || 0) > 0 || Number(bookingRows[0]?.total || 0) > 0) {
      await connection.rollback();
      return res.status(409).json({
        message:
          "Không thể xóa tài khoản vì đã phát sinh đơn hàng hoặc lịch hẹn. Hãy đổi role hoặc cập nhật trạng thái thay vì xóa.",
      });
    }

    await connection.query("DELETE FROM Address_Ship WHERE Id_user = ?", [userId]);
    await connection.query("DELETE FROM Users WHERE Id_user = ?", [userId]);

    await connection.commit();
    return res.json({ message: "Xóa tài khoản thành công." });
  } catch (error) {
    await connection.rollback();
    console.error("Lỗi xóa tài khoản:", error);
    return res.status(500).json({ message: "Lỗi server." });
  } finally {
    connection.release();
  }
});

export default router;

