export default function CheckoutPage() {
  return (
    <main>
      <div className="max-w-[1604px] mx-auto px-4 sm:px-6 lg:px-10 py-8 sm:py-10">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <a className="hover:text-[#003366] font-semibold transition" href="/">Trang chủ</a>
          <i className="fa-solid fa-chevron-right text-[11px] text-gray-300"></i>
          <span className="text-gray-700 font-extrabold">Thanh toán</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold mb-6 sm:mb-8 text-[#003366]">
          Thanh Toán
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* LEFT */}
          <div className="lg:col-span-2 space-y-6">
            {/* Thông tin người nhận */}
            <div className="border border-gray-200 rounded-2xl p-5 sm:p-6 bg-white shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-semibold text-lg text-[#003366]">
                  Thông tin người nhận
                </h2>
                <button
                  className="text-sm font-semibold text-blue-600 hover:underline"
                  type="button"
                >
                  Thay đổi
                </button>
              </div>

              <div className="flex items-start gap-4 mb-5">
                <div className="w-11 h-11 flex items-center justify-center rounded-full bg-[#003366]/10 text-[#003366] flex-shrink-0">
                  <i className="fa-solid fa-user"></i>
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900">Huỳnh Ngọc Tiến</p>
                  <p className="text-sm text-gray-600">0902 275 501</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-11 h-11 flex items-center justify-center rounded-full bg-[#003366]/10 text-[#003366] flex-shrink-0">
                  <i className="fa-solid fa-location-dot"></i>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">
                  123 Đường ABC, Phường Tân Hòa, TP. Hồ Chí Minh
                </p>
              </div>
            </div>

            {/* Phương thức thanh toán */}
            <div className="border border-gray-200 rounded-2xl p-5 sm:p-6 bg-white shadow-sm">
              <h2 className="font-semibold text-lg text-[#003366] mb-5">
                Phương thức thanh toán
              </h2>

              {/* Bank transfer */}
              <label className="cursor-pointer">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-4 border-b">
                  <div className="flex items-center gap-3">
                    <input
                      className="w-4 h-4 accent-[#003366]"
                      name="payment"
                      type="radio"
                    />
                    <div className="flex items-center gap-2">
                      <span className="w-9 h-9 rounded-full bg-[#003366]/10 text-[#003366] flex items-center justify-center flex-shrink-0">
                        <i className="fa-solid fa-building-columns"></i>
                      </span>
                      <span className="font-medium text-gray-900">
                        Chuyển khoản ngân hàng
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 items-center sm:justify-end">
                    <img
                      className="h-9 w-auto rounded"
                      src="/img/momo.jpg"
                      alt="MoMo"
                    />
                    <img
                      className="h-9 w-auto rounded"
                      src="/img/vnpay.png"
                      alt="VNPAY"
                    />
                  </div>
                </div>
              </label>

              {/* COD */}
              <label className="cursor-pointer">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 py-4">
                  <div className="flex items-center gap-3">
                    <input
                      className="w-4 h-4 accent-[#003366]"
                      name="payment"
                      type="radio"
                    />
                    <div className="flex items-center gap-2">
                      <span className="w-9 h-9 rounded-full bg-[#003366]/10 text-[#003366] flex items-center justify-center flex-shrink-0">
                        <i className="fa-solid fa-truck-fast"></i>
                      </span>
                      <span className="font-medium text-gray-900">
                        Thanh toán khi nhận hàng (COD)
                      </span>
                    </div>
                  </div>

                  <span className="text-xs text-gray-500 hidden sm:inline">
                    Thanh toán tiền mặt khi nhận hàng
                  </span>
                </div>
              </label>
            </div>

            {/* Ghi chú */}
            <div className="border border-gray-200 rounded-2xl p-5 sm:p-6 bg-white shadow-sm">
              <h2 className="font-semibold text-lg text-[#003366] mb-4">
                Ghi chú đơn hàng
              </h2>
              <textarea
                className="w-full border border-gray-200 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]/20"
                placeholder="Ví dụ: Giao giờ hành chính, gọi trước khi giao..."
                rows={3}
              />
            </div>
          </div>

          {/* RIGHT - Order Summary */}
          <div className="border border-gray-200 rounded-2xl p-5 sm:p-6 bg-white shadow-sm h-fit lg:sticky lg:top-24">
            <h2 className="font-semibold text-lg text-[#003366] mb-4">
              Đơn hàng của bạn
            </h2>

            {/* Item */}
            <div className="flex flex-col sm:flex-row gap-4 pb-4 border-b border-gray-200">
              <div className="flex gap-4">
                <img
                  className="w-20 h-20 object-cover border border-gray-200 rounded-xl flex-shrink-0"
                  src="/img/image%2077.png"
                  alt="Sản phẩm"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold leading-snug text-gray-900 line-clamp-2">
                    Sữa Rửa Mặt Tràm Trà<br />
                    Dr.FORSKIN Tea tree
                  </p>
                  <p className="text-sm text-gray-600 mt-1">120ml x 3</p>
                </div>
              </div>

              <span className="font-semibold text-gray-900 tabular-nums sm:ml-auto sm:self-start">
                597.000đ
              </span>
            </div>

            {/* Totals */}
            <div className="space-y-3 py-4 text-sm text-gray-700">
              <div className="flex justify-between">
                <span className="flex items-center gap-2">
                  <i className="fa-solid fa-receipt text-gray-400"></i>
                  Tạm tính
                </span>
                <span className="tabular-nums">597.000đ</span>
              </div>

              <div className="flex justify-between">
                <span className="flex items-center gap-2">
                  <i className="fa-solid fa-truck text-gray-400"></i>
                  Phí giao hàng
                </span>
                <span className="text-green-600 font-semibold">Miễn phí</span>
              </div>

              <div className="flex justify-between">
                <span className="flex items-center gap-2">
                  <i className="fa-solid fa-ticket text-gray-400"></i>
                  Mã giảm giá
                </span>
                <span className="text-red-500 font-semibold tabular-nums">
                  -100.000đ
                </span>
              </div>
            </div>

            <div className="flex justify-between font-extrabold text-lg border-t border-gray-200 pt-4 text-gray-900">
              <span>Tổng thanh toán</span>
              <span className="tabular-nums">497.000đ</span>
            </div>

            <button
              className="w-full mt-6 bg-[#003366] hover:bg-[#002244] text-white py-3 rounded-full font-semibold transition flex items-center justify-center gap-2"
              type="button"
            >
              <i className="fa-solid fa-bag-shopping"></i>
              Đặt Hàng
            </button>

            <p className="mt-4 text-xs text-gray-500 leading-relaxed">
              Bằng việc nhấn “Đặt Hàng”, bạn đồng ý với{" "}
              <span className="text-blue-600">Điều khoản</span> và{" "}
              <span className="text-blue-600">Chính sách</span> của 25ZONE.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
