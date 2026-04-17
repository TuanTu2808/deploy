import Link from "next/link";
import { AccountShell } from "@/app/components/account/AccountShell";

export default function AccountAddressPage() {
  return (
    <main>
      <div className="max-w-[1604px] mx-auto px-4 mt-10 text-[15px] sm:text-base text-gray-500">
        <div className="flex flex-wrap items-center gap-2">
          <Link className="hover:text-[#003366] font-semibold transition" href="/">
            Trang chủ
          </Link>
          <i className="fa-solid fa-chevron-right text-[11px] text-gray-300"></i>
          <span className="text-gray-700 font-semibold">Tài khoản</span>
          <i className="fa-solid fa-chevron-right text-[11px] text-gray-300"></i>
          <span className="text-gray-700 font-extrabold">Địa chỉ giao hàng</span>
        </div>
      </div>

      <section className="max-w-[1604px] mx-auto px-4 py-10">
        <AccountShell active="address">
          <div className="border border-gray-200 rounded-2xl bg-white shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-extrabold text-[#003366]">Địa chỉ giao hàng</h3>
                <p className="text-sm text-gray-500 mt-1">Quản lý địa chỉ nhận hàng của bạn.</p>
              </div>
              <a
                className="inline-flex items-center gap-2 rounded-full bg-[#003366] text-white px-5 py-2.5 font-extrabold text-sm hover:bg-[#002244] transition"
                href="#add-address"
              >
                <i className="fa-solid fa-plus"></i>
                Thêm địa chỉ
              </a>
            </div>

            <div className="p-6 space-y-5">
              <div className="rounded-2xl border border-gray-100 p-5">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-extrabold text-gray-900">Huỳnh Ngọc Tiến</p>
                      <span className="text-gray-300">•</span>
                      <p className="font-semibold text-gray-700 tabular-nums">0902 275 501</p>
                      <span className="ml-0 sm:ml-2 inline-flex items-center rounded-full bg-[#33B1FA]/10 text-[#003366] px-3 py-1 text-xs font-extrabold">
                        Mặc định
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-gray-700 leading-relaxed">
                      123 Đường ABC, Phường Tân Hòa, TP. Hồ Chí Minh
                    </p>
                  </div>

                  <div className="flex items-center gap-2 sm:justify-end">
                    <button
                      aria-label="Chỉnh sửa"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm font-extrabold text-gray-700 hover:bg-gray-50 transition"
                    >
                      <i className="fa-solid fa-pen"></i>
                      Sửa
                    </button>
                    <button
                      aria-label="Xóa"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm font-extrabold text-red-600 hover:bg-red-50 transition"
                    >
                      <i className="fa-solid fa-trash"></i>
                      Xóa
                    </button>
                  </div>
                </div>

                <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <p className="text-xs text-gray-500">
                    <i className="fa-solid fa-circle-info mr-1"></i>
                    Địa chỉ mặc định sẽ được ưu tiên khi đặt hàng.
                  </p>
                  <button
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 text-sm font-extrabold text-gray-400 cursor-not-allowed"
                    disabled
                  >
                    <i className="fa-solid fa-check"></i>
                    Đang mặc định
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-100 p-5">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-extrabold text-gray-900">Lê Thanh Tuấn Tú</p>
                      <span className="text-gray-300">•</span>
                      <p className="font-semibold text-gray-700 tabular-nums">0987 654 321</p>
                    </div>
                    <p className="mt-2 text-sm text-gray-700 leading-relaxed">
                      82 Trần Đại Nghĩa, P. Đồng Tâm, Q. Hai Bà Trưng, Hà Nội
                    </p>
                  </div>

                  <div className="flex items-center gap-2 sm:justify-end">
                    <button
                      aria-label="Chỉnh sửa"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm font-extrabold text-gray-700 hover:bg-gray-50 transition"
                    >
                      <i className="fa-solid fa-pen"></i>
                      Sửa
                    </button>
                    <button
                      aria-label="Xóa"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm font-extrabold text-red-600 hover:bg-red-50 transition"
                    >
                      <i className="fa-solid fa-trash"></i>
                      Xóa
                    </button>
                  </div>
                </div>

                <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <p className="text-xs text-gray-500">
                    <i className="fa-solid fa-shield-heart mr-1"></i>
                    Bạn có thể đặt địa chỉ này làm mặc định.
                  </p>
                  <button className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-[#003366] text-sm font-extrabold text-[#003366] hover:bg-[#003366] hover:text-white transition">
                    <i className="fa-solid fa-star"></i>
                    Đặt làm mặc định
                  </button>
                </div>
              </div>

              <div className="pt-2" id="add-address">
                <details className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
                  <summary className="cursor-pointer select-none p-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-11 h-11 rounded-full bg-[#003366]/10 text-[#003366] flex items-center justify-center">
                        <i className="fa-solid fa-plus"></i>
                      </span>
                      <div>
                        <p className="font-extrabold text-[#003366]">Thêm địa chỉ mới</p>
                        <p className="text-sm text-gray-500">Bấm để mở form nhập địa chỉ.</p>
                      </div>
                    </div>
                    <i className="fa-solid fa-chevron-down text-gray-400"></i>
                  </summary>

                  <div className="p-5 border-t border-gray-100">
                    <form className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="md:col-span-1">
                        <label className="block font-semibold text-gray-700 mb-2">Họ và tên</label>
                        <input
                          className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#003366]/20"
                          placeholder="Ví dụ: Huỳnh Ngọc Tiến"
                          type="text"
                        />
                      </div>

                      <div className="md:col-span-1">
                        <label className="block font-semibold text-gray-700 mb-2">Số điện thoại</label>
                        <input
                          className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#003366]/20"
                          placeholder="Ví dụ: 0902 275 501"
                          type="text"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block font-semibold text-gray-700 mb-2">Địa chỉ</label>
                        <input
                          className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#003366]/20"
                          placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành..."
                          type="text"
                        />
                      </div>

                      <div className="md:col-span-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
                        <label className="inline-flex items-center gap-3 text-gray-700 font-semibold cursor-pointer">
                          <input className="w-4 h-4 accent-[#003366]" type="checkbox" />
                          Đặt làm địa chỉ mặc định
                        </label>

                        <div className="flex items-center gap-3">
                          <button
                            className="px-5 py-3 rounded-xl border border-gray-200 font-extrabold text-gray-700 hover:bg-gray-50 transition"
                            type="reset"
                          >
                            Hủy
                          </button>
                          <button
                            className="px-6 py-3 rounded-xl bg-[#003366] text-white font-extrabold hover:bg-[#002244] transition inline-flex items-center gap-2"
                            type="button"
                          >
                            <i className="fa-solid fa-floppy-disk"></i>
                            Lưu địa chỉ
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>
                </details>
              </div>
            </div>
          </div>
        </AccountShell>
      </section>
    </main>
  );
}
