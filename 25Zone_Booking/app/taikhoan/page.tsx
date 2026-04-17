"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import BookingAccountShell from "@/app/components/account/BookingAccountShell";
import { useAuth } from "@/app/components/auth/AuthProvider";
import { apiRequest, errorMessage, toAbsoluteImageUrl } from "@/lib/api";
import type { AuthUser } from "@/lib/auth-types";

const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5001";

export default function BookingAccountPage() {
  const { token, user, bootstrapped, setUser } = useAuth();
  const [hydrated, setHydrated] = useState(false);
  const [name, setName] = useState(user?.Name_user || "");
  const [phone, setPhone] = useState(user?.Phone || "");
  const [email, setEmail] = useState(user?.Email || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setName(user?.Name_user || "");
    setPhone(user?.Phone || "");
    setEmail(user?.Email || "");
  }, [user]);

  useEffect(() => {
    setHydrated(true);
  }, []);

  const submitProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token || !user) return;

    setProfileError("");
    setProfileSuccess("");

    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedName) {
      setProfileError("Vui lòng nhập họ tên.");
      return;
    }
    if (!trimmedPhone) {
      setProfileError("Vui lòng nhập số điện thoại.");
      return;
    }
    if (!trimmedEmail) {
      setProfileError("Vui lòng nhập email.");
      return;
    }

    try {
      setProfileSaving(true);
      const response = await apiRequest<{ message: string; user: AuthUser }>("/api/users/me", {
        method: "PUT",
        token,
        body: {
          name: trimmedName,
          phone: trimmedPhone,
          email: trimmedEmail,
          address: user.Address,
        },
      });
      setUser(response.user);
      setProfileSuccess(response.message || "Cập nhật thông tin thành công.");
    } catch (err) {
      setProfileError(errorMessage(err));
    } finally {
      setProfileSaving(false);
    }
  };

  const submitPassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) return;

    setPasswordError("");
    setPasswordSuccess("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("Vui lòng nhập đầy đủ thông tin mật khẩu.");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("Mật khẩu mới tối thiểu 6 ký tự.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Xác nhận mật khẩu mới chưa khớp.");
      return;
    }

    try {
      setPasswordSaving(true);
      const response = await apiRequest<{ message: string }>(
        "/api/users/me/password",
        {
          method: "PUT",
          token,
          body: {
            currentPassword,
            newPassword,
          },
        }
      );
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordSuccess(response.message || "Cập nhật mật khẩu thành công.");
    } catch (err) {
      setPasswordError(errorMessage(err));
    } finally {
      setPasswordSaving(false);
    }
  };

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !token) return;

    setProfileError("");
    setProfileSuccess("");

    try {
      setAvatarLoading(true);
      const formData = new FormData();
      formData.append("avatar", file);

      const response = await fetch(`${apiBase}/api/users/me/avatar`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = (await response.json().catch(() => ({}))) as {
        message?: string;
        user?: AuthUser;
      };

      if (!response.ok || !data.user) {
        throw new Error(data.message || "Cập nhật ảnh đại diện thất bại.");
      }

      setUser(data.user);
      setProfileSuccess(data.message || "Đã cập nhật ảnh đại diện.");
    } catch (err) {
      setProfileError(errorMessage(err));
    } finally {
      setAvatarLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  if (!hydrated || !bootstrapped) {
    return (
      <main className="max-w-[1604px] mx-auto px-4 py-12">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-gray-600">
          Đang tải thông tin tài khoản...
        </div>
      </main>
    );
  }

  if (!user || !token) {
    return (
      <main className="max-w-[1604px] mx-auto px-4 py-12">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center">
          <p className="text-gray-700 font-semibold">
            Vui lòng đăng nhập để quản lý tài khoản.
          </p>
          <Link
            href="/?auth=login"
            className="inline-flex mt-4 rounded-xl bg-[#003366] px-5 py-3 text-white font-bold hover:bg-[#002244] transition"
          >
            Đăng nhập
          </Link>
        </div>
      </main>
    );
  }

  const avatar = toAbsoluteImageUrl(user.Image) || "/image/avatar.png";

  return (
    <main>
      <div className="max-w-[1604px] mx-auto px-4 mt-10 text-[15px] sm:text-base text-gray-500">
        <div className="flex flex-wrap items-center gap-2">
          <Link className="hover:text-[#003366] font-semibold transition" href="/">
            Trang chủ
          </Link>
          <i className="fa-solid fa-chevron-right text-[11px] text-gray-300"></i>
          <span className="text-gray-700 font-extrabold">Thông tin tài khoản</span>
        </div>
      </div>

      <section className="max-w-[1604px] mx-auto px-4 py-10">
        <BookingAccountShell active="profile">
          <div className="border border-gray-200 rounded-2xl bg-white shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg sm:text-xl font-extrabold text-[#003366]">
                Quản lý tài khoản
              </h3>
            </div>

            <div className="p-6">
              {profileError ? (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {profileError}
                </div>
              ) : null}

              {profileSuccess ? (
                <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {profileSuccess}
                </div>
              ) : null}

              <form onSubmit={submitProfile} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-4">
                  <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
                    <p className="text-sm font-bold text-gray-700 mb-4">Ảnh đại diện</p>
                    <img
                      src={avatar}
                      alt={user.Name_user}
                      className="w-28 h-28 rounded-full object-cover border border-gray-200"
                    />
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={uploadAvatar}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={avatarLoading}
                      className="mt-4 inline-flex rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-100 transition disabled:opacity-60"
                    >
                      {avatarLoading ? "Đang tải ảnh..." : "Đổi ảnh đại diện"}
                    </button>
                  </div>
                </div>

                <div className="lg:col-span-8 space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Họ và tên</label>
                    <input
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#003366]/20"
                      placeholder="Nhập họ tên"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Số điện thoại</label>
                    <input
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#003366]/20"
                      placeholder="Nhập số điện thoại mới"
                      type="tel"
                      inputMode="tel"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                    <input
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#003366]/20"
                      placeholder="Nhập email mới"
                      type="email"
                      inputMode="email"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={profileSaving}
                      className="inline-flex rounded-xl bg-[#003366] px-5 py-3 text-white font-bold hover:bg-[#002244] transition disabled:opacity-60"
                    >
                      {profileSaving ? "Đang lưu..." : "Lưu thay đổi"}
                    </button>
                  </div>
                </div>
              </form>

              <div className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 p-5">
                <div className="mb-4">
                  <h4 className="text-base font-extrabold text-[#003366]">
                    Đổi mật khẩu
                  </h4>
                </div>

                {passwordError ? (
                  <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {passwordError}
                  </div>
                ) : null}

                {passwordSuccess ? (
                  <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    {passwordSuccess}
                  </div>
                ) : null}

                <form onSubmit={submitPassword} className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                      Mật khẩu hiện tại
                    </label>
                    <div className="relative">
                      <input
                        value={currentPassword}
                        onChange={(event) => setCurrentPassword(event.target.value)}
                        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 pr-12 text-sm outline-none focus:ring-2 focus:ring-[#003366]/20"
                        placeholder="Nhập mật khẩu hiện tại"
                        type={showCurrentPassword ? "text" : "password"}
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword((value) => !value)}
                        aria-label={showCurrentPassword ? "Ẩn mật khẩu hiện tại" : "Hiện mật khẩu hiện tại"}
                        className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-gray-400 transition hover:text-[#003366]"
                      >
                        <span className="material-symbols-outlined text-[20px]">
                          {showCurrentPassword ? "visibility" : "visibility_off"}
                        </span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                      Mật khẩu mới
                    </label>
                    <div className="relative">
                      <input
                        value={newPassword}
                        onChange={(event) => setNewPassword(event.target.value)}
                        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 pr-12 text-sm outline-none focus:ring-2 focus:ring-[#003366]/20"
                        placeholder="Nhập mật khẩu mới"
                        type={showNewPassword ? "text" : "password"}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword((value) => !value)}
                        aria-label={showNewPassword ? "Ẩn mật khẩu mới" : "Hiện mật khẩu mới"}
                        className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-gray-400 transition hover:text-[#003366]"
                      >
                        <span className="material-symbols-outlined text-[20px]">
                          {showNewPassword ? "visibility" : "visibility_off"}
                        </span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                      Xác nhận mật khẩu mới
                    </label>
                    <div className="relative">
                      <input
                        value={confirmPassword}
                        onChange={(event) => setConfirmPassword(event.target.value)}
                        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 pr-12 text-sm outline-none focus:ring-2 focus:ring-[#003366]/20"
                        placeholder="Nhập lại mật khẩu mới"
                        type={showConfirmPassword ? "text" : "password"}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((value) => !value)}
                        aria-label={showConfirmPassword ? "Ẩn xác nhận mật khẩu mới" : "Hiện xác nhận mật khẩu mới"}
                        className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-gray-400 transition hover:text-[#003366]"
                      >
                        <span className="material-symbols-outlined text-[20px]">
                          {showConfirmPassword ? "visibility" : "visibility_off"}
                        </span>
                      </button>
                    </div>
                  </div>

                  <div className="md:col-span-2 pt-1">
                    <button
                      type="submit"
                      disabled={passwordSaving}
                      className="inline-flex rounded-xl border border-[#003366] bg-white px-5 py-3 font-bold text-[#003366] transition hover:bg-[#003366] hover:text-white disabled:opacity-60"
                    >
                      {passwordSaving ? "Đang cập nhật..." : "Cập nhật mật khẩu"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </BookingAccountShell>
      </section>
    </main>
  );
}
