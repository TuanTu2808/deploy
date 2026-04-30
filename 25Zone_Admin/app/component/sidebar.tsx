"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  API_BASE,
  clearAdminSession,
  getAdminName,
  getAdminRefreshToken,
  getAdminToken,
  getAdminStoreId,
} from "@/app/lib/admin-auth";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [adminName] = useState(() => getAdminName() || "Quản trị viên");
  const [storeId] = useState(() => getAdminStoreId());
  const isAdminTong = storeId === 0 || storeId === null || isNaN(storeId);
  const adminRoleDisplay = isAdminTong ? "Admin Tổng" : "Admin Chi Nhánh";
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    // Fetch pending bookings count
    const fetchPendingCount = async () => {
      try {
        const res = await fetch(`${API_BASE || "http://localhost:5001"}/api/datlich?status=pending`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setPendingCount(data.length);
          }
        }
      } catch (err) {
        console.error("Lỗi lấy số lượng lịch hẹn chờ:", err);
      }
    };
    
    fetchPendingCount();
    const interval = setInterval(fetchPendingCount, 30000);

    // Listen to custom event from other components to refresh immediately
    window.addEventListener('booking_status_updated', fetchPendingCount);

    return () => {
      clearInterval(interval);
      window.removeEventListener('booking_status_updated', fetchPendingCount);
    };
  }, []);
  const isActive = (path: string) => pathname === path;

  const handleLogout = async () => {
    const refreshToken = getAdminRefreshToken();
    const accessToken = getAdminToken();

    if (refreshToken || accessToken) {
      fetch(`${API_BASE}/api/auth/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ refreshToken }),
        cache: "no-store",
      }).catch(() => {
        // ignore network errors on logout
      });
    }

    clearAdminSession();
    router.replace("/admin/login");
  };

  return (
    <aside className="w-[445px] bg-white flex flex-col border-r border-slate-200">
      {/* LOGO */}
      <div className="px-8 py-6">
        <Image
          src="/img/logo.jpg"
          alt="25Zone logo"
          width={140}
          height={40}
          className="h-auto w-auto"
        />

        <p className="text-xs text-gray-500 w-[130px] text-right font-bold">
          ADMIN PANEL
        </p>
      </div>

      {/* MENU */}
      <nav className="flex-1 px-8 py-6 space-y-6">
        {/* GROUP */}
        <div className="space-y-2">
          <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider">
            Tổng quan
          </p>

          {/* ACTIVE */}
          <Link href="/admin/dashboard">
            <div
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm cursor-pointer transition
              ${
                isActive("/admin/dashboard")
                  ? "bg-blue-50 text-[#0077B6] font-semibold "
                  : "text-gray-600 hover:bg-blue-50 hover:text-[#0077B6]"
              }
            `}
            >
              <i className="fa-solid fa-house w-5"></i>
              Bảng điều khiển
            </div>
          </Link>
        </div>

        {/* GROUP */}
        <div className="space-y-2">
          <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider">
            Vận hành dịch vụ
          </p>

          <Link href="/admin/lichhen">
            <div
              className={`flex items-center justify-between px-4 py-3 rounded-lg text-sm cursor-pointer transition
              ${
                isActive("/admin/lichhen")
                  ? "bg-blue-50 text-[#0077B6] font-semibold "
                  : "text-gray-600 hover:bg-blue-50 hover:text-[#0077B6]"
              }
            `}
            >
              <span className="flex items-center gap-3">
                <i className="fa-regular fa-calendar w-5"></i>
                Lịch hẹn
              </span>

              {pendingCount > 0 && (
                <span className="bg-red-100 text-red-500 text-[11px] font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
                  {pendingCount}
                </span>
              )}
            </div>
          </Link>

          <Link href="/admin/danhmucdichvu">
            <div
              className={`flex items-center justify-between px-4 py-3 rounded-lg text-sm cursor-pointer transition
              ${
                isActive("/admin/danhmucdichvu")
                  ? "bg-blue-50 text-[#0077B6] font-semibold  "
                  : "text-gray-600 hover:bg-blue-50 hover:text-[#0077B6]"
              }
            `}
            >
              <span className="flex items-center gap-3">
                <i className="fa-solid fa-list w-5"></i>
                Danh mục dịch vụ
              </span>
            </div>
          </Link>

          <Link href="/admin/dichvucombo">
            <div
              className={`flex items-center justify-between px-4 py-3 rounded-lg text-sm cursor-pointer transition
              ${
                isActive("/admin/dichvucombo")
                  ? "bg-blue-50 text-[#0077B6] font-semibold  "
                  : "text-gray-600 hover:bg-blue-50 hover:text-[#0077B6]"
              }
            `}
            >
              <span className="flex items-center gap-3">
                <i className="fa-solid fa-scissors w-5"></i>
                Dịch vụ & combo
              </span>
            </div>
          </Link>

          <Link href="/admin/khuyenmai/booking">
            <div
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm cursor-pointer transition
              ${
                isActive("/admin/khuyenmai/booking")
                  ? "bg-blue-50 text-[#0077B6] font-semibold "
                  : "text-gray-600 hover:bg-blue-50 hover:text-[#0077B6]"
              }
            `}
            >
              <i className="fa-solid fa-bullhorn w-5"></i>
              Khuyến mãi booking
            </div>
          </Link>

          <Link href="/admin/thocat">
            <div
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm cursor-pointer transition
              ${
                isActive("/admin/thocat")
                  ? "bg-blue-50 text-[#0077B6] font-semibold "
                  : "text-gray-600 hover:bg-blue-50 hover:text-[#0077B6]"
              }
            `}
            >
              <i className="fa-solid fa-user-group w-5"></i>
              Thợ cắt
            </div>
          </Link>

          <Link href="/admin/chinhanh">
            <div
              className={`flex items-center justify-between px-4 py-3 rounded-lg text-sm cursor-pointer transition
              ${
                isActive("/admin/chinhanh")
                  ? "bg-blue-50 text-[#0077B6] font-semibold  "
                  : "text-gray-600 hover:bg-blue-50 hover:text-[#0077B6]"
              }
            `}
            >
              <span className="flex items-center gap-3">
                <i className="fa-solid fa-store w-5"></i>
                Chi nhánh
              </span>
            </div>
          </Link>
        </div>

        {/* GROUP */}
        {isAdminTong && (
          <>
            <div className="space-y-2">
              <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider">
                Sản phẩm & đơn hàng
              </p>

          <Link href="/admin/sanpham">
            <div
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm cursor-pointer transition
              ${
                isActive("/admin/sanpham")
                  ? "bg-blue-50 text-[#0077B6] font-semibold "
                  : "text-gray-600 hover:bg-blue-50 hover:text-[#0077B6]"
              }
            `}
            >
              <i className="fa-solid fa-box w-5"></i>
              Quản lý sản phẩm
            </div>
          </Link>

          <Link href="/admin/khuyenmai">
            <div
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm cursor-pointer transition
              ${
                isActive("/admin/khuyenmai")
                  ? "bg-blue-50 text-[#0077B6] font-semibold "
                  : "text-gray-600 hover:bg-blue-50 hover:text-[#0077B6]"
              }
            `}
            >
              <i className="fa-solid fa-tag w-5"></i>
              Khuyến mãi sản phẩm
            </div>
          </Link>

          <Link href="/admin/danhmucsanpham">
            <div
              className={`flex items-center justify-between px-4 py-3 rounded-lg text-sm cursor-pointer transition
              ${
                isActive("/admin/danhmucsanpham")
                  ? "bg-blue-50 text-[#0077B6] font-semibold  "
                  : "text-gray-600 hover:bg-blue-50 hover:text-[#0077B6]"
              }
            `}
            >
              <span className="flex items-center gap-3">
                <i className="fa-solid fa-shapes w-5"></i>
                Danh mục sản phẩm
              </span>
            </div>
          </Link>

          <Link href="/admin/donhang">
            <div
              className={`flex items-center justify-between px-4 py-3 rounded-lg text-sm cursor-pointer transition
              ${
                isActive("/admin/donhang")
                  ? "bg-blue-50 text-[#0077B6] font-semibold  "
                  : "text-gray-600 hover:bg-blue-50 hover:text-[#0077B6]"
              }
            `}
            >
              <span className="flex items-center gap-3">
                <i className="fa-solid fa-cart-shopping w-5"></i>
                Quản lý đơn hàng
              </span>
            </div>
          </Link>
        </div>
        </>
        )}

        <div className="space-y-2">
          <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider">
            Chăm sóc khách hàng
          </p>

          <Link href="/admin/danhgia">
            <div
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm cursor-pointer transition
              ${
                isActive("/admin/danhgia")
                  ? "bg-blue-50 text-[#0077B6] font-semibold "
                  : "text-gray-600 hover:bg-blue-50 hover:text-[#0077B6]"
              }
            `}
            >
              <i className="fa-solid fa-star-half-stroke w-5"></i>
              Đánh giá & bình luận
            </div>
          </Link>
        </div>

        {/* GROUP */}
        <div className="space-y-2">
          <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider">
            Truyền thông
          </p>

          <Link href="/admin/tintuc">
            <div
              className={`flex items-center justify-between px-4 py-3 rounded-lg text-sm cursor-pointer transition
              ${
                isActive("/admin/tintuc")
                  ? "bg-blue-50 text-[#0077B6] font-semibold  "
                  : "text-gray-600 hover:bg-blue-50 hover:text-[#0077B6]"
              }
            `}
            >
              <span className="flex items-center gap-3">
                <i className="fa-solid fa-newspaper w-5"></i>
                Quản lý tin tức
              </span>
            </div>
          </Link>

          <Link href="/admin/loaitin">
            <div
              className={`flex items-center justify-between px-4 py-3 rounded-lg text-sm cursor-pointer transition
              ${
                isActive("/admin/loaitin")
                  ? "bg-blue-50 text-[#0077B6] font-semibold  "
                  : "text-gray-600 hover:bg-blue-50 hover:text-[#0077B6]"
              }
            `}
            >
              <span className="flex items-center gap-3">
                <i className="fa-solid fa-folder w-5"></i>
                Quản lý loại tin
              </span>
            </div>
          </Link>
        </div>

        {/* GROUP */}
        <div className="space-y-2">
          <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider">
            Hệ thống
          </p>

          <Link href="/admin/taikhoan">
            <div
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm cursor-pointer transition
              ${
                isActive("/admin/taikhoan")
                  ? "bg-blue-50 text-[#0077B6] font-semibold "
                  : "text-gray-600 hover:bg-blue-50 hover:text-[#0077B6]"
              }
            `}
            >
              <i className="fa-solid fa-bullhorn w-5"></i>
              Quản lý tài khoản
            </div>
          </Link>
        </div>
      </nav>

      {/* SPACE */}
      <div className="h-12"></div>

      {/* USER */}
      <div className="border-t border-slate-200 px-8 py-4">
        <div className="flex items-center gap-3 mb-3">
          <Image
            src="https://i.pravatar.cc/40"
            alt="Admin avatar"
            width={40}
            height={40}
            unoptimized
            className="rounded-full"
          />

          <div>
            <p className="font-medium text-sm">{adminName}</p>
            <p className="text-xs text-gray-500">{adminRoleDisplay}</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 text-red-500 hover:bg-red-50 py-2 rounded-lg text-sm"
        >
          <i className="fa-solid fa-right-from-bracket"></i>
          Đăng xuất
        </button>
      </div>
    </aside>
  );
}
