import express from "express";
import { randomInt } from "crypto";
import database from "../database.js";
import { hashPassword, comparePassword, isBcryptHash } from "../utils/password.js";
import {
  sanitizeUser,
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  hashRefreshToken,
} from "../utils/auth.js";
import { sendResetOtpEmail } from "../utils/mailer.js";

const router = express.Router();

const USER_FIELDS = `
  Id_user,
  Name_user,
  Phone,
  Email,
  Pass_word,
  Address,
  Image,
  role,
  Id_store,
  Reset_otp,
  Reset_otp_expired,
  Refresh_token_hash,
  Refresh_token_expired
`;

const normalizeEmail = (value) => String(value ?? "").trim().toLowerCase();
const normalizePhone = (value) => String(value ?? "").replace(/[^\d]/g, "");
const normalizeText = (value) => String(value ?? "").trim();
const toBool = (value) =>
  value === true || value === 1 || value === "1" || value === "true";
const isValidEmail = (value) => /^\S+@\S+\.\S+$/.test(value);

const findUserByIdentifier = async (identifier) => {
  const email = normalizeEmail(identifier);
  const phone = normalizePhone(identifier);

  if (!email && !phone) return null;

  const [rows] = await database.query(
    `
      SELECT ${USER_FIELDS}
      FROM Users
      WHERE Email = ? OR Phone = ?
      LIMIT 1
    `,
    [email, phone]
  );

  return rows[0] || null;
};

const findUserById = async (userId) => {
  const [rows] = await database.query(
    `
      SELECT ${USER_FIELDS}
      FROM Users
      WHERE Id_user = ?
      LIMIT 1
    `,
    [userId]
  );
  return rows[0] || null;
};

const buildTokenResponse = (user, accessToken, refreshToken) => ({
  accessToken,
  refreshToken,
  token: accessToken, // alias tương thích client cũ
  user: sanitizeUser(user),
});

const persistRefreshToken = async (userId, refreshToken) => {
  const payload = verifyRefreshToken(refreshToken);
  const expiredAt = payload?.exp ? new Date(payload.exp * 1000) : null;
  await database.query(
    `
      UPDATE Users
      SET Refresh_token_hash = ?, Refresh_token_expired = ?
      WHERE Id_user = ?
    `,
    [hashRefreshToken(refreshToken), expiredAt, userId]
  );
};

const clearRefreshToken = async (userId) => {
  await database.query(
    `
      UPDATE Users
      SET Refresh_token_hash = NULL, Refresh_token_expired = NULL
      WHERE Id_user = ?
    `,
    [userId]
  );
};

const issueTokenPair = async (user, remember = true) => {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user, remember);
  await persistRefreshToken(user.Id_user, refreshToken);
  return { accessToken, refreshToken };
};

router.post("/register", async (req, res) => {
  try {
    const name = normalizeText(req.body?.name);
    const email = normalizeEmail(req.body?.email);
    const phone = normalizePhone(req.body?.phone);
    const password = String(req.body?.password ?? "");
    const address = normalizeText(req.body?.address) || "Chưa cập nhật";
    const idStore = Number(req.body?.idStore) || 1;
    const remember =
      req.body?.remember === undefined ? true : toBool(req.body?.remember);

    if (!name || !email || !phone || !password) {
      return res
        .status(400)
        .json({ message: "Vui lòng nhập đầy đủ thông tin." });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ message: "Email không hợp lệ." });
    }

    if (phone.length < 9 || phone.length > 11) {
      return res.status(400).json({ message: "Số điện thoại không hợp lệ." });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Mật khẩu tối thiểu 6 ký tự." });
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
      return res
        .status(409)
        .json({ message: "Email hoặc số điện thoại đã tồn tại." });
    }

    const hashedPassword = await hashPassword(password);

    const [insertResult] = await database.query(
      `
        INSERT INTO Users
          (Name_user, Phone, Email, Pass_word, Address, Image, role, Id_store)
        VALUES (?, ?, ?, ?, ?, ?, 'user', ?)
      `,
      [name, phone, email, hashedPassword, address, null, idStore]
    );

    const user = await findUserById(insertResult.insertId);
    if (!user) {
      return res.status(500).json({ message: "Không thể tạo phiên đăng nhập." });
    }

    const { accessToken, refreshToken } = await issueTokenPair(user, remember);

    return res.status(201).json({
      message: "Đăng ký thành công.",
      ...buildTokenResponse(user, accessToken, refreshToken),
    });
  } catch (error) {
    console.error("Lỗi đăng ký:", error);
    return res.status(500).json({ message: "Lỗi server khi đăng ký." });
  }
});

router.post("/login", async (req, res) => {
  try {
    const identifier = normalizeText(req.body?.identifier);
    const password = String(req.body?.password ?? "");
    const remember =
      req.body?.remember === undefined ? true : toBool(req.body?.remember);

    if (!identifier || !password) {
      return res
        .status(400)
        .json({ message: "Vui lòng nhập email/số điện thoại và mật khẩu." });
    }

    const user = await findUserByIdentifier(identifier);
    if (!user) {
      return res
        .status(401)
        .json({ message: "Thông tin đăng nhập không chính xác." });
    }

    const matched = await comparePassword(password, user.Pass_word);
    if (!matched) {
      return res
        .status(401)
        .json({ message: "Thông tin đăng nhập không chính xác." });
    }

    // Tự nâng cấp tài khoản cũ đang dùng mật khẩu text.
    if (!isBcryptHash(user.Pass_word)) {
      const hashedPassword = await hashPassword(password);
      await database.query("UPDATE Users SET Pass_word = ? WHERE Id_user = ?", [
        hashedPassword,
        user.Id_user,
      ]);
      user.Pass_word = hashedPassword;
    }

    const { accessToken, refreshToken } = await issueTokenPair(user, remember);

    return res.json({
      message: "Đăng nhập thành công.",
      ...buildTokenResponse(user, accessToken, refreshToken),
    });
  } catch (error) {
    console.error("Lỗi đăng nhập:", error);
    return res.status(500).json({ message: "Lỗi server khi đăng nhập." });
  }
});

router.post("/refresh-token", async (req, res) => {
  try {
    const refreshToken = normalizeText(req.body?.refreshToken);
    const remember =
      req.body?.remember === undefined ? true : toBool(req.body?.remember);

    if (!refreshToken) {
      return res.status(400).json({ message: "Thiếu refresh token." });
    }

    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      return res
        .status(401)
        .json({ message: "Refresh token không hợp lệ hoặc đã hết hạn." });
    }

    const user = await findUserById(payload?.id);
    if (!user) {
      return res.status(401).json({ message: "Tài khoản không tồn tại." });
    }

    if (!user.Refresh_token_hash || !user.Refresh_token_expired) {
      return res
        .status(401)
        .json({ message: "Phiên đăng nhập đã hết hiệu lực." });
    }

    const providedHash = hashRefreshToken(refreshToken);
    const currentHash = String(user.Refresh_token_hash || "");
    const expiredAt = new Date(user.Refresh_token_expired);

    if (providedHash !== currentHash || expiredAt.getTime() < Date.now()) {
      await clearRefreshToken(user.Id_user);
      return res
        .status(401)
        .json({ message: "Refresh token không hợp lệ hoặc đã hết hạn." });
    }

    const { accessToken, refreshToken: nextRefreshToken } =
      await issueTokenPair(user, remember);

    return res.json({
      message: "Làm mới phiên đăng nhập thành công.",
      ...buildTokenResponse(user, accessToken, nextRefreshToken),
    });
  } catch (error) {
    console.error("Lỗi refresh token:", error);
    return res.status(500).json({ message: "Lỗi server khi làm mới token." });
  }
});

router.post("/logout", async (req, res) => {
  try {
    const refreshToken = normalizeText(req.body?.refreshToken);

    if (refreshToken) {
      try {
        const payload = verifyRefreshToken(refreshToken);
        await clearRefreshToken(payload?.id);
        return res.json({ message: "Đăng xuất thành công." });
      } catch {
        return res.json({ message: "Đăng xuất thành công." });
      }
    }

    const authHeader = req.headers.authorization || "";
    const [scheme, accessToken] = authHeader.split(" ");
    if (scheme === "Bearer" && accessToken) {
      try {
        const payload = verifyAccessToken(accessToken);
        await clearRefreshToken(payload?.id);
      } catch {
        // ignore invalid access token while logout
      }
    }

    return res.json({ message: "Đăng xuất thành công." });
  } catch (error) {
    console.error("Lỗi đăng xuất:", error);
    return res.status(500).json({ message: "Lỗi server khi đăng xuất." });
  }
});

router.post("/forgot-password", async (req, res) => {
  try {
    const identifier = normalizeText(req.body?.identifier);
    if (!identifier) {
      return res
        .status(400)
        .json({ message: "Vui lòng nhập email hoặc số điện thoại." });
    }

    const user = await findUserByIdentifier(identifier);

    // Trả về message chung để không lộ thông tin tài khoản.
    if (!user) {
      return res.json({
        message:
          "Nếu tài khoản tồn tại, OTP đã được gửi qua email đăng ký.",
      });
    }

    const otp = String(randomInt(100000, 1000000));
    const expiredAt = new Date(Date.now() + 15 * 60 * 1000);

    await database.query(
      `
        UPDATE Users
        SET Reset_otp = ?, Reset_otp_expired = ?
        WHERE Id_user = ?
      `,
      [otp, expiredAt, user.Id_user]
    );

    let mailResult = { delivered: false, reason: "unknown" };
    try {
      mailResult = await sendResetOtpEmail({
        to: user.Email,
        name: user.Name_user,
        otp,
      });
    } catch (mailError) {
      console.error("Lỗi gửi email OTP:", mailError);
      mailResult = { delivered: false, reason: "send_failed" };
    }

    const response = {
      message: "Nếu tài khoản tồn tại, OTP đã được gửi qua email đăng ký.",
    };

    if (process.env.NODE_ENV !== "production") {
      response.debug = {
        otp,
        expiresAt: expiredAt,
        mailDelivery: mailResult.delivered
          ? "sent"
          : `fallback_${mailResult.reason}`,
        sentTo: user.Email,
      };
    }

    return res.json(response);
  } catch (error) {
    console.error("Lỗi quên mật khẩu:", error);
    return res.status(500).json({ message: "Lỗi server khi gửi OTP." });
  }
});

router.post("/reset-password", async (req, res) => {
  try {
    const identifier = normalizeText(req.body?.identifier);
    const otp = normalizeText(req.body?.otp);
    const newPassword = String(req.body?.newPassword ?? "");

    if (!identifier || !otp || !newPassword) {
      return res
        .status(400)
        .json({ message: "Vui lòng nhập đủ thông tin đặt lại mật khẩu." });
    }

    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ message: "Mật khẩu mới tối thiểu 6 ký tự." });
    }

    const user = await findUserByIdentifier(identifier);
    if (!user || !user.Reset_otp || !user.Reset_otp_expired) {
      return res
        .status(400)
        .json({ message: "OTP không hợp lệ hoặc đã hết hạn." });
    }

    const expiredAt = new Date(user.Reset_otp_expired);
    if (otp !== String(user.Reset_otp) || expiredAt.getTime() < Date.now()) {
      return res
        .status(400)
        .json({ message: "OTP không hợp lệ hoặc đã hết hạn." });
    }

    const hashedPassword = await hashPassword(newPassword);
    await database.query(
      `
        UPDATE Users
        SET
          Pass_word = ?,
          Reset_otp = NULL,
          Reset_otp_expired = NULL,
          Refresh_token_hash = NULL,
          Refresh_token_expired = NULL
        WHERE Id_user = ?
      `,
      [hashedPassword, user.Id_user]
    );

    return res.json({
      message: "Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại.",
    });
  } catch (error) {
    console.error("Lỗi đặt lại mật khẩu:", error);
    return res
      .status(500)
      .json({ message: "Lỗi server khi đặt lại mật khẩu." });
  }
});

export default router;
