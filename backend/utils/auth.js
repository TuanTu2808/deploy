import jwt from "jsonwebtoken";
import { createHash } from "crypto";

const ACCESS_TOKEN_SECRET =
  process.env.ACCESS_TOKEN_SECRET ||
  process.env.JWT_SECRET ||
  "25zone_dev_access_secret_change_me";
const ACCESS_TOKEN_EXPIRES_IN =
  process.env.ACCESS_TOKEN_EXPIRES_IN || process.env.JWT_EXPIRES_IN || "15m";

const REFRESH_TOKEN_SECRET =
  process.env.REFRESH_TOKEN_SECRET || `${ACCESS_TOKEN_SECRET}_refresh`;
const REFRESH_TOKEN_EXPIRES_IN_REMEMBER =
  process.env.REFRESH_TOKEN_EXPIRES_IN_REMEMBER ||
  process.env.REFRESH_TOKEN_EXPIRES_IN ||
  "30d";
const REFRESH_TOKEN_EXPIRES_IN_SESSION =
  process.env.REFRESH_TOKEN_EXPIRES_IN_SESSION || "1d";

export const signAccessToken = (user) =>
  jwt.sign(
    {
      id: user.Id_user,
      role: user.role,
      name: user.Name_user,
      typ: "access",
    },
    ACCESS_TOKEN_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRES_IN }
  );

export const signRefreshToken = (user, remember = true) =>
  jwt.sign(
    {
      id: user.Id_user,
      role: user.role,
      name: user.Name_user,
      typ: "refresh",
    },
    REFRESH_TOKEN_SECRET,
    {
      expiresIn: remember
        ? REFRESH_TOKEN_EXPIRES_IN_REMEMBER
        : REFRESH_TOKEN_EXPIRES_IN_SESSION,
    }
  );

export const verifyAccessToken = (token) =>
  jwt.verify(token, ACCESS_TOKEN_SECRET);

export const verifyRefreshToken = (token) =>
  jwt.verify(token, REFRESH_TOKEN_SECRET);

export const hashRefreshToken = (token) =>
  createHash("sha256").update(String(token)).digest("hex");

export const sanitizeUser = (row) => ({
  Id_user: row.Id_user,
  Name_user: row.Name_user,
  Phone: row.Phone,
  Email: row.Email,
  Address: row.Address,
  Image: row.Image,
  role: row.role,
  Id_store: row.Id_store,
});
