"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  API_BASE,
  clearAdminSession,
  isAdminRole,
  persistAdminSession,
  type AdminUserSession,
} from "@/app/lib/admin-auth";

type LoginResponse = {
  message?: string;
  token?: string;
  accessToken?: string;
  refreshToken?: string;
  user?: AdminUserSession;
};

const getErrorMessage = (payload: LoginResponse | null, fallback: string) => {
  if (payload?.message && payload.message.trim()) return payload.message;
  return fallback;
};

export default function AdminLoginPage() {
  const router = useRouter();
  const [nextPath, setNextPath] = useState("/admin/dashboard");

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const next = params.get("next");
    if (next && next.startsWith("/admin") && next !== "/admin/login") {
      setNextPath(next);
    }
  }, []);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const account = identifier.trim();
    const secret = password.trim();

    if (!account || !secret) {
      setError("Vui lòng nhập email/số điện thoại và mật khẩu.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      clearAdminSession();

      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: account,
          password: secret,
          remember,
        }),
      });

      let payload: LoginResponse | null = null;
      try {
        payload = (await response.json()) as LoginResponse;
      } catch {
        payload = null;
      }

      if (!response.ok) {
        throw new Error(getErrorMessage(payload, "Đăng nhập thất bại."));
      }

      const accessToken = String(payload?.accessToken || payload?.token || "").trim();
      const refreshToken = String(payload?.refreshToken || "").trim();
      if (!accessToken || !refreshToken || !payload?.user) {
        throw new Error("Không nhận được đầy đủ token đăng nhập.");
      }

      if (!isAdminRole(payload.user.role)) {
        clearAdminSession();
        throw new Error("Tài khoản không có quyền truy cập trang quản trị.");
      }

      persistAdminSession({
        accessToken,
        refreshToken,
        user: payload.user,
        remember,
      });

      router.replace(nextPath);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra khi đăng nhập.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-[radial-gradient(circle_at_top,#E0F2FE_0%,#F8FAFC_50%,#F8FAFC_100%)] p-4">
      <div className="w-full max-w-[460px] rounded-3xl border border-[#E2E8F0] bg-white p-7 shadow-[0_20px_50px_-28px_rgba(15,23,42,0.45)]">
        <div className="mb-6">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#0EA5E9]">25ZONE ADMIN</p>
          <h1 className="mt-2 text-3xl font-bold text-[#0F172A]">Đăng nhập quản trị</h1>
          <p className="mt-1 text-sm text-[#64748B]">
            Chỉ tài khoản quản trị viên mới được phép truy cập hệ thống quản lý.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-3 py-2 text-sm text-[#B91C1C]">
            {error}
          </div>
        )}

        <form className="space-y-4" onSubmit={onSubmit}>
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-[#334155]">Email hoặc số điện thoại</span>
            <input
              type="text"
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              placeholder="admin@25zone.vn hoặc 09xxxxxxxx"
              className="w-full rounded-xl border border-[#D0D7E2] px-3 py-2.5 text-sm outline-none focus:border-[#0EA5E9]"
              autoComplete="username"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-[#334155]">Mật khẩu</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Nhập mật khẩu"
              className="w-full rounded-xl border border-[#D0D7E2] px-3 py-2.5 text-sm outline-none focus:border-[#0EA5E9]"
              autoComplete="current-password"
            />
          </label>

          <div className="flex items-center justify-between text-sm">
            <label className="inline-flex items-center gap-2 text-[#334155]">
              <input
                type="checkbox"
                checked={remember}
                onChange={(event) => setRemember(event.target.checked)}
                className="h-4 w-4 rounded border-[#CBD5E1]"
              />
              Ghi nhớ đăng nhập
            </label>

            <Link href="#" className="text-[#0EA5E9] hover:text-[#0284C7]">
              Quên mật khẩu?
            </Link>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-[#0EA5E9] px-4 py-3 text-base font-bold uppercase tracking-wide text-white transition hover:bg-[#0284C7] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-[#94A3B8]">
          Bằng việc tiếp tục, bạn đồng ý tuân thủ chính sách bảo mật dành cho quản trị viên.
        </p>
      </div>
    </main>
  );
}
