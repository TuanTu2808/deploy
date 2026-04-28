import type { AuthUser } from "./auth-types";

const ACCESS_TOKEN_KEY = "25zone_auth_access_token";
const REFRESH_TOKEN_KEY = "25zone_auth_refresh_token";
const USER_KEY = "25zone_auth_user";

// Legacy key để tương thích dữ liệu cũ chỉ có 1 token
const LEGACY_TOKEN_KEY = "25zone_auth_token";

type StorageKind = "local" | "session";

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

const getStorage = (kind: StorageKind): Storage | null => {
  if (typeof window === "undefined") return null;
  return kind === "local" ? window.localStorage : window.sessionStorage;
};

const read = (kind: StorageKind, key: string) => {
  return getStorage(kind)?.getItem(key) ?? null;
};

const write = (kind: StorageKind, key: string, value: string) => {
  getStorage(kind)?.setItem(key, value);
};

const remove = (kind: StorageKind, key: string) => {
  getStorage(kind)?.removeItem(key);
};

const hasAuthData = (kind: StorageKind) => {
  const access = read(kind, ACCESS_TOKEN_KEY) || read(kind, LEGACY_TOKEN_KEY);
  const user = read(kind, USER_KEY);
  return Boolean(access && user);
};

const detectAuthStorage = (): StorageKind | null => {
  if (hasAuthData("local")) return "local";
  if (hasAuthData("session")) return "session";

  if (
    read("local", ACCESS_TOKEN_KEY) ||
    read("local", LEGACY_TOKEN_KEY) ||
    read("local", USER_KEY)
  ) {
    return "local";
  }

  if (
    read("session", ACCESS_TOKEN_KEY) ||
    read("session", LEGACY_TOKEN_KEY) ||
    read("session", USER_KEY)
  ) {
    return "session";
  }

  return null;
};

const parseUser = (raw: string | null): AuthUser | null => {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
};

export const getCurrentAuthStorageKind = () => detectAuthStorage();

export const loadToken = () => {
  if (typeof window === "undefined") return null;
  const storage = detectAuthStorage();
  if (!storage) return null;
  return read(storage, ACCESS_TOKEN_KEY) || read(storage, LEGACY_TOKEN_KEY);
};

export const loadRefreshToken = () => {
  if (typeof window === "undefined") return null;
  const storage = detectAuthStorage();
  if (!storage) return null;
  return read(storage, REFRESH_TOKEN_KEY);
};

export const loadUser = (): AuthUser | null => {
  if (typeof window === "undefined") return null;
  const storage = detectAuthStorage();
  if (!storage) return null;
  return parseUser(read(storage, USER_KEY));
};

const clearAllAuthKeys = () => {
  remove("local", ACCESS_TOKEN_KEY);
  remove("local", REFRESH_TOKEN_KEY);
  remove("local", LEGACY_TOKEN_KEY);
  remove("local", USER_KEY);
  remove("session", ACCESS_TOKEN_KEY);
  remove("session", REFRESH_TOKEN_KEY);
  remove("session", LEGACY_TOKEN_KEY);
  remove("session", USER_KEY);
};

export const saveAuth = (
  tokens: AuthTokens,
  user: AuthUser,
  persistent = true
) => {
  if (typeof window === "undefined") return;
  const target: StorageKind = persistent ? "local" : "session";

  clearAllAuthKeys();
  write(target, ACCESS_TOKEN_KEY, tokens.accessToken);
  write(target, REFRESH_TOKEN_KEY, tokens.refreshToken);
  write(target, USER_KEY, JSON.stringify(user));
};

export const saveAuthUsingCurrentStorage = (tokens: AuthTokens, user: AuthUser) => {
  const storage = detectAuthStorage() ?? "local";
  saveAuth(tokens, user, storage === "local");
};

export const clearAuth = () => {
  if (typeof window === "undefined") return;
  clearAllAuthKeys();
};
