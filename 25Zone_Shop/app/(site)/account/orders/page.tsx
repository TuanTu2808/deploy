import Link from "next/link";
import { AccountShell } from "@/app/components/account/AccountShell";

export default function AccountOrdersPage() {
  return (
    <main>
      {/* Breadcrumb */}
      <div className="max-w-[1604px] mx-auto px-4 mt-10 text-[15px] sm:text-base text-gray-500">
        <div className="flex flex-wrap items-center gap-2">
          <Link className="hover:text-[#003366] font-semibold transition" href="/">
            Trang chủ
          </Link>
          <i className="fa-solid fa-chevron-right text-[11px] text-gray-300"></i>
          <span className="text-gray-700 font-semibold">Tài khoản</span>
          <i className="fa-solid fa-chevron-right text-[11px] text-gray-300"></i>
          <span className="text-gray-700 font-extrabold">Đơn hàng của tôi</span>
        </div>
      </div>

      {/* Account Wrapper */}
      <section className="max-w-[1604px] mx-auto px-4 py-10">
        {/* ✅ Chỉ thay phần này: dùng Shell chung (mobile nav + desktop sidebar) */}
        <AccountShell active="orders">
          <div className="border border-gray-200 rounded-2xl bg-white shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="text-lg sm:text-xl font-extrabold text-[#003366]">
                  Đơn hàng của tôi
                </h3>

                <div className="relative w-full sm:w-[360px]">
                  <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
                  <input
                    className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]/15"
                    placeholder="Tìm theo mã đơn hàng..."
                    type="text"
                  />
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <button className="px-4 py-2 rounded-full bg-[#003366] text-white font-bold text-sm">
                  Tất cả
                </button>
                <button className="px-4 py-2 rounded-full border border-gray-200 bg-white text-gray-700 font-semibold text-sm hover:bg-gray-50 transition">
                  Chờ xác nhận
                </button>
                <button className="px-4 py-2 rounded-full border border-gray-200 bg-white text-gray-700 font-semibold text-sm hover:bg-gray-50 transition">
                  Đang giao
                </button>
                <button className="px-4 py-2 rounded-full border border-gray-200 bg-white text-gray-700 font-semibold text-sm hover:bg-gray-50 transition">
                  Hoàn thành
                </button>
                <button className="px-4 py-2 rounded-full border border-gray-200 bg-white text-gray-700 font-semibold text-sm hover:bg-gray-50 transition">
                  Đã hủy
                </button>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* Order card 1 */}
              <div className="border border-gray-200 rounded-2xl p-5 bg-white hover:shadow-md transition">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Mã đơn hàng</p>
                    <p className="font-extrabold text-[#003366]">#ODR-250127</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-sm font-bold text-amber-700">
                      <i className="fa-solid fa-clock"></i>
                      Chờ xác nhận
                    </span>
                    <span className="text-sm text-gray-500">27/01/2026</span>
                  </div>
                </div>

                <div className="mt-4 border-t border-gray-100 pt-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <img
                        alt="Sản phẩm"
                        className="w-20 h-20 rounded-xl border border-gray-200 object-cover"
                        src="/img/image%2077.png"
                      />
                      <div className="min-w-0">
                        <p className="font-bold text-gray-900 truncate">
                          Sữa Rửa Mặt Tràm Trà Dr.FORSKIN Tea tree
                        </p>
                        <p className="text-sm text-gray-600 mt-1">120ml × 3</p>
                      </div>
                    </div>

                    <div className="sm:text-right">
                      <p className="text-xs text-gray-500">Tổng thanh toán</p>
                      <p className="font-extrabold text-[#8b1e1e] text-lg tabular-nums">
                        497.000đ
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <i className="fa-solid fa-credit-card text-gray-400"></i>
                      Thanh toán:{" "}
                      <span className="font-semibold text-gray-800">COD</span>
                    </div>
                    <div className="flex gap-3">
                      <a
                        className="inline-flex items-center justify-center rounded-xl border border-gray-200 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50 transition"
                        href="/account/orders/ODR-250127"
                      >
                        Xem chi tiết
                      </a>
                      <button className="inline-flex items-center justify-center rounded-xl bg-[#003366] px-4 py-2 text-sm font-extrabold text-white hover:bg-[#002244] transition">
                        Mua lại
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order card 2 */}
              <div className="border border-gray-200 rounded-2xl p-5 bg-white hover:shadow-md transition">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Mã đơn hàng</p>
                    <p className="font-extrabold text-[#003366]">#ODR-250112</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-1 text-sm font-bold text-sky-700">
                      <i className="fa-solid fa-truck-fast"></i>
                      Đang giao
                    </span>
                    <span className="text-sm text-gray-500">12/01/2026</span>
                  </div>
                </div>

                <div className="mt-4 border-t border-gray-100 pt-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <img
                        alt="Sản phẩm"
                        className="w-20 h-20 rounded-xl border border-gray-200 object-cover"
                        src="/img/image%2077.png"
                      />
                      <div className="min-w-0">
                        <p className="font-bold text-gray-900 truncate">Sáp Zone Clay</p>
                        <p className="text-sm text-gray-600 mt-1">1 hộp × 1</p>
                      </div>
                    </div>

                    <div className="sm:text-right">
                      <p className="text-xs text-gray-500">Tổng thanh toán</p>
                      <p className="font-extrabold text-[#8b1e1e] text-lg tabular-nums">
                        350.000đ
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <i className="fa-solid fa-building-columns text-gray-400"></i>
                      Thanh toán:{" "}
                      <span className="font-semibold text-gray-800">Chuyển khoản</span>
                    </div>
                    <div className="flex gap-3">
                      <a
                        className="inline-flex items-center justify-center rounded-xl border border-gray-200 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50 transition"
                        href="#"
                      >
                        Theo dõi
                      </a>
                      <button className="inline-flex items-center justify-center rounded-xl bg-[#003366] px-4 py-2 text-sm font-extrabold text-white hover:bg-[#002244] transition">
                        Mua lại
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order card 3 */}
              <div className="border border-gray-200 rounded-2xl p-5 bg-white hover:shadow-md transition">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Mã đơn hàng</p>
                    <p className="font-extrabold text-[#003366]">#ODR-241228</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-sm font-bold text-emerald-700">
                      <i className="fa-solid fa-circle-check"></i>
                      Hoàn thành
                    </span>
                    <span className="text-sm text-gray-500">28/12/2025</span>
                  </div>
                </div>

                <div className="mt-4 border-t border-gray-100 pt-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <img
                        alt="Sản phẩm"
                        className="w-20 h-20 rounded-xl border border-gray-200 object-cover"
                        src="/img/image%2077.png"
                      />
                      <div className="min-w-0">
                        <p className="font-bold text-gray-900 truncate">Dầu gội Volcanic</p>
                        <p className="text-sm text-gray-600 mt-1">500ml × 1</p>
                      </div>
                    </div>

                    <div className="sm:text-right">
                      <p className="text-xs text-gray-500">Tổng thanh toán</p>
                      <p className="font-extrabold text-[#8b1e1e] text-lg tabular-nums">
                        249.000đ
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <i className="fa-solid fa-credit-card text-gray-400"></i>
                      Thanh toán:{" "}
                      <span className="font-semibold text-gray-800">COD</span>
                    </div>
                    <div className="flex gap-3">
                      <a
                        className="inline-flex items-center justify-center rounded-xl border border-gray-200 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50 transition"
                        href="#"
                      >
                        Xem chi tiết
                      </a>
                      <button className="inline-flex items-center justify-center rounded-xl bg-[#003366] px-4 py-2 text-sm font-extrabold text-white hover:bg-[#002244] transition">
                        Mua lại
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex justify-end gap-2">
              <button className="w-10 h-10 rounded-xl bg-[#003366] text-white font-extrabold">
                1
              </button>
              <button className="w-10 h-10 rounded-xl border border-gray-200 font-extrabold hover:bg-gray-50 transition">
                2
              </button>
              <button className="w-10 h-10 rounded-xl border border-gray-200 font-extrabold hover:bg-gray-50 transition">
                3
              </button>
              <button className="w-10 h-10 rounded-xl border border-gray-200 font-extrabold hover:bg-gray-50 transition">
                &gt;&gt;
              </button>
            </div>
          </div>
        </AccountShell>
      </section>
    </main>
  );
}
