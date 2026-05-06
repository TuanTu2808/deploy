"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import HeroSlider from "./HeroSlider";
import NewsSmileSection from "./NewsSmileSection";
import HomeServiceShowcase from "./HomeServiceShowcase";
import TopStylists from "./TopStylists";
import { loadToken, saveAuth, loadUser } from "@/lib/auth-storage";

type ProvinceSummaryResponse = {
  province: string;
  total: number;
  city_param: string;
  normalized_province: string;
};

type CityImageConfig = {
  matchers: string[];
  image: string;
};

type QuickPromoSlide = {
  id: string;
  badge: string;
  title: string;
  highlight: string;
  description: string;
  image: string;
  href: string;
};

const CITY_IMAGE_CONFIGS: CityImageConfig[] = [
  {
    matchers: ["ha noi", "hanoi", "hn"],
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCihmAkaqar5NohimQpMrk4RGSjtn4UyQA6MZQjlB-0TX64oT8JkZBHrkY3r1rj4uM66a3NNKSc6tveQUfs2GMkJpuhBu9Py9hDAl0SVKVqxao1VO7-1aKZjchN1s2c3IiYGs0tuMxXRTxIEgsmlEoe5kBpoVRd1rJO9zNwCQ8PajTbCps01-XyZiV1knVDK0Mh35Z5ylLzip0lVQtdeNeevJuGJnbct-Ey9rXmRUC2JBdaneBzSBlKHHpQvNt99SJDWtMDT_HMDz8",
  },
  {
    matchers: ["tp hcm", "ho chi minh", "hcm", "sai gon"],
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDFkBB1iLczuTU_5hQTtipgBxXQWYRAC58ehaCnBf1IMGG3GyOGCk3NZzDjHXJ3kcIELk70NRqyDE1yU-BvboqGsUVWW1UlRdxy3TE53xTggANkXtZtVQ74FNFvOcpAfgZav5U9yvGE9t8iqSu19Ml_0ymc_3DT2Fx4z8Y2GCZYrWS7vYK56MENa9czItbpbMer4fb6y5_EUnrrIRA93UpEPjxEm8fjwjvXQ307fgFAE_Kny--TlcLIdAil6rbEOpikNIP2VDKz6Lw",
  },
  {
    matchers: ["da nang", "danang", "dn"],
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAf8YDAQXtNy07Jp2TgqrhARCZqsZsxQUW6t-S5XiInsbrtQG2kNAnH3baFt4t7Dl6pW3zrcLs3cmFj58txbuQESif09-B8cst55yKY7tH0xvBU17swD0qUppLGEzhW-CS2O_LqmK4N0ZMi7tozLTZNUvDC--_MoaZ7VEJDCFlkEmeOP_v6zRMT2nN_uDfLuvvJbtkmLBTXk177wk6r1-UP1wfBYbcq8bn4DTYYID0FDHrVxgLJ4vkfVzDHTgr_YF04WPCem4UJYac",
  },
];

const QUICK_PROMO_SLIDES: QuickPromoSlide[] = [
  {
    id: "combo-hot",
    badge: "Ưu đãi tóc",
    title: "COMBO TÓC",
    highlight: "NỔI BẬT",
    description: "Cắt, gội, tạo kiểu chuẩn salon với mức giá dễ chốt lịch.",
    image: "/Immersive Salon Experience.png",
    href: "/combo",
  },
  {
    id: "relax-care",
    badge: "Thư giãn",
    title: "THƯ GIÃN",
    highlight: "ÊM CHUẨN SALON",
    description: "Một khung giờ phục hồi nhanh cho những ngày làm việc dày.",
    image: "https://wallpaperaccess.com/full/2666350.jpg",
    href: "/combo",
  },
  {
    id: "book-fast",
    badge: "Đặt nhanh",
    title: "ĐẶT LỊCH",
    highlight: "CHƯA TỚI 30S",
    description: "Chọn salon, chọn thợ và xác nhận ngay trên điện thoại.",
    image: "https://tiki.vn/blog/wp-content/uploads/2023/03/tattoo-toc-nam.jpg",
    href: "/chonsalon?step=1",
  },
];

const normalizeProvince = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9 ]+/g, " ")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

const getCityImage = (normalizedProvince: string) =>
  CITY_IMAGE_CONFIGS.find((config) =>
    config.matchers.some((matcher) => normalizedProvince.includes(matcher))
  )?.image ||
  CITY_IMAGE_CONFIGS[0].image;

const TrendingStyles = () => {
  const [styles, setStyles] = useState<any[]>([]);
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.25zone.io.vn";

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        const response = await fetch(`${apiBase}/api/bosuutap`);
        if (!response.ok) return;
        const payload = await response.json();
        if (Array.isArray(payload) && isMounted) {
          setStyles(payload.slice(0, 5));
        }
      } catch (error) {}
    };
    loadData();
    return () => { isMounted = false; };
  }, [apiBase]);

  if (!styles.length) return null;

  return (
    <>
      {styles[0] && (
        <div className="col-span-1 md:col-span-6 md:row-span-2 h-[320px] sm:h-[420px] md:h-full relative group overflow-hidden rounded-3xl cursor-pointer border-2 border-transparent hover:border-primary/50 transition-colors">
          <img alt={styles[0].title} className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-110" src={styles[0].image} />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80 group-hover:opacity-60 transition-opacity"></div>
          <div className="absolute bottom-10 left-10 max-w-sm">
            <span className="text-primary font-black text-5xl sm:text-6xl opacity-20 absolute -top-12 -left-4">01</span>
            <h3 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase text-white mb-2 leading-[1.1] relative z-10">{styles[0].title}</h3>
            <p className="text-white/90 text-sm sm:text-base md:text-lg font-medium mt-4 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 delay-100 truncate">{styles[0].desc}</p>
          </div>
        </div>
      )}
      {styles.slice(1).map((style, idx) => (
        <div key={idx} className="col-span-1 md:col-span-3 md:row-span-1 h-[220px] sm:h-[260px] md:h-full relative group overflow-hidden rounded-3xl cursor-pointer border-2 border-transparent hover:border-primary/50 transition-colors">
          <img alt={style.title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" src={style.image} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
          <div className="absolute bottom-6 left-6 right-6">
            <h3 className="text-xl sm:text-2xl font-black uppercase text-white group-hover:text-primary transition-colors line-clamp-2">{style.title}</h3>
          </div>
        </div>
      ))}
    </>
  );
};

export default function HomeContent() {
  const router = useRouter();
  const [phone, setPhone] = useState("");

  useEffect(() => {
    const user = loadUser();
    if (user?.Phone) {
      setPhone(user.Phone);
    }
  }, []);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );
  const [message, setMessage] = useState("");
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [pendingPhone, setPendingPhone] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [showOtpSuccess, setShowOtpSuccess] = useState(false);
  const [branchQuery, setBranchQuery] = useState("");
  const [activePromoIndex, setActivePromoIndex] = useState(0);
  const shopUrl = process.env.NEXT_PUBLIC_SHOP_URL || "https://shop25zone.vercel.app/";
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.25zone.io.vn";
  const [featuredCityCards, setFeaturedCityCards] = useState<
    Array<{
      title: string;
      cityParam: string;
      count: number;
      image: string;
    }>
  >([]);

  useEffect(() => {
    let isMounted = true;

    const loadFeaturedCities = async () => {
      try {
        const response = await fetch(
          `${apiBase}/api/chinhanh/summary/provinces?status=1&limit=3`,
          {
            method: "GET",
            cache: "no-store",
          }
        );
        if (!response.ok) return;
        const payload = (await response.json().catch(() => [])) as ProvinceSummaryResponse[];
        if (!isMounted) return;

        if (!Array.isArray(payload)) {
          setFeaturedCityCards([]);
          return;
        }

        setFeaturedCityCards(
          payload.map((item) => ({
            title: item.province,
            cityParam: item.city_param,
            count: Number(item.total || 0),
            image: getCityImage(
              item.normalized_province || normalizeProvince(item.province)
            ),
          }))
        );
      } catch {
        if (!isMounted) return;
        setFeaturedCityCards([]);
      }
    };

    void loadFeaturedCities();

    return () => {
      isMounted = false;
    };
  }, [apiBase]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (media.matches || QUICK_PROMO_SLIDES.length <= 1) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setActivePromoIndex((current) => (current + 1) % QUICK_PROMO_SLIDES.length);
    }, 4200);

    return () => window.clearInterval(intervalId);
  }, []);

const handleQuickBooking = async (
  event: React.FormEvent<HTMLFormElement>
) => {
  event.preventDefault();

  const rawPhone = phone.trim();
  const digits = rawPhone.replace(/[^\d]/g, "");

  if (!digits) {
    setStatus("error");
    setMessage("Vui lòng nhập số điện thoại.");
    return;
  }

  if (digits.length < 9 || digits.length > 11) {
    setStatus("error");
    setMessage("Số điện thoại không hợp lệ.");
    return;
  }

  try {
    setStatus("loading");
    setMessage("");

    const token = loadToken();

    // ✅ Nếu đã login → đi thẳng booking
    if (token) {
      router.push(`/chonsalon?step=1&phone=${digits}`);
      return;
    }

    // 🔥 Check user tồn tại
    const checkRes = await fetch(
      `${apiBase}/api/users/exists?phone=${digits}`
    );
    const checkData = await checkRes.json();

    // 👉 Lưu phone + redirect (rất quan trọng)
    const redirectUrl = `/chonsalon?step=1&phone=${digits}`;

    if (checkData.exists) {
      router.push(
        `/?auth=login&phone=${digits}&redirect=${encodeURIComponent(redirectUrl)}`
      );
    } else {
      const otpRes = await fetch(`${apiBase}/api/otp/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: digits })
      });
      const otpData = await otpRes.json();
      if (!otpRes.ok) throw new Error(otpData.error || "Không thể gửi OTP.");
      
      setPendingPhone(digits);
      setShowOtpModal(true);
      setStatus("idle");
    }
  } catch (error: any) {
    console.error(error);
    setStatus("error");
    setMessage(error.message || "Có lỗi xảy ra, vui lòng thử lại.");
  }
};

  const handleVerifyOtp = async () => {
    setOtpError("");
    setOtpLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/otp/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: pendingPhone, code: otpCode }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Mã OTP không hợp lệ.");
      }

      // Tự động tạo tài khoản mới
      const regRes = await fetch(`${apiBase}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: pendingPhone,
          phone: pendingPhone,
          email: `${pendingPhone}@gmail.com`,
          password: "123456",
          address: pendingPhone,
          remember: true
        })
      });
      const regData = await regRes.json();
      if (!regRes.ok) throw new Error(regData.message || "Không thể tạo tài khoản.");

      saveAuth({ accessToken: regData.accessToken, refreshToken: regData.refreshToken }, regData.user, true);
      
      setShowOtpSuccess(true);
      setTimeout(() => {
        setShowOtpModal(false);
        setOtpCode("");
        setShowOtpSuccess(false);
        router.push(`/chonsalon?step=1&phone=${pendingPhone}`);
      }, 5000);
    } catch (err: any) {
      setOtpError(err.message);
    } finally {
      setOtpLoading(false);
    }
  };
  const handleBranchSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const keyword = branchQuery.trim();
    if (!keyword) {
      router.push("/chinhanh");
      return;
    }
    router.push(`/chinhanh?q=${encodeURIComponent(keyword)}`);
  };

  const isLoading = status === "loading";
  return (
    <>
      <div
        className="overflow-x-hidden"
        style={
          {
            "--color-primary": "255 215 0", // #FFD700
            "--color-primary-dark": "230 194 0", // #e6c200
            "--color-primary-hover": "230 194 0",
          } as React.CSSProperties
        }
      >
        <HeroSlider />
        <section className="relative z-30 w-full -mt-[60px] sm:-mt-[90px] md:-mt-[110px] lg:-mt-[140px] px-4 sm:px-6 lg:px-8 mb-12 sm:mb-16 lg:mb-20">
          <div className="mx-auto max-w-[1100px]">
            <div className="bg-white rounded-[24px] overflow-hidden flex flex-col md:flex-row border-gray-100">
              <div className="flex-[2.5] bg-[#003C71] p-6 sm:p-8 lg:p-10 relative">
                <div className="flex items-center gap-3 mb-2">
                  <span className="w-2.5 h-2.5 bg-[#DC2626] rounded-full animate-pulse"></span>
                  <h3 className="text-3xl md:text-4xl font-[900] text-white uppercase tracking-tight">
                    ĐẶT LỊCH NGAY
                  </h3>
                  <span className="bg-[#DC2626] text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                    HOT DEAL
                  </span>
                </div>
                <p className="mb-8 text-white/80 text-sm md:text-base font-normal">
                  Giữ chỗ chỉ 30 giây - Cắt xong trả tiền - Hủy lịch không sao
                </p>
                <form className="flex flex-col md:flex-row w-full gap-3" onSubmit={handleQuickBooking}>
                  <div className="relative flex-1">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#003C71] text-2xl">
                      phone_iphone
                    </span>
                    <input
                      className="w-full h-12 sm:h-14 pl-12 pr-4 rounded-xl bg-white text-[#003C71] font-bold text-base sm:text-lg outline-none placeholder:font-normal"
                      placeholder="Nhập SĐT..."
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      value={phone}
                      onChange={(event) => {
                        setPhone(event.target.value);
                        if (status !== "idle") {
                          setStatus("idle");
                          setMessage("");
                        }
                      }}
                    />
                  </div>
                  <button
                    className="h-12 sm:h-14 px-6 sm:px-8 rounded-xl text-base sm:text-lg font-[900] uppercase tracking-tight transition-all duration-300 flex items-center justify-center gap-2 active:scale-95 border-none outline-none text-[#003C71] bg-[linear-gradient(to_right,#FFD700,#FACC15)] hover:bg-none hover:bg-white disabled:opacity-70 disabled:cursor-not-allowed"
                    type="submit"
                    disabled={isLoading}
                    aria-busy={isLoading}
                  >
                    {isLoading ? "ĐANG GỬI..." : "ĐẶT LỊCH"}
                    <span className="material-symbols-outlined font-black">arrow_forward</span>
                  </button>
                </form>
                {message ? (
                  <p
                    className={`mt-3 text-sm font-semibold ${status === "success" ? "text-emerald-200" : "text-red-200"
                      }`}
                    role="status"
                    aria-live="polite"
                  >
                    {message}
                  </p>
                ) : null}
              </div>
              <div className="relative flex-1 overflow-hidden bg-[#F8FAFC]">
                <div className="relative h-full min-h-[220px]">
                  {QUICK_PROMO_SLIDES.map((slide, index) => {
                    const isActive = index === activePromoIndex;

                    return (
                      <Link
                        key={slide.id}
                        href={slide.href}
                        className={`group absolute inset-0 block transition-all duration-700 ease-out ${
                          isActive
                            ? "translate-x-0 opacity-100"
                            : "pointer-events-none translate-x-4 opacity-0"
                        }`}
                      >
                        <img
                          alt={slide.title}
                          className={`h-full w-full object-cover transition-transform duration-[1400ms] ease-out ${
                            isActive ? "scale-100" : "scale-105"
                          }`}
                          src={slide.image}
                        />
                        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,28,58,0.08)_0%,rgba(3,41,86,0.68)_46%,rgba(0,32,68,0.96)_100%)]" />
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,215,0,0.32),transparent_42%)]" />
                        <div className="absolute inset-x-0 top-1/2 z-0 -translate-y-1/2 text-center text-[2.8rem] font-[900] uppercase leading-none tracking-[-0.08em] text-white/10 sm:text-[3.5rem]">
                          25ZONE
                        </div>

                        <div className="absolute inset-x-0 top-0 z-20 flex items-start justify-start p-6 sm:p-7">
                          <span className="inline-flex rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white/95">
                            {slide.badge}
                          </span>
                        </div>

                        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center px-6 pb-10 pt-16 text-center sm:px-7 sm:pb-12 sm:pt-20">
                          <div className="mx-auto flex max-w-[250px] flex-col items-center text-center">
                            <h4 className="text-[1.55rem] font-[900] uppercase leading-[0.98] tracking-[-0.03em] text-white sm:text-[1.85rem]">
                              {slide.title}
                              <span className="mt-1 block text-[#FFE082]">
                                {slide.highlight}
                              </span>
                            </h4>
                          </div>
                        </div>
                      </Link>
                    );
                  })}

                  <div className="absolute bottom-4 left-6 right-6 z-30 flex items-center gap-2">
                    {QUICK_PROMO_SLIDES.map((slide, index) => (
                      <button
                        key={slide.id}
                        type="button"
                        aria-label={`Chuyển banner ${index + 1}`}
                        onClick={() => setActivePromoIndex(index)}
                        className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                          index === activePromoIndex
                            ? "bg-white"
                            : "bg-white/35 hover:bg-white/55"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        <HomeServiceShowcase />
        <section className="hidden md:block py-16 sm:py-20 lg:py-24 bg-navy text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-accent-blue/10 skew-x-12 transform translate-x-1/4"></div>
          <div className="absolute bottom-0 left-0 w-1/3 h-1/2 bg-primary/5 rounded-full blur-[100px]"></div>
          <div className="mx-auto max-w-container px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 sm:gap-8 mb-12 sm:mb-16">
              <div>
                <span className="inline-block py-1.5 px-4 rounded-full bg-white/10 text-primary font-bold text-xs uppercase tracking-[0.2em] mb-4 border border-white/20">Trending Styles 2024</span>
                <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-black uppercase tracking-tight leading-[0.95] sm:leading-none">Shine<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">Collection</span></h2>
              </div>
              <a className="mt-8 md:mt-0 group flex items-center gap-4 border border-white/30 px-8 py-4 rounded-full hover:bg-white hover:text-navy transition-all duration-300" href="/bosuutap">
                <span className="font-bold uppercase tracking-wider">Xem Thêm Bộ Sưu Tập</span>
                <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </a>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-12 md:grid-rows-2 gap-4 sm:gap-6 md:gap-4 md:min-h-[800px]">
              {/* Chúng ta sẽ load động 5 kiểu tóc từ backend. Tạm thời gọi API /api/bosuutap */}
              <TrendingStyles />
            </div>
          </div>
        </section>
        <section className="py-16 sm:py-20 lg:py-24 bg-white">
          <div className="mx-auto max-w-container px-4 sm:px-6 lg:px-8">
            <div className="mb-12 sm:mb-16 lg:mb-20">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-10">
                <div className="flex items-center gap-3">
                  <span className="h-12 w-12 flex items-center justify-center bg-navy text-white rounded-full shadow-lg">
                    <span className="material-symbols-outlined text-2xl">location_on</span>
                  </span>
                  <div>
                    <h2 className="text-3xl md:text-4xl font-black text-navy uppercase leading-[0.95] sm:leading-none">
                      TÌM 25ZONE GẦN NHẤT
                    </h2>
                    <p className="text-gray-500 mt-1 font-medium">
                      Hệ thống 100+ salon trên toàn quốc. Đặt lịch là có chỗ.
                    </p>
                  </div>
                </div>
                <form className="relative w-full md:w-auto max-w-md" onSubmit={handleBranchSearch}>
                  <input
                    className="w-full md:w-96 h-12 pl-5 pr-12 rounded-full border border-gray-300 bg-gray-50 focus:bg-white focus:border-navy focus:ring-1 focus:ring-navy outline-none font-bold text-navy"
                    placeholder="Nhập tên đường, quận, huyện..."
                    type="text"
                    value={branchQuery}
                    onChange={(event) => setBranchQuery(event.target.value)}
                  />
                  <button
                    type="submit"
                    className="absolute right-1 top-1 h-10 w-10 bg-navy text-white rounded-full flex items-center justify-center hover:bg-primary hover:text-navy transition-colors"
                  >
                    <span className="material-symbols-outlined text-xl">search</span>
                  </button>
                </form>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {featuredCityCards.map((city) => (
                  <a
                    key={city.cityParam}
                    className="group relative h-[280px] sm:h-[340px] md:h-[400px] overflow-hidden rounded-2xl shadow-lg cursor-pointer"
                    href={`/chinhanh?city=${city.cityParam}`}
                  >
                    <img
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                      src={city.image}
                      alt={city.title}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
                    <div className="absolute bottom-0 left-0 right-0 p-5">
                      <h3 className="text-white font-black text-2xl sm:text-3xl leading-[0.95] sm:leading-none">
                        {city.title}
                      </h3>
                      <p className="text-[#FFD700] text-base sm:text-lg font-extrabold mt-1">
                        {city.count} Salon
                      </p>
                    </div>
                  </a>
                ))}

                <a className="group h-[280px] sm:h-[340px] md:h-[400px] bg-navy rounded-2xl shadow-lg flex flex-col items-center justify-center text-center p-6 hover:bg-navy-light transition-colors" href="/chinhanh">
                  <span className="material-symbols-outlined text-5xl sm:text-6xl mb-4 text-[#FFD700]">add_location_alt</span>
                  <h3 className="text-white font-black uppercase text-xl leading-tight">
                    Xem tất cả<br />Tỉnh thành
                  </h3>
                </a>
              </div>
            </div>

            <div className="rounded-[2.5rem] p-10 lg:p-16 border border-blue-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-[80px] -mr-10 -mt-10"></div>
              <div className="text-center mb-8 sm:mb-10 lg:mb-12 relative z-10">
                <h3 className="text-4xl font-black text-navy uppercase mb-3 flex items-center justify-center gap-3">
                  <span className="material-symbols-outlined text-primary text-5xl">verified_user</span>
                  Cam kết 25Zone Care
                </h3>
                <p className="text-gray-500 font-medium text-lg">
                  Quyền lợi khách hàng là ưu tiên số 1. Không hài lòng, làm lại miễn phí.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 lg:gap-10 relative z-10">
                <div className="flex flex-col items-center text-center group">
                  <div className="w-24 h-24 rounded-full bg-white shadow-card flex items-center justify-center mb-6 text-accent-blue font-black text-4xl border-4 border-white group-hover:scale-110 transition-transform">
                    07
                  </div>
                  <h4 className="font-black text-navy text-xl mb-3 uppercase">7 Ngày Bảo Hành Tóc</h4>
                  <p className="text-base text-gray-600 max-w-xs leading-relaxed">
                    Miễn phí sửa lại tóc trong vòng 7 ngày nếu chưa ưng ý bất kỳ chi tiết nào.
                  </p>
                </div>
                <div className="flex flex-col items-center text-center group">
                  <div className="w-24 h-24 rounded-full bg-white shadow-card flex items-center justify-center mb-6 text-accent-blue font-black text-4xl border-4 border-white group-hover:scale-110 transition-transform">
                    15
                  </div>
                  <h4 className="font-black text-navy text-xl mb-3 uppercase">15 Ngày Bảo Hành Hóa Chất</h4>
                  <p className="text-base text-gray-600 max-w-xs leading-relaxed">
                    Miễn phí làm lại hoặc hoàn tiền 100% nếu uốn/nhuộm phai màu nhanh.
                  </p>
                </div>
                <div className="flex flex-col items-center text-center group">
                  <div className="w-24 h-24 rounded-full bg-white shadow-card flex items-center justify-center mb-6 text-red-500 font-black text-4xl border-4 border-white group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-4xl font-bold">timer_off</span>
                  </div>
                  <h4 className="font-black text-navy text-xl mb-3 uppercase">Chờ Lâu = Miễn Phí</h4>
                  <p className="text-base text-gray-600 max-w-xs leading-relaxed">
                    Giảm ngay 100% hóa đơn cắt tóc nếu bạn phải chờ đợi quá thời gian cam kết.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="hidden md:block py-16 sm:py-20 lg:py-24 bg-[#003366] text-white overflow-hidden relative">
          <div className="absolute inset-0">
            <img className="h-full w-full object-cover opacity-20 grayscale" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDEEWOwVAEececkEBbs-nUXtt_tiHRvVrTCP2XEzz781nG0qiUQBSUiN2xZjn9-Uqg65_sXZGTzqBbP9Xo6tAqXeHKX_xP0kw9eRwGHjyBmrBVn8y7k6hRQHkR3fy-EzNczw038hJQPZeHr32ryDxxgysCNcCe0DxRPP60DBQbo02nSwPcvXywp2w8MOZFB8afh5X72nc9kdWldqv8ER-FtfUz0SzyiQchFbwK7izHBCROpEFxb_aBGxj1lf-XluEhXjNzSl4SiQWI" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#003366] via-[#003366]/95 to-[#003366]/70"></div>
            <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-primary/50 to-transparent skew-x-12 blur-[1px]">
            </div>
            <div className="absolute top-0 right-1/4 w-px h-full bg-gradient-to-b from-transparent via-primary/50 to-transparent skew-x-12 blur-[1px]">
            </div>
          </div>
          <div className="mx-auto max-w-container px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center mb-12 sm:mb-16 lg:mb-20">
              <div className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-gradient-to-r from-primary to-orange-500 text-navy font-black text-base uppercase mb-8 animate-pulse shadow-neon transform -rotate-2">
                <span className="material-symbols-outlined text-xl">trophy</span>
                Top Stylist Xuất Sắc Nhất Tháng
              </div>
              <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-9xl font-black uppercase leading-[0.95] sm:leading-none mb-6 text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-600 drop-shadow-2xl tracking-tighter">
                YOU'RE THE BEST
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-gray-400 max-w-3xl mx-auto font-medium">Vinh danh những đôi bàn tay vàng. Hãy
                trải nghiệm sự khác biệt với những nhà tạo mẫu tóc hàng đầu.</p>
            </div>
            <TopStylists />
          </div>
        </section>
        <section className="hidden md:block py-16 sm:py-20 lg:py-24 bg-white relative">
          <div className="mx-auto max-w-container px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-center justify-between mb-8 sm:mb-10 lg:mb-12 border-b-2 border-gray-100 pb-8">
              <div className="flex items-center gap-6">
                <div className="bg-[#002d58] text-white p-4 rounded-2xl shadow-lg">
                  <span className="material-symbols-outlined text-4xl">shopping_bag</span>
                </div>
                <div>
                  <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#002d58] uppercase tracking-tight leading-[0.95] sm:leading-none mb-2">25ZONE
                    SHOP</h2>
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-1 bg-yellow-400"></span>
                    <p className="text-gray-500 font-bold uppercase tracking-wide text-sm">Chăm sóc toàn diện tại
                      nhà
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-6 md:mt-0 flex items-center gap-4">
                <a className="text-sm font-black text-white bg-[#002d58] hover:bg-blue-900 px-8 py-4 rounded-full flex items-center gap-2 transition-all uppercase tracking-wider shadow-md" href={shopUrl}>
                  Vào Cửa Hàng <span className="material-symbols-outlined text-sm font-bold">arrow_forward</span>
                </a>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 sm:gap-8 lg:gap-10">
              <div className="lg:col-span-2 relative overflow-hidden rounded-[2.5rem] min-h-[360px] sm:min-h-[450px] shadow-xl group cursor-pointer">
                <img className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBj4Rwk27N9oa54USQ_ffSF-4eh4sZQseAN7Ppn5BEcb-1lEPdv0xqnz54awpWSbl6DbtwyaEJtEDaxJRKGhnxwu7UqynBw25WOJpKoi295p86YKtbqyOlZng3DBEPoy3_In14r_1sl6-_MmwWXDv0UOyffxk9ZguiCMnh9SpJ185veXHE9tU_bXelW24L-JdDLrjs9WE_u5siy7gXu0SkwvFDnLcFxTo8bsjU75JbXTM01EtS2eru93I0E4t-H8WpsMPsFBdp39IE" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#002d58]/95 via-[#002d58]/40 to-transparent flex flex-col justify-end p-10 text-white">
                  <span className="bg-yellow-400 text-[#002d58] font-bold text-xs uppercase px-3 py-1 rounded w-fit mb-6 shadow-md">Official
                    Store</span>
                  <h3 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase mb-6 leading-[0.9]">Sáp Vuốt Tóc<br /><span className="text-yellow-400">Chính Hãng</span></h3>
                  <p className="mb-8 text-white/90 font-medium max-w-xs text-base sm:text-lg">Nhập khẩu 100%. Cam kết chất lượng.
                    Hoàn
                    tiền nếu fake.</p>
                  <button type="button" onClick={() => window.location.assign(shopUrl)} className="w-fit bg-white text-[#002d58] font-black px-10 py-4 rounded-full text-sm hover:bg-yellow-400 transition-colors uppercase tracking-wider shadow-lg">Mua
                    ngay</button>
                </div>
              </div>
              <div className="lg:col-span-3 flex flex-col gap-6 sm:gap-8 lg:gap-10">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="bg-white p-4 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all flex flex-col">
                    <div className="aspect-square bg-orange-50 rounded-3xl mb-4 overflow-hidden relative">
                      <img className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAK8GgwLF2TKn3VfapDo1wlWHyZPZfx6hRoKXo04c_lxf9u4fpaE379Nh41rafMMVGAfdv7vZvUBh241qCaDCET6TS4tTBB8p7u150Lyl7f6JitRkvXhpZjMrx_jH11FEvoRBKHF4eJPjKRW2shFLXqUfI583ve6KT87koVgymrsEZE0fjVpV9BfCQcSiRLzJb0NIT9K8-BMo2Tm6m1TDbNogB2tArTjy5KiErJZbYO_REa_zb_zsFL92HRDYxCfB-fgkKPZdkPXzA" />
                      <div className="absolute top-3 right-3 bg-red-500 text-white text-[10px] font-black px-2 py-1 rounded">
                        -20%</div>
                    </div>
                    <h4 className="font-bold text-[#002d58] text-base mb-2">Xịt tạo kiểu Glanzen X2
                      Booster
                    </h4>
                    <div className="mt-auto flex items-end justify-between">
                      <div>
                        <p className="text-[10px] text-gray-400 line-through">345.000đ</p>
                        <p className="font-black text-lg text-red-500">276.000đ</p>
                      </div>
                      <button type="button" onClick={() => window.location.assign(shopUrl)} className="w-10 h-10 rounded-full bg-[#002d58] text-white flex items-center justify-center hover:bg-yellow-400 hover:text-[#002d58] transition-colors">
                        <span className="material-symbols-outlined text-lg">shopping_cart</span>
                      </button>
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all flex flex-col">
                    <div className="aspect-square bg-orange-50 rounded-3xl mb-4 overflow-hidden relative">
                      <img className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAaG-Fn8tfCYpJ5VwJECmgcD7aOAjdJ-XiZdTyUEDmYIK_IP11RNZ0eg8ljB8-sNCtDoOpZH1YYhAdx7FTESY3cB97z9G8hq5V_Ww6xe5cQB-HGv5xweLTahfnSn9Dd-rBDKrVdtQ5c3awSSPSA3sElV8ObKGdR51ZqCu5gGXTb54GUeyTb_WWQ_mdBPmHYk4-z9jjMceNmzcGTqRVdD6m6rVTRNkCFrAClRK-_btJBkjYlRy0q7r768OL03qSyfLItYWYnDYaz9t8" />
                    </div>
                    <h4 className="font-bold text-[#002d58] text-base mb-2">Serum Men Dưỡng Trắng Da
                    </h4>
                    <div className="mt-auto flex items-end justify-between">
                      <p className="font-black text-lg text-[#002d58]">429.000đ</p>
                      <button type="button" onClick={() => window.location.assign(shopUrl)} className="w-10 h-10 rounded-full bg-[#002d58] text-white flex items-center justify-center hover:bg-yellow-400 hover:text-[#002d58] transition-colors">
                        <span className="material-symbols-outlined text-lg">shopping_cart</span>
                      </button>
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all flex flex-col">
                    <div className="aspect-square bg-blue-50 rounded-3xl mb-4 overflow-hidden relative">
                      <img className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCeBkoIGyOhWGcgJLhGT-dzHSp3xBemqBGGXjJVx_5Oi4VtQP_LhQfVkBm-IYQqTlXHi5-xcBlytWlWag1_OYqotajbnJM7SbpYLBhSiehpJZrpLdbSQcgjXxcgIY6bCYT6A5evgUbNfOUZ37OWVDjjvgQaef16XMp9dIAo6PzFKLHyIxpO3yJNuY-5QEWzrKGgc4jzGRz6mgDSyj2702hjL0VI_jQB5p9rchnJYqlZWOE0vIGvCAsowVMfVZbGZ2gXFYPzs3uU9LQ" />
                      <div className="absolute top-3 right-3 bg-[#002d58] text-white text-[10px] font-black px-2 py-1 rounded">
                        New</div>
                    </div>
                    <h4 className="font-bold text-[#002d58] text-base mb-2">Sữa Rửa Mặt Than Hoạt Tính
                    </h4>
                    <div className="mt-auto flex items-end justify-between">
                      <p className="font-black text-lg text-[#002d58]">150.000đ</p>
                      <button type="button" onClick={() => window.location.assign(shopUrl)} className="w-10 h-10 rounded-full bg-[#002d58] text-white flex items-center justify-center hover:bg-yellow-400 hover:text-[#002d58] transition-colors">
                        <span className="material-symbols-outlined text-lg">shopping_cart</span>
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex justify-center mt-4">
                  <button type="button" onClick={() => window.location.assign(shopUrl)} className="bg-[#2EB2FF] text-white px-12 py-4 rounded-full font-bold flex items-center gap-3 hover:bg-blue-900 transition-all shadow-lg text-sm uppercase tracking-widest group">
                    Xem thêm sản phẩm
                    <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
        <NewsSmileSection />
      </div>

      {showOtpModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl relative animate-in fade-in zoom-in duration-300">
            {!showOtpSuccess && (
              <button
                onClick={() => setShowOtpModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <span className="material-symbols-outlined text-2xl">close</span>
              </button>
            )}

            {showOtpSuccess ? (
              <div className="flex flex-col items-center justify-center py-6 text-center animate-in zoom-in duration-300">
                <div className="w-20 h-20 mb-4 rounded-full bg-emerald-100 flex items-center justify-center">
                  <i className="fa-solid fa-check text-4xl text-emerald-500 animate-[bounce_1s_ease-in-out]"></i>
                </div>
                <h3 className="text-xl font-bold text-slate-900 uppercase mb-3">Tạo tài khoản thành công</h3>
                <p className="text-sm font-medium text-blue-600 bg-blue-50 py-2 px-3 rounded-lg border border-blue-100 mb-4">
                  Mật khẩu đăng nhập đã được gửi về số điện thoại của quý khách, vui lòng kiểm tra tin nhắn.
                </p>
                <p className="text-slate-500 text-sm flex items-center gap-2">
                  <i className="fa-solid fa-circle-notch fa-spin"></i> Đang chuyển đến Đặt lịch...
                </p>
              </div>
            ) : (
              <>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 text-[#003C71]">
                    <span className="material-symbols-outlined text-3xl">sms</span>
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 uppercase">Xác thực số điện thoại</h3>
                  <p className="text-slate-500 text-sm mt-2">
                    Mã xác thực gồm 6 số đã được gửi đến số<br/>
                    <strong className="text-slate-800">{pendingPhone}</strong>
                  </p>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <input
                      type="text"
                      placeholder="Nhập mã OTP..."
                      className="w-full h-14 bg-slate-50 border border-slate-200 rounded-xl px-4 text-center text-2xl tracking-widest font-bold outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      maxLength={6}
                    />
                    {otpError && (
                      <p className="text-red-500 text-sm mt-2 text-center font-medium">{otpError}</p>
                    )}
                  </div>
                  
                  <button
                    onClick={handleVerifyOtp}
                    disabled={otpLoading || otpCode.length < 6}
                    className="w-full h-14 bg-[#003C71] hover:bg-[#002d58] text-white font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-lg"
                  >
                    {otpLoading ? "Đang xác thực..." : "Xác nhận"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}


