"use client";

import { useEffect, useState } from "react";

function FlashSaleCard() {
  return (
    <div className="bg-white rounded-3xl p-4 shadow-lg text-center relative">
      <span className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
        -20%
      </span>

      <div className="rounded-2xl overflow-hidden border-4 border-gray-100 mb-4">
        <img className="w-full h-auto object-cover" src="/img/image%2077.png" alt="" />
      </div>

      <h3 className="text-sm font-semibold text-[#003366] leading-snug text-left">
        Xịt tạo kiểu Glanzen <br />
        X2 Booster
      </h3>

      <div className="text-left mt-2">
        <p className="line-through text-gray-400 text-sm">345.000đ</p>
        <p className="text-red-600 font-extrabold text-lg">276.000đ</p>
      </div>

      <button className="absolute bottom-3 right-3 w-9 h-9 rounded-full bg-[#003366] text-white flex items-center justify-center">
        <i className="fa-solid fa-cart-shopping text-sm"></i>
      </button>
    </div>
  );
}

function ProductCard() {
  return (
    <div className="bg-white rounded-[32px] overflow-hidden shadow-2xl max-w-[320px] w-full">
      <div className="relative flex items-center justify-center overflow-hidden">
        <img
          alt="Sáp Zone Clay"
          className="w-full mx-auto mb-4 object-contain scale-91 -translate-y-2 transition-transform duration-300"
          src="/img/image%2077.png"
        />
      </div>

      {/* mobile đẹp hơn: -mt nhẹ + p nhỏ hơn */}
      <div className="bg-white rounded-t-[32px] -mt-8 sm:-mt-10 p-4 sm:p-6 relative z-10">
        <h3 className="text-[18px] sm:text-[22px] font-extrabold text-[#003366] uppercase">
          SÁP ZONE CLAY
        </h3>
        <p className="text-sm text-[#003366] mt-1">Sáp vuốt tóc</p>

        <div className="h-[3px] w-12 bg-[#003366] mt-2 mb-4"></div>

        <div className="h-px bg-gray-300 mb-3"></div>
        <p className="text-xs text-gray-400 uppercase">Giá sản phẩm</p>

        <div className="flex items-center mt-2">
          <span className="text-[#8b1e1e] font-extrabold text-3xl sm:text-4xl">350K</span>

          <button className="ml-auto w-9 h-9 rounded-full bg-[#003366] text-white flex items-center justify-center hover:bg-[#00264d] transition">
            <i className="fa-solid fa-heart text-sm"></i>
          </button>
        </div>

        <button className="w-full mt-4 sm:mt-5 py-3 sm:py-4 rounded-2xl bg-[#003366] text-white font-bold tracking-wide hover:bg-[#00264d] transition">
          MUA NGAY
        </button>
      </div>
    </div>
  );
}

export default function HomePage() {
  const slides = ["/img/banner1.jpg", "/img/banner%20shop.png", "/img/banner3.jpg"];
  const [index, setIndex] = useState(0);

  // Countdown timer state
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const t = setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, 1500);
    return () => clearInterval(t);
  }, [slides.length]);

  // Countdown timer effect
  useEffect(() => {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 2); // Set to 2 days from now

    const interval = setInterval(() => {
      const now = new Date();
      const difference = targetDate.getTime() - now.getTime();

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        setTimeLeft({ days, hours, minutes, seconds });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <main>
      {/* ===== Slider ===== */}
      <section className="py-5">
        <div className="relative w-[90%] max-w-[1920px] mx-auto overflow-hidden rounded-xl">
          <div
            className="flex transition-transform duration-700 ease-in-out"
            style={{ transform: `translateX(-${index * 100}%)` }}
          >
            {slides.map((src) => (
              <img key={src} src={src} className="w-full flex-shrink-0" alt="banner" />
            ))}
          </div>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIndex(i)}
                className={"w-3 h-3 rounded-full transition " + (i === index ? "bg-[#868282]" : "bg-white/50")}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ===== Flash Sale ===== */}
      <section className="w-full bg-[linear-gradient(90deg,#5FC3F4_0%,#A9DFF7_35%,#EAF8FB_65%)]">
        <div className="max-w-[1400px] mx-auto flex flex-col lg:flex-row items-center gap-6 lg:gap-8 px-4 sm:px-6 lg:px-10 relative">
          <div className="w-full lg:w-[40%] relative right-0 lg:right-20">
            <div className="rounded-3xl overflow-hidden relative">
              <img className="w-90 w-full object-cover scale-105" src="/img/Rectangle%2024827.png" alt="" />

              <div className="absolute bottom-4 left-4 bg-black/70 text-white px-4 py-2 rounded-lg text-sm font-bold italic">
                LIMITED TIME OFFER! <br />
                <span className="text-cyan-300">Jan 27 ONLY!</span>
              </div>
            </div>
          </div>

          <div className="w-full lg:w-[60%]">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
              <div className="flex items-center gap-4 bg-[#003366] text-white px-8 py-4 rounded-2xl skew-x-[-10deg] w-fit">
                <i className="fa-solid fa-bolt text-yellow-400 text-6xl"></i>
                <h1 className="text-4xl font-extrabold tracking-widest skew-x-[10deg] italic">FLASH SALE</h1>
              </div>

              <div className="flex gap-3 text-[#003366] font-bold text-lg">
                <span>{timeLeft.days.toString().padStart(2, '0')}</span> :
                <span>{timeLeft.hours.toString().padStart(2, '0')}</span> :
                <span>{timeLeft.minutes.toString().padStart(2, '0')}</span> :
                <span>{timeLeft.seconds.toString().padStart(2, '0')}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 pt-2 relative">
              <FlashSaleCard />
              <FlashSaleCard />
              <FlashSaleCard />
              <FlashSaleCard />
            </div>

            <div className="flex justify-center mt-8 sm:mt-10">
              <button className="bg-white flex items-center gap-3 px-8 sm:px-10 py-4 border-2 border-[#003366] rounded-full font-bold text-[#003366] hover:bg-[#003366] hover:text-white transition">
                XEM THÊM SẢN PHẨM
                <i className="fa-solid fa-arrow-right"></i>
              </button>
            </div>
          </div>

          <button className="hidden lg:flex absolute left-[38%] top-1/2 -translate-y-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-white shadow items-center justify-center text-[#003366]">
            <i className="fa-solid fa-chevron-left"></i>
          </button>

          <button className="hidden lg:flex absolute -right-10 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white shadow items-center justify-center text-[#003366]">
            <i className="fa-solid fa-chevron-right"></i>
          </button>
        </div>
      </section>

      {/* ===== Best Seller ===== */}
      <section className="w-full mt-5 bg-gradient-to-b from-[#5fb7de] via-[#3a78b8] to-[#1f2f6b] py-12 sm:py-16 lg:py-20">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10">
          <h2 className="text-white text-3xl font-extrabold uppercase mb-8 sm:mb-12">
            SẢN PHẨM BÁN CHẠY
          </h2>

          {/* ✅ mobile 2 box/row + gap nhỏ lại cho đẹp */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-8 justify-items-center">
            <ProductCard />
            <ProductCard />
            <ProductCard />
            <ProductCard />
          </div>

          <div className="flex justify-center mt-10 sm:mt-16">
            <button className="flex items-center gap-3 px-10 sm:px-12 py-4 rounded-full bg-white text-[#003366] font-bold hover:bg-gray-100 transition">
              XEM THÊM SẢN PHẨM
              <i className="fa-solid fa-arrow-right"></i>
            </button>
          </div>
        </div>
      </section>

      {/* ===== SÁP VUỐT TÓC ===== */}
      <section className="mt-5 bg-[#eef7fb] py-12 sm:py-16">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-10 sm:mb-12">
            <div>
              <h2 className="text-4xl font-extrabold text-[#0b3a66] uppercase">SÁP VUỐT TÓC</h2>
              <div className="w-16 h-1 bg-[#1aa3a3] mt-3"></div>
            </div>

            {/* ✅ Desktop mới hiện nút ở header */}
            <button className="hidden md:flex items-center gap-3 px-8 py-4 rounded-full bg-[#0b3a66] text-white font-bold hover:bg-[#092d50] transition w-fit">
              XEM THÊM SẢN PHẨM <i className="fa-solid fa-arrow-right"></i>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-8 justify-items-center">
            <ProductCard />
            <ProductCard />
            <ProductCard />
            <ProductCard />
          </div>

          {/* ✅ Mobile: nút nằm dưới grid */}
          <div className="md:hidden flex justify-center mt-10">
            <button className="flex items-center gap-3 px-8 py-4 rounded-full bg-[#0b3a66] text-white font-bold hover:bg-[#092d50] transition w-fit">
              XEM THÊM SẢN PHẨM <i className="fa-solid fa-arrow-right"></i>
            </button>
          </div>
        </div>
      </section>

      {/* ===== Dầu gội nam ===== */}
      <section className="mt-5 bg-[#eef7fb] py-12 sm:py-16">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-10 sm:mb-12">
            <div>
              <h2 className="text-4xl font-extrabold text-[#0b3a66] uppercase">Dầu gội nam</h2>
              <div className="w-16 h-1 bg-[#1aa3a3] mt-3"></div>
            </div>

            {/* ✅ Desktop mới hiện nút ở header */}
            <button className="hidden md:flex items-center gap-3 px-8 py-4 rounded-full bg-[#0b3a66] text-white font-bold hover:bg-[#092d50] transition w-fit">
              XEM THÊM SẢN PHẨM <i className="fa-solid fa-arrow-right"></i>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-8 justify-items-center">
            <ProductCard />
            <ProductCard />
            <ProductCard />
            <ProductCard />
          </div>

          {/* ✅ Mobile: nút nằm dưới grid */}
          <div className="md:hidden flex justify-center mt-10">
            <button className="flex items-center gap-3 px-8 py-4 rounded-full bg-[#0b3a66] text-white font-bold hover:bg-[#092d50] transition w-fit">
              XEM THÊM SẢN PHẨM <i className="fa-solid fa-arrow-right"></i>
            </button>
          </div>
        </div>
      </section>

      {/* ===== Tin tức ===== */}
      <section className="mt-5 bg-[#eef7fb] py-12 sm:py-16 lg:py-20">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="mb-10 sm:mb-12">
            <h2 className="text-4xl font-extrabold text-[#003366] uppercase">TIN TỨC 25ZONE</h2>
            <div className="w-16 h-1 bg-teal-400 mt-3"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-10">
            <div className="col-span-1 bg-white rounded-3xl overflow-hidden shadow-2xl">
              <div className="relative">
                <span className="absolute top-4 left-4 bg-[#003366] text-white text-xs font-bold px-4 py-1 rounded-full">
                  CÂU CHUYỆN 25ZONE
                </span>
                <img alt="" className="w-full h-[260px] object-cover" src="/img/news-1.jpg" />
              </div>
              <div className="p-6 sm:p-8">
                <h3 className="text-2xl font-extrabold text-[#003366] leading-snug">
                  "Hơn cả cắt tóc, đó là sự quan tâm tận tâm từ những người bạn."
                </h3>
                <p className="text-gray-600 mt-4 leading-relaxed">
                  Mỗi nụ cười của khách hàng là động lực để đội ngũ stylist 25Zone
                  không ngừng nỗ lực. Chúng tôi tin rằng, một kiểu tóc đẹp bắt đầu
                  từ sự lắng nghe và thấu hiểu những mong muốn nhỏ nhất.
                </p>
                <a className="inline-flex items-center gap-2 mt-6 font-bold text-[#003366]" href="#">
                  ĐỌC CHI TIẾT
                  <i className="fa-solid fa-arrow-right text-sm"></i>
                </a>
              </div>
            </div>

            <div className="bg-white rounded-3xl overflow-hidden shadow-xl">
              <img alt="" className="w-full h-[200px] object-cover" src="/img/news-2.jpg" />
              <div className="p-6">
                <h3 className="text-lg font-extrabold text-[#003366] leading-snug">
                  Niềm vui của bé khi lần đầu đến Salon
                </h3>
                <p className="text-gray-600 text-sm mt-3 leading-relaxed">
                  Các stylist kiên nhẫn và uy tín đã biến buổi cắt tóc thành trò
                  chơi đầy thú vị.
                </p>
                <a className="inline-flex items-center gap-2 mt-5 font-bold text-[#003366] text-sm" href="#">
                  XEM THÊM
                  <i className="fa-solid fa-arrow-right text-xs"></i>
                </a>
              </div>
            </div>

            <div className="bg-white rounded-3xl overflow-hidden shadow-xl">
              <img alt="" className="w-full h-[200px] object-cover" src="/img/news-3.jpg" />
              <div className="p-6">
                <h3 className="text-lg font-extrabold text-[#003366] leading-snug">
                  Stylist Tuấn Anh: "Khách hàng như người thân"
                </h3>
                <p className="text-gray-600 text-sm mt-3 leading-relaxed">
                  Chia sẻ về hành trình 5 năm gắn bó và những kỷ niệm khó quên với
                  khách hàng.
                </p>
                <a className="inline-flex items-center gap-2 mt-5 font-bold text-[#003366] text-sm" href="#">
                  XEM THÊM
                  <i className="fa-solid fa-arrow-right text-xs"></i>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
