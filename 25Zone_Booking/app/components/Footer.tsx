export default function Footer() {
  return (
    <footer className="bg-[#002d58] pt-12 pb-8 text-[13px] text-white border-t border-white/10 md:pt-16">
      <div className="mx-auto max-w-[1920px] px-4 sm:px-6 lg:px-6">
        <div className="mb-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-5 lg:gap-10 md:mb-12">
          <div className="flex flex-col items-center text-center sm:items-start sm:text-left lg:items-center lg:text-center">
            <div className="mb-4 flex flex-col items-center sm:items-start lg:items-center">
              <div className="mb-2">
                <span className="material-symbols-outlined !text-[64px] leading-none font-light text-primary">
                  content_cut
                </span>
              </div>
              <h2 className="text-2xl font-black uppercase tracking-[0.2em]">25ZONE</h2>
            </div>
            <p className="text-xs italic text-gray-400">Hệ thống tóc nam hàng đầu</p>
          </div>

          <div>
            <h3 className="mb-5 text-base font-bold uppercase tracking-wider text-white md:mb-6">
              Về chúng tôi
            </h3>
            <ul className="space-y-3 text-gray-300">
              <li>
                <a className="transition-colors duration-300 hover:text-yellow-400" href="#">
                  Về 25Zone
                </a>
              </li>
              <li>
                <a className="transition-colors duration-300 hover:text-yellow-400" href="#">
                  25Zone Shop
                </a>
              </li>
              <li>
                <a className="transition-colors duration-300 hover:text-yellow-400" href="#">
                  Học cắt tóc
                </a>
              </li>
              <li>
                <a className="transition-colors duration-300 hover:text-yellow-400" href="#">
                  Tìm 25Zone gần nhất
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-5 text-base font-bold uppercase tracking-wider text-white md:mb-6">
              Hỗ trợ
            </h3>
            <div className="space-y-3 text-gray-300">
              <p className="font-bold">
                Hotline:{" "}
                <span className="cursor-pointer transition-colors hover:text-yellow-400">
                  1900.27.27.03
                </span>
              </p>
              <p className="cursor-pointer transition-colors hover:text-yellow-400">
                Liên hệ hợp tác: 090.xxx.xxxx
              </p>
              <p className="cursor-pointer transition-colors hover:text-yellow-400">
                Liên hệ nhượng quyền
              </p>
            </div>
          </div>

          <div>
            <h3 className="mb-5 text-base font-bold uppercase tracking-wider text-white md:mb-6">
              Chính sách
            </h3>
            <ul className="space-y-3 text-gray-300">
              <li>
                <p>Giờ phục vụ: Thứ 2-Chủ Nhật: 8h00 - 21h00</p>
              </li>
              <li>
                <a className="transition-colors duration-300 hover:text-yellow-400" href="#">
                  Chính sách bảo mật
                </a>
              </li>
              <li>
                <a className="transition-colors duration-300 hover:text-yellow-400" href="#">
                  Điều khoản sử dụng
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-base font-bold uppercase tracking-wider text-white">
              Tải ứng dụng 25ZONE
            </h3>

            <div className="mb-6 flex flex-col items-start gap-3 sm:flex-row">
              <div className="rounded-md border border-white/20 bg-white/10 p-1">
                <div className="rounded bg-white p-1">
                  <img
                    alt="QR Code"
                    className="h-16 w-16 object-contain"
                    src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=25Zone"
                  />
                </div>
              </div>

              <div className="flex flex-row gap-2 sm:flex-col">
                <div className="h-9 w-32 cursor-pointer rounded-md bg-[#333f51] transition-colors hover:bg-[#435266]" />
                <div className="h-9 w-32 cursor-pointer rounded-md bg-[#333f51] transition-colors hover:bg-[#435266]" />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <div className="h-8 w-8 cursor-pointer rounded-md bg-white transition-colors hover:bg-yellow-400" />
              <div className="h-8 w-8 cursor-pointer rounded-md bg-white transition-colors hover:bg-yellow-400" />
              <div className="h-8 w-8 cursor-pointer rounded-md bg-white transition-colors hover:bg-yellow-400" />
              <div className="h-8 w-8 cursor-pointer rounded-md bg-white transition-colors hover:bg-yellow-400" />
            </div>
          </div>
        </div>

        <div className="border-t border-white/5 pt-6 text-center md:pt-8">
          <p className="mx-auto max-w-[1100px] text-[13px] leading-relaxed text-gray-500">
            © 2015 Công ty Cổ Phần TMDV 30Shine. Địa chỉ: 82 Trần Đại Nghĩa, Phường Đồng Tâm,
            Quận Hai Bà Trưng, HN. Số GCNĐKDN: 0107467693. Ngày cấp: 08/06/2016.
          </p>
        </div>
      </div>
    </footer>
  );
}
