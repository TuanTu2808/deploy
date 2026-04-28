import express from "express";
import fs from "fs";
import path from "path";
import multer from "multer";
import database from "../database.js";
import { requireAuth } from "../middleware/auth.js";
import { sanitizeUser } from "../utils/auth.js";
import { comparePassword, hashPassword } from "../utils/password.js";

const router = express.Router();

const normalizeText = (value) => String(value ?? "").trim();
const normalizePhone = (value) => String(value ?? "").replace(/[^\d]/g, "");
const normalizeEmail = (value) => String(value ?? "").trim().toLowerCase();
const toBool = (value) => value === true || value === 1 || value === "1" || value === "true";
const isValidEmail = (value) => /^\S+@\S+\.\S+$/.test(value);

const uploadDir = path.join(process.cwd(), "public", "image", "user");
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const safeOriginal = file.originalname.replace(/[^\w.-]/g, "_");
    cb(null, `${Date.now()}-${safeOriginal}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

const findUserById = async (userId) => {
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

const findUserWithPasswordById = async (userId) => {
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
        Id_store,
        Pass_word
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

router.get("/me", requireAuth, async (req, res) => {
  try {
    const user = await findUserById(req.auth.id);
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy tài khoản." });
    }
    return res.json({ user: sanitizeUser(user) });
  } catch (error) {
    console.error("Lỗi lấy profile:", error);
    return res.status(500).json({ message: "Lỗi server." });
  }
});

router.put("/me", requireAuth, async (req, res) => {
  try {
    const userId = req.auth.id;
    const current = await findUserById(userId);
    if (!current) {
      return res.status(404).json({ message: "Không tìm thấy tài khoản." });
    }

    const name = normalizeText(req.body?.name) || current.Name_user;
    const phone = normalizePhone(req.body?.phone) || current.Phone;
    const email = normalizeEmail(req.body?.email) || current.Email;
    const address = normalizeText(req.body?.address) || current.Address || "Chưa cập nhật";

    if (!name || !phone || !email) {
      return res.status(400).json({ message: "Tên, email, số điện thoại không được để trống." });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ message: "Email không hợp lệ." });
    }

    if (phone.length < 9 || phone.length > 11) {
      return res.status(400).json({ message: "Số điện thoại không hợp lệ." });
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
      return res.status(409).json({ message: "Email hoặc số điện thoại đã được dùng." });
    }

    await database.query(
      `
        UPDATE Users
        SET Name_user = ?, Phone = ?, Email = ?, Address = ?
        WHERE Id_user = ?
      `,
      [name, phone, email, address, userId]
    );

    const updated = await findUserById(userId);
    return res.json({ message: "Cập nhật thông tin thành công.", user: sanitizeUser(updated) });
  } catch (error) {
    console.error("Lỗi cập nhật profile:", error);
    return res.status(500).json({ message: "Lỗi server." });
  }
});

router.put("/me/password", requireAuth, async (req, res) => {
  try {
    const userId = req.auth.id;
    const currentPassword = String(req.body?.currentPassword ?? "");
    const newPassword = String(req.body?.newPassword ?? "");

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Vui lòng nhập đầy đủ mật khẩu hiện tại và mật khẩu mới." });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Mật khẩu mới tối thiểu 6 ký tự." });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({ message: "Mật khẩu mới phải khác mật khẩu hiện tại." });
    }

    const currentUser = await findUserWithPasswordById(userId);
    if (!currentUser) {
      return res.status(404).json({ message: "Không tìm thấy tài khoản." });
    }

    const matched = await comparePassword(currentPassword, currentUser.Pass_word);
    if (!matched) {
      return res.status(400).json({ message: "Mật khẩu hiện tại không đúng." });
    }

    const hashedPassword = await hashPassword(newPassword);
    await database.query("UPDATE Users SET Pass_word = ? WHERE Id_user = ?", [
      hashedPassword,
      userId,
    ]);

    return res.json({ message: "Cập nhật mật khẩu thành công." });
  } catch (error) {
    console.error("Lỗi cập nhật mật khẩu:", error);
    return res.status(500).json({ message: "Lỗi server." });
  }
});

router.post("/me/avatar", requireAuth, upload.single("avatar"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Vui lòng chọn ảnh." });
    }

    const imagePath = `/image/user/${req.file.filename}`;
    await database.query("UPDATE Users SET Image = ? WHERE Id_user = ?", [
      imagePath,
      req.auth.id,
    ]);

    const user = await findUserById(req.auth.id);
    return res.json({ message: "Cập nhật ảnh đại diện thành công.", user: sanitizeUser(user) });
  } catch (error) {
    console.error("Lỗi cập nhật avatar:", error);
    return res.status(500).json({ message: "Lỗi server." });
  }
});

router.get("/me/addresses", requireAuth, async (req, res) => {
  try {
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
      [req.auth.id]
    );

    return res.json({
      addresses: rows.map((row) => ({
        Id_address_ship: row.Id_address_ship,
        Receiver_name: row.Receiver_name,
        Phone: row.Phone,
        Province: row.Province,
        Ward: row.Ward,
        Address_detail: row.Address_detail,
        Is_default: Number(row.Is_default) === 1,
      })),
    });
  } catch (error) {
    console.error("Lỗi lấy địa chỉ:", error);
    return res.status(500).json({ message: "Lỗi server." });
  }
});

router.post("/me/addresses", requireAuth, async (req, res) => {
  const connection = await database.getConnection();

  try {
    const userId = req.auth.id;
    const receiverName = normalizeText(req.body?.receiverName);
    const phone = normalizePhone(req.body?.phone);
    const province = normalizeText(req.body?.province);
    const ward = normalizeText(req.body?.ward);
    const addressDetail = normalizeText(req.body?.addressDetail);
    const wantDefault = toBool(req.body?.isDefault);

    if (!receiverName || !phone || !province || !ward || !addressDetail) {
      return res.status(400).json({ message: "Vui lòng nhập đầy đủ thông tin địa chỉ." });
    }

    if (phone.length < 9 || phone.length > 11) {
      return res.status(400).json({ message: "Số điện thoại địa chỉ không hợp lệ." });
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

router.put("/me/addresses/:id", requireAuth, async (req, res) => {
  const connection = await database.getConnection();

  try {
    const userId = req.auth.id;
    const addressId = Number(req.params.id);
    if (!addressId) {
      return res.status(400).json({ message: "Địa chỉ không hợp lệ." });
    }

    const receiverName = normalizeText(req.body?.receiverName);
    const phone = normalizePhone(req.body?.phone);
    const province = normalizeText(req.body?.province);
    const ward = normalizeText(req.body?.ward);
    const addressDetail = normalizeText(req.body?.addressDetail);
    const hasDefaultField = req.body?.isDefault !== undefined;
    const isDefault = toBool(req.body?.isDefault);

    if (!receiverName || !phone || !province || !ward || !addressDetail) {
      return res.status(400).json({ message: "Vui lòng nhập đầy đủ thông tin địa chỉ." });
    }

    await connection.beginTransaction();

    const [rows] = await connection.query(
      `
        SELECT Id_address_ship
        FROM Address_Ship
        WHERE Id_address_ship = ? AND Id_user = ?
        LIMIT 1
      `,
      [addressId, userId]
    );

    if (!rows.length) {
      await connection.rollback();
      return res.status(404).json({ message: "Không tìm thấy địa chỉ." });
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
          Is_default = CASE
            WHEN ? = 1 THEN ?
            ELSE Is_default
          END
        WHERE Id_address_ship = ? AND Id_user = ?
      `,
      [
        receiverName,
        phone,
        province,
        ward,
        addressDetail,
        hasDefaultField ? 1 : 0,
        isDefault ? 1 : 0,
        addressId,
        userId,
      ]
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

router.patch("/me/addresses/:id/default", requireAuth, async (req, res) => {
  const connection = await database.getConnection();

  try {
    const userId = req.auth.id;
    const addressId = Number(req.params.id);
    if (!addressId) {
      return res.status(400).json({ message: "Địa chỉ không hợp lệ." });
    }

    await connection.beginTransaction();

    const [rows] = await connection.query(
      `
        SELECT Id_address_ship
        FROM Address_Ship
        WHERE Id_address_ship = ? AND Id_user = ?
        LIMIT 1
      `,
      [addressId, userId]
    );
    if (!rows.length) {
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

router.delete("/me/addresses/:id", requireAuth, async (req, res) => {
  const connection = await database.getConnection();

  try {
    const userId = req.auth.id;
    const addressId = Number(req.params.id);
    if (!addressId) {
      return res.status(400).json({ message: "Địa chỉ không hợp lệ." });
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

router.get("/address/default", requireAuth, async (req, res) => {
  try {
    const userId = req.auth.id;

    const [rows] = await database.query(
      `SELECT * FROM address_ship 
       WHERE Id_user = ? AND Is_default = 1
       LIMIT 1`,
      [userId],
    );

    if (!rows.length) {
      return res.json({ address: null });
    }

    res.json({ address: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server" });
  }
});

router.get("/exists", async (req, res) => {
  try {
    const phone = normalizePhone(req.query?.phone);

    if (!phone) {
      return res.status(400).json({ message: "Thiếu số điện thoại." });
    }

    const [rows] = await database.query(
      `
        SELECT Id_user
        FROM Users
        WHERE Phone = ?
        LIMIT 1
      `,
      [phone]
    );

    return res.json({
      exists: rows.length > 0,
    });
  } catch (error) {
    console.error("Lỗi check user tồn tại:", error);
    return res.status(500).json({ message: "Lỗi server." });
  }
});

export default router;