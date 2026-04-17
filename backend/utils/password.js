import bcrypt from "bcryptjs";

const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS || 10);

export const isBcryptHash = (value) =>
  typeof value === "string" && value.startsWith("$2");

export const hashPassword = async (plainPassword) =>
  bcrypt.hash(String(plainPassword), BCRYPT_ROUNDS);

export const comparePassword = async (plainPassword, storedPassword) => {
  if (!storedPassword) return false;

  if (isBcryptHash(storedPassword)) {
    return bcrypt.compare(String(plainPassword), storedPassword);
  }

  return String(plainPassword) === String(storedPassword);
};

