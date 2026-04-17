export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_BASE ||
  "http://localhost:5001";

export const ADMIN_TOKEN_COOKIE = "admin_token";
export const ADMIN_REFRESH_TOKEN_COOKIE = "admin_refresh_token";
export const ADMIN_ROLE_COOKIE = "admin_role";
export const ADMIN_NAME_COOKIE = "admin_name";
export const ADMIN_ID_COOKIE = "admin_id";
export const ADMIN_REMEMBER_COOKIE = "admin_remember";

const PERSIST_DAYS = 30;

export type AdminUserSession = {
  Id_user: number;
  Name_user: string;
  role: string;
};

type PersistOptions = {
  accessToken: string;
  refreshToken: string;
  user: AdminUserSession;
  remember: boolean;
};

type RefreshPayload = {
  message?: string;
  accessToken?: string;
  refreshToken?: string;
  token?: string;
  user?: AdminUserSession;
};

const getCookieOptions = (remember: boolean) => {
  const base = "path=/; SameSite=Lax";
  if (!remember) return base;
  return `${base}; Max-Age=${60 * 60 * 24 * PERSIST_DAYS}`;
};

const setCookie = (name: string, value: string, remember: boolean) => {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=${encodeURIComponent(value)}; ${getCookieOptions(remember)}`;
};

const clearCookie = (name: string) => {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; path=/; Max-Age=0; SameSite=Lax`;
};

export const isAdminRole = (role: string | undefined | null) => role === "admin";

export const getCookieValue = (name: string) => {
  if (typeof document === "undefined") return "";
  const source = document.cookie || "";
  const target = source
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${name}=`));

  if (!target) return "";
  return decodeURIComponent(target.slice(name.length + 1));
};

export const getAdminToken = () => getCookieValue(ADMIN_TOKEN_COOKIE);
export const getAdminRefreshToken = () => getCookieValue(ADMIN_REFRESH_TOKEN_COOKIE);
export const getAdminRole = () => getCookieValue(ADMIN_ROLE_COOKIE);
export const getAdminName = () => getCookieValue(ADMIN_NAME_COOKIE);
export const getAdminId = () => Number(getCookieValue(ADMIN_ID_COOKIE) || 0);
export const getAdminRemember = () => getCookieValue(ADMIN_REMEMBER_COOKIE) === "1";

export const getAdminAuthHeaders = (contentType = false): HeadersInit => {
  const headers: Record<string, string> = {};
  const token = getAdminToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  if (contentType) {
    headers["Content-Type"] = "application/json";
  }
  return headers;
};

export const persistAdminSession = ({
  accessToken,
  refreshToken,
  user,
  remember,
}: PersistOptions) => {
  setCookie(ADMIN_TOKEN_COOKIE, accessToken, remember);
  setCookie(ADMIN_REFRESH_TOKEN_COOKIE, refreshToken, remember);
  setCookie(ADMIN_ROLE_COOKIE, user.role, remember);
  setCookie(ADMIN_NAME_COOKIE, user.Name_user, remember);
  setCookie(ADMIN_ID_COOKIE, String(user.Id_user), remember);
  setCookie(ADMIN_REMEMBER_COOKIE, remember ? "1" : "0", remember);
};

export const clearAdminSession = () => {
  clearCookie(ADMIN_TOKEN_COOKIE);
  clearCookie(ADMIN_REFRESH_TOKEN_COOKIE);
  clearCookie(ADMIN_ROLE_COOKIE);
  clearCookie(ADMIN_NAME_COOKIE);
  clearCookie(ADMIN_ID_COOKIE);
  clearCookie(ADMIN_REMEMBER_COOKIE);
};

const parseRefreshResponse = (payload: RefreshPayload | null) => {
  const accessToken = String(payload?.accessToken || payload?.token || "").trim();
  const refreshToken = String(payload?.refreshToken || "").trim();
  const user = payload?.user;
  if (!accessToken || !refreshToken || !user) return null;
  return { accessToken, refreshToken, user };
};

export const tryRefreshAdminSession = async (): Promise<boolean> => {
  const refreshToken = getAdminRefreshToken();
  if (!refreshToken) return false;

  try {
    const response = await fetch(`${API_BASE}/api/auth/refresh-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        refreshToken,
        remember: getAdminRemember(),
      }),
      cache: "no-store",
    });

    let payload: RefreshPayload | null = null;
    try {
      payload = (await response.json()) as RefreshPayload;
    } catch {
      payload = null;
    }

    if (!response.ok) {
      clearAdminSession();
      return false;
    }

    const parsed = parseRefreshResponse(payload);
    if (!parsed || !isAdminRole(parsed.user.role)) {
      clearAdminSession();
      return false;
    }

    persistAdminSession({
      accessToken: parsed.accessToken,
      refreshToken: parsed.refreshToken,
      user: parsed.user,
      remember: getAdminRemember(),
    });

    return true;
  } catch {
    clearAdminSession();
    return false;
  }
};

export const authorizedAdminFetch = async (
  input: string,
  init: RequestInit = {},
  onUnauthorized?: () => void
) => {
  const buildHeaders = () => {
    const headers = new Headers(init.headers);
    const authHeaders = getAdminAuthHeaders();
    Object.entries(authHeaders).forEach(([key, value]) => {
      headers.set(key, value);
    });
    return headers;
  };

  let response = await fetch(input, { ...init, headers: buildHeaders() });

  if (response.status === 401) {
    const refreshed = await tryRefreshAdminSession();
    if (refreshed) {
      response = await fetch(input, { ...init, headers: buildHeaders() });
    }
  }

  if (response.status === 401 || response.status === 403) {
    clearAdminSession();
    if (onUnauthorized) onUnauthorized();
  }

  return response;
};
