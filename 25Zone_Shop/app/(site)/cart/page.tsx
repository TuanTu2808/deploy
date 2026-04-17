export default function CartPage() {
  return (
    <main>
      <div className="max-w-[1604px] mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8">
        <p className="text-sm text-gray-500 mb-6">
          Trang chủ / <span className="text-black">Giỏ hàng</span>
        </p>

        <h1 className="text-2xl font-bold mb-6">Giỏ hàng</h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* LEFT - Cart list */}
          <div className="lg:col-span-8">
            {/* ===== Desktop header row ===== */}
            <div className="hidden lg:grid grid-cols-[2.6fr_0.8fr_0.9fr_1fr_1fr_44px] gap-4 text-sm font-semibold border-b pb-3 text-gray-600">
              <span>Sản phẩm</span>
              <span className="text-center">Dung tích</span>
              <span className="text-right">Giá</span>
              <span className="text-center">Số lượng</span>
              <span className="text-right">Tổng tiền</span>
              <span></span>
            </div>

            {/* ===== Desktop rows ===== */}
            {Array.from({ length: 3 }).map((_, idx) => (
              <div
                key={`row-desktop-${idx}`}
                className="hidden lg:grid grid-cols-[2.6fr_0.8fr_0.9fr_1fr_1fr_44px] gap-4 items-center py-5 border-b text-sm"
              >
                <div className="flex items-center gap-4">
                  <img
                    className="w-20 h-20 border rounded object-cover"
                    src="/img/image%2077.png"
                    alt="Sản phẩm"
                  />
                  <div className="min-w-0">
                    <p className="font-medium leading-snug line-clamp-2">
                      Sữa Rửa Mặt Tràm Trà
                      <br />
                      Dr.FORSKIN Tea tree
                    </p>
                  </div>
                </div>

                <span className="text-center font-medium">120ml</span>

                <span className="text-right font-medium tabular-nums">
                  199.000đ
                </span>

                <div className="flex justify-center">
                  <input
                    className="w-16 h-9 border rounded text-center tabular-nums focus:outline-none focus:ring-2 focus:ring-[#003366]/20"
                    min={1}
                    type="number"
                    defaultValue={1}
                  />
                </div>

                <span className="text-right font-semibold tabular-nums">
                  199.000đ
                </span>

                <button
                  type="button"
                  className="text-red-500 text-2xl font-bold flex justify-center hover:opacity-80 transition"
                  aria-label="Xóa sản phẩm"
                >
                  ×
                </button>
              </div>
            ))}

            {/* ===== Mobile/Tablet cards (<lg) ===== */}
            <div className="lg:hidden space-y-4">
              {Array.from({ length: 3 }).map((_, idx) => (
                <div
                  key={`row-mobile-${idx}`}
                  className="border border-gray-200 rounded-2xl bg-white p-4 shadow-sm relative"
                >
                  <button
                    type="button"
                    className="absolute right-3 top-3 text-red-500 text-2xl font-bold hover:opacity-80 transition"
                    aria-label="Xóa sản phẩm"
                  >
                    ×
                  </button>

                  <div className="flex gap-4">
                    <img
                      className="w-20 h-20 border rounded object-cover flex-shrink-0"
                      src="/img/image%2077.png"
                      alt="Sản phẩm"
                    />

                    <div className="min-w-0 pr-8">
                      <p className="font-semibold leading-snug text-gray-900 line-clamp-2">
                        Sữa Rửa Mặt Tràm Trà Dr.FORSKIN Tea tree
                      </p>
                      <p className="text-sm text-gray-600 mt-1">120ml</p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-xl border border-gray-200 p-3">
                      <p className="text-xs text-gray-500 font-semibold">
                        Giá
                      </p>
                      <p className="mt-1 font-semibold tabular-nums">
                        199.000đ
                      </p>
                    </div>

                    <div className="rounded-xl border border-gray-200 p-3">
                      <p className="text-xs text-gray-500 font-semibold">
                        Tổng tiền
                      </p>
                      <p className="mt-1 font-extrabold tabular-nums text-gray-900">
                        199.000đ
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between rounded-xl border border-gray-200 p-3">
                    <span className="text-sm font-semibold text-gray-700">
                      Số lượng
                    </span>
                    <input
                      className="w-20 h-9 border rounded text-center tabular-nums focus:outline-none focus:ring-2 focus:ring-[#003366]/20"
                      min={1}
                      type="number"
                      defaultValue={1}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT - Summary */}
          <div className="lg:col-span-4">
            <div className="border border-gray-200 rounded-xl p-6 bg-white lg:sticky lg:top-24">
              <h2 className="font-semibold mb-4">Chi tiết đơn hàng</h2>

              <div className="flex justify-between text-sm mb-2 text-gray-700">
                <span>3 sản phẩm</span>
              </div>

              <div className="flex justify-between text-sm mb-2 text-gray-700">
                <span>Tổng đơn hàng</span>
                <span className="tabular-nums">597.000đ</span>
              </div>

              <div className="flex justify-between text-sm mb-2 text-gray-700">
                <span>Mã giảm giá</span>
                <span className="text-red-500 tabular-nums">-100.000đ</span>
              </div>

              <div className="flex justify-between text-sm mb-4 text-gray-700">
                <span>Phí giao hàng</span>
                <span className="text-green-600">Miễn phí</span>
              </div>

              <hr className="mb-4" />

              <div className="flex justify-between font-semibold mb-6 text-gray-900">
                <span>Tổng thanh toán</span>
                <span className="tabular-nums">497.000đ</span>
              </div>

              <button
                type="button"
                className="w-full bg-[#003366] text-white py-3 rounded-lg font-semibold hover:bg-[#002244] transition"
              >
                Đặt Hàng
              </button>
            </div>
          </div>
        </div>

        {/* Voucher */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-3 max-w-[760px]">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-600 text-white flex items-center justify-center rounded">
                %
              </div>
              <span className="font-semibold text-[#003366]">
                25ZONE Voucher
              </span>
            </div>
            <a className="text-blue-600 text-sm hover:underline" href="#">
              Chọn mã giảm giá
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-[760px]">
            {Array.from({ length: 3 }).map((_, i) => (
              <label
                key={`voucher-${i}`}
                className="flex items-center gap-3 border rounded-lg p-3 cursor-pointer hover:border-blue-500 transition bg-white"
              >
                <input className="accent-blue-600" name="voucher" type="radio" />
                <div className="min-w-0">
                  <p className="font-bold text-blue-600">SAVE $10</p>
                  <p className="text-xs text-gray-500">On your next order</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Suggested products */}
        <div className="mt-10">
          <h3 className="text-xl font-extrabold uppercase">GỢI Ý SẢN PHẨM</h3>

          {/* Mobile 2 box / Desktop 4 box */}
          <div className="mt-6 sm:mt-8 grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 lg:gap-10">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={`suggest-${i}`}
                className="group bg-white rounded-[26px] sm:rounded-[34px] shadow-2xl overflow-hidden flex flex-col"
              >
                <div className="relative overflow-hidden rounded-t-[26px] sm:rounded-t-[34px]">
                  <div className="aspect-[4/4]">
                    <img
                      alt="Sáp Zone Clay"
                      className="w-full h-full object-cover"
                      src="/img/image%2077.png"
                    />
                  </div>
                </div>

                <div className="bg-white rounded-t-[26px] sm:rounded-t-[34px] -mt-6 sm:-mt-8 px-4 sm:px-8 pt-5 sm:pt-8 pb-5 sm:pb-7 relative flex-1 flex flex-col">
                  <h3 className="text-[18px] sm:text-[28px] lg:text-[34px] leading-none font-extrabold text-[#003366] uppercase">
                    SÁP ZONE CLAY
                  </h3>
                  <p className="mt-3 sm:mt-4 text-[#003366] font-semibold text-sm sm:text-base">
                    Sáp vuốt tóc
                  </p>

                  <div className="h-[4px] sm:h-[5px] w-12 sm:w-16 bg-[#003366] mt-2"></div>

                  <div className="h-px bg-gray-300 mt-4 sm:mt-6"></div>

                  <p className="mt-3 sm:mt-4 text-[11px] sm:text-xs text-gray-400 uppercase tracking-wider font-bold">
                    GIÁ SẢN PHẨM
                  </p>

                  <div className="mt-2 flex items-center mb-4">
                    <span className="text-[#8b1e1e] font-extrabold text-[26px] sm:text-[40px] lg:text-[48px] leading-none tabular-nums">
                      350K
                    </span>

                    <button
                      aria-label="Yêu thích"
                      type="button"
                      className="ml-auto w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#003366] text-white flex items-center justify-center hover:bg-[#00264d] transition"
                    >
                      <i className="fa-solid fa-heart text-base sm:text-lg"></i>
                    </button>
                  </div>

                  <button
                    type="button"
                    className="mt-4 sm:mt-auto w-full py-3 sm:py-4 rounded-2xl bg-[#003366] text-white font-extrabold tracking-wide hover:bg-[#00264d] transition"
                  >
                    MUA NGAY
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
