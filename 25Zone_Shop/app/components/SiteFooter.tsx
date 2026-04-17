export default function SiteFooter() {
  return (
    <footer className="bg-[#002d58] pt-12 md:pt-16 pb-8 text-white text-[13px] border-t border-white/10">
      <div className="mx-auto max-w-[1920px] px-4 sm:px-6 lg:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-10 mb-10 md:mb-12">
          {/* Brand */}
          <div className="flex flex-col items-center text-center sm:items-start sm:text-left lg:items-center lg:text-center">
            <div className="flex flex-col items-center sm:items-start lg:items-center mb-4">
              <div className="mb-2">
                <span className="material-symbols-outlined !text-[64px] leading-none font-light text-[#33B1FA]">
                  content_cut
                </span>
              </div>
              <h2 className="text-2xl font-black tracking-[0.2em] uppercase">
                25ZONE
              </h2>
            </div>
            <p className="text-gray-400 italic text-xs">
              Hệ thống tóc nam hàng đầu
            </p>
          </div>

          {/* About */}
          <div>
            <h3 className="font-bold text-white uppercase mb-5 md:mb-6 text-base tracking-wider">
              Về chúng tôi
            </h3>
            <ul className="space-y-3 text-gray-300">
              <li>
                <a
                  className="hover:text-yellow-400 transition-colors duration-300"
                  href="#"
                >
                  Về 25Zone
                </a>
              </li>
              <li>
                <a
                  className="hover:text-yellow-400 transition-colors duration-300"
                  href="#"
                >
                  25Zone Shop
                </a>
              </li>
              <li>
                <a
                  className="hover:text-yellow-400 transition-colors duration-300"
                  href="#"
                >
                  Học cắt tóc
                </a>
              </li>
              <li>
                <a
                  className="hover:text-yellow-400 transition-colors duration-300"
                  href="#"
                >
                  Tìm 25Zone gần nhất
                </a>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-bold text-white uppercase mb-5 md:mb-6 text-base tracking-wider">
              Hỗ trợ
            </h3>
            <div className="space-y-3 text-gray-300">
              <p className="font-bold">
                Hotline:{" "}
                <span className="hover:text-yellow-400 cursor-pointer transition-colors">
                  1900.27.27.03
                </span>
              </p>
              <p className="hover:text-yellow-400 cursor-pointer transition-colors">
                Liên hệ hợp tác: 090.xxx.xxxx
              </p>
              <p className="hover:text-yellow-400 cursor-pointer transition-colors">
                Liên hệ nhượng quyền
              </p>
            </div>
          </div>

          {/* Policy */}
          <div>
            <h3 className="font-bold text-white uppercase mb-5 md:mb-6 text-base tracking-wider">
              Chính sách
            </h3>
            <ul className="space-y-3 text-gray-300">
              <li>
                <p>Giờ phục vụ: Thứ 2-Chủ Nhật: 8h00 - 21h00</p>
              </li>
              <li>
                <a
                  className="hover:text-yellow-400 transition-colors duration-300"
                  href="#"
                >
                  Chính sách bảo mật
                </a>
              </li>
              <li>
                <a
                  className="hover:text-yellow-400 transition-colors duration-300"
                  href="#"
                >
                  Điều khoản sử dụng
                </a>
              </li>
            </ul>
          </div>

          {/* App */}
          <div>
            <h3 className="font-bold text-white uppercase mb-4 text-base tracking-wider">
              Tải ứng dụng 25ZONE
            </h3>

            {/* Mobile: stack, md+: row */}
            <div className="flex flex-col sm:flex-row gap-3 items-start mb-6">
              <div className="bg-white/10 p-1 rounded-md border border-white/20">
                <div className="bg-white p-1 rounded">
                  <img
                    alt="QR Code"
                    className="w-16 h-16 object-contain"
                    src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=25Zone"
                  />
                </div>
              </div>

              <div className="flex flex-row sm:flex-col gap-2">
                <div className="bg-[#333f51] hover:bg-[#435266] cursor-pointer w-32 h-9 rounded-md transition-colors" />
                <div className="bg-[#333f51] hover:bg-[#435266] cursor-pointer w-32 h-9 rounded-md transition-colors" />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <div className="w-8 h-8 bg-white hover:bg-yellow-400 cursor-pointer transition-colors rounded-md" />
              <div className="w-8 h-8 bg-white hover:bg-yellow-400 cursor-pointer transition-colors rounded-md" />
              <div className="w-8 h-8 bg-white hover:bg-yellow-400 cursor-pointer transition-colors rounded-md" />
              <div className="w-8 h-8 bg-white hover:bg-yellow-400 cursor-pointer transition-colors rounded-md" />
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-white/5 pt-6 md:pt-8 text-center">
          <p className="text-gray-500 text-[13px] leading-relaxed mx-auto max-w-[1100px]">
            © 2015 Công ty Cổ Phần TMDV 30Shine. Địa chỉ: 82 Trần Đại Nghĩa,
            Phường Đồng Tâm, Quận Hai Bà Trưng, HN. Số GCNĐKDN: 0107467693. Ngày
            cấp: 08/06/2016.
          </p>
        </div>
      </div>
    </footer>
  );
}
