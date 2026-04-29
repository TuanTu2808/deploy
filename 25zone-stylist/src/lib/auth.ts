const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

/* ─── Types ─── */
export interface StylistUser {
  Id_user: number;
  Name_user: string;
  Phone: string;
  Email: string;
  Address: string;
  Image: string | null;
  role: string;
  Id_store: number;
}

export interface AuthResponse {
  message: string;
  accessToken: string;
  refreshToken: string;
  token: string;
  user: StylistUser;
}

export interface AuthError {
  message: string;
}

/* ─── Cookie helpers (client-side) ─── */
function setCookie(name: string, value: string, days: number) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function deleteCookie(name: string) {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
}

/* ─── Auth API ─── */

/**
 * Login to backend API with role validation for stylist.
 * Throws error string on failure.
 */
export async function loginStylist(
  identifier: string,
  password: string,
  remember: boolean = true
): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier, password, remember }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Đăng nhập thất bại.");
  }

  // Validate role: only stylist / admin allowed
  const role = data.user?.role?.toLowerCase();
  if (role !== "stylist" && role !== "admin") {
    throw new Error("Tài khoản này không có quyền truy cập hệ thống Stylist.");
  }

  // Persist tokens & user info into cookies
  const cookieDays = remember ? 30 : 1;
  setCookie("stylist_token", data.accessToken, cookieDays);
  setCookie("stylist_refresh_token", data.refreshToken, cookieDays);
  setCookie("stylist_user", JSON.stringify(data.user), cookieDays);

  return data as AuthResponse;
}

/**
 * Logout: clear cookies & call backend logout endpoint.
 */
export async function logoutStylist(): Promise<void> {
  const refreshToken = getCookie("stylist_refresh_token");
  const accessToken = getCookie("stylist_token");

  try {
    await fetch(`${API_BASE}/auth/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify({ refreshToken: refreshToken || "" }),
    });
  } catch {
    // Ignore network errors on logout
  }

  deleteCookie("stylist_token");
  deleteCookie("stylist_refresh_token");
  deleteCookie("stylist_user");
}

/**
 * Get current user from cookie (client-side only).
 */
export function getCurrentUser(): StylistUser | null {
  try {
    const raw = getCookie("stylist_user");
    if (!raw) return null;
    return JSON.parse(raw) as StylistUser;
  } catch {
    return null;
  }
}

/**
 * Check if user is authenticated (client-side).
 */
export function isAuthenticated(): boolean {
  return !!getCookie("stylist_token");
}

/**
 * Get access token for authorized API calls.
 */
export function getAccessToken(): string | null {
  return getCookie("stylist_token");
}

/**
 * Update user cookie after profile edits.
 */
export function updateCurrentUser(user: StylistUser): void {
  setCookie("stylist_user", JSON.stringify(user), 30);
}

/**
 * Get user initials for avatar.
 */
export function getUserInitials(name: string): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}
