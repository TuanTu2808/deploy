import Link from "next/link";
import { AccountShell } from "@/app/components/account/AccountShell";

export default function AccountInfoPage() {
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
          <span className="text-gray-700 font-extrabold">Thông tin cá nhân</span>
        </div>
      </div>

      <section className="max-w-[1604px] mx-auto px-4 py-10">
        <AccountShell active="info">
          <div className="border border-gray-200 rounded-2xl bg-white shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg sm:text-xl font-extrabold text-[#003366]">
                Thông tin cá nhân
              </h3>
              <button className="text-sm font-bold text-[#33B1FA] hover:underline">
                <i className="fa-solid fa-pen-to-square mr-2"></i>Chỉnh sửa
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6 text-sm">
                <div className="rounded-xl border border-gray-100 p-4">
                  <p className="text-gray-500 mb-1">Họ và tên</p>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-900">Lê Thanh Tuấn Tú</span>
                    <button
                      aria-label="Edit name"
                      className="text-[#33B1FA] hover:text-[#003366] transition"
                    >
                      <i className="fa-solid fa-pen"></i>
                    </button>
                  </div>
                </div>

                <div className="rounded-xl border border-gray-100 p-4">
                  <p className="text-gray-500 mb-1">Ngày sinh</p>
                  <span className="font-bold text-gray-900">01/01/1990</span>
                </div>

                <div className="rounded-xl border border-gray-100 p-4">
                  <p className="text-gray-500 mb-1">Số điện thoại</p>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-900">0902 275 501</span>
                    <button
                      aria-label="Edit phone"
                      className="text-[#33B1FA] hover:text-[#003366] transition"
                    >
                      <i className="fa-solid fa-pen"></i>
                    </button>
                  </div>
                </div>

                <div className="rounded-xl border border-gray-100 p-4">
                  <p className="text-gray-500 mb-1">Email</p>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-900">tuantu@gmail.com</span>
                    <button
                      aria-label="Edit email"
                      className="text-[#33B1FA] hover:text-[#003366] transition"
                    >
                      <i className="fa-solid fa-pen"></i>
                    </button>
                  </div>
                </div>

                <div className="rounded-xl border border-gray-100 p-4">
                  <p className="text-gray-500 mb-1">Giới tính</p>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-900">Nam</span>
                    <button
                      aria-label="Edit gender"
                      className="text-[#33B1FA] hover:text-[#003366] transition"
                    >
                      <i className="fa-solid fa-pen"></i>
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </AccountShell>
      </section>
    </main>
  );
}
