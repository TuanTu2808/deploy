import { verifyAccessToken } from "../utils/auth.js";

export const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ message: "Thiếu token đăng nhập." });
  }

  try {
    const payload = verifyAccessToken(token);
    req.auth = payload;
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Token không hợp lệ hoặc đã hết hạn." });
  }
};

export const requireRole = (...roles) => (req, res, next) => {
  const role = req.auth?.role;
  if (!role || !roles.includes(role)) {
    return res.status(403).json({ message: "Bạn không có quyền truy cập tài nguyên này." });
  }
  return next();
};

export const requireAdminAuth = (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ message: "Thiếu token đăng nhập." });
  }

  try {
    const payload = verifyAccessToken(token);
    if (payload?.role !== "admin") {
      return res.status(403).json({ message: "Chỉ quản trị viên mới được phép truy cập." });
    }
    req.auth = payload;
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Token không hợp lệ hoặc đã hết hạn." });
  }
};
