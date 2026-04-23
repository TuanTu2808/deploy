"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  startTransition,
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import {
  fetchBookingHomeSections,
  type BookingHomeCombo,
  type BookingHomeResponse,
  type BookingHomeSingleService,
} from "@/lib/booking-home";
import {
  addServiceToBookingSelection,
  buildBookingFlowHref,
  readStoredBookingFlowSelection,
  writeStoredBookingFlowSelection,
} from "@/lib/booking-flow-selection";

const HERO_FALLBACK =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAElrYppJXu0iyiHQwc-y-QQDgRSxvrpeUhIUmYkTk4i-ghcZdqljJiFiiDiUdvqWUB-BMJ84y5fwpyrcNrXVb1_AyeOolMkW-yl1X2BgxzJzzeXg6rzbpRTgpvo1l-ko3f66sD9TVGVCxp6vc3G0aEfS7Irq7-x-Os2W40Xw2Qr2r5-OsGZ8x_YGf0inIA8TOzSMed7xXrN6OMNH2NfzvoPTJNyU1V7KjO-h9u8R3xMDZ3otWrOx9iQ1BWkwOUqJYeaGQWJGmbkKk";
const UON_FALLBACK =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBa3CwdaEmtFPvhMk8MasJIvPuT5Mb1Kd1wn1AtOQt4xwTpEAHxEKzXR_mFrDd90oi0gL87mVa90kZBpxXb-yWJzQvUgbELXi1ODeMBlbRmaxWxu16YJK0ETXq6Pq44iFq-ceOBj4So6wtc34cQtFrrw6-r2hVdEY9z5VyW2lc8bGYdRq9SHu5Uc5NqIX-jUbSGjOiXA4EsCCuFcKpglpgVcu9nd_lF1Ot_fvJWpkV56TOZ1u0xjHcvz2vhunIwPAF1PGh73d13-hk";
const NHUOM_FALLBACK =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuD7g_BLYK9gdp3RFA1CkJ5qLZ9HJypoPHZLEt5KA7JAKhS-zVn0b5YFq-iSEi5NAftZhbVGnUDztJuedWW92KJut3DVtJW4T1HjUB-_Q3iRcRQz29hltwQEXyGb39HwpzJrjZDzKdpEXEuF3p1GuUYotE5mtU8ar76XDblOhUv3NialLNWCGNdwXviMKHhOjbYdzy9SiWKZtPAiO7ICkoA8Lv9OoYeazJ9QlA3YBGmeRGiavS6EQB_N5xQA7OTjOZT88hgLnTqSY7o";
const BANNER_FALLBACK =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuA12sCbIUnOUJKQjZskL_ntQMLjYfsV1R-60ZC_H2e134SZ8_PXAWTwcstLhva2vpLdLfaKUihb667j1t7IINyJadBpZRLrfBhHtTGtNotJTqArchPQD3R6ebLI7dwnpC8Xv2lBOQ6c0HZEjsvtVd_FBw7fM9PKjafAnNifsv9CQMKOGJHKGZlTQJMHKoBboDrLDVzJM5iV918jvq1BgUT7--gL-2k3kovQnoZbC2MvNsJR2aTAp5LaqRIuAwWSqZLSZ65fcRmEbTA";
const GOI_FALLBACK =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDC16jcRaNLp2cop4C0QNdvNhrieD92I78AKySDHcmFyhKkQPwMtP-jCDq4qfInJIxeRr3NQwzvDZtJ-5A8b9eZ2an96JcwuvVWj92hXcvSOo9bV6ZIOJLObRWK0m0N504rEI5y_juM-J5t1F9j3_2B1eSE0iuSA4AqwUoPMLr3L1_qNZq_z6Wa3QKKjNV-0CzXOhwOOpgFPAUiRRrk5oJyLNqciLItrf4cvxeeLIm-swqxY5Y39jLTSjJ6y-4xPpXXkRJg6rIxMVQ";
const RAYTAI_FALLBACK =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBUcZO1ax02GB6DQLiZl6RtjvOVwFd9AvHO4Zcot5PjMLZ5uIvKJqY_jTbUbquRJEynDgTBN3H5ltfB5gc1ELg3VAKeA04ILi24uYtGTF-aqdzBhp4R4KRB6Uiim6UhR09pMQFdiX4TqeP2m0LlCZXG5KDYpFaGAxKn-UvR5r8cIQJnPtHCpJDjkWCe5TRXh54oxs20HBK96zlv-RQFLyl6vg63gawHiVxTWzHGMHs3yrw8Oeh4peRJI0q_K9gLVc3OcvVgSdP-DOw";
const DAMAT_FALLBACK =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDUqndgKxVfwx0tEEdWQBVjMqVcGXS8D5endKcF05vlCN2VFuNXw-nzeMRcoZ6aIPF8lnE1H34HS0aJY-4JWNi7PuvW01f0_SgVg6XTTKSOAj03Mhuf-XPZT9F4xloh4UU67mZ9eiBjAvVOuXE2mGN63_gP_kCbYsSsrSh9rHU6PMFet6SPzOgfVIAB2JLJRaE0OywsFstww9m3Uta0KCRfLAJaTXL8M3VcIgFHm6NyONxNyx7fyFrEZZDInKkJ-X1qt0eEGyZlpsg";
const SERVICE_FALLBACKS = [
  "/salon.png",
  "/image/25zone.png",
  "/logogioithieu.png",
  "/image/avatar.png",
  "/salon.png",
  "/image/25zone.png",
];
const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5001";
const SERVICE_WINDOW_TRANSITION_MS = 420;

const getServiceCarouselConfig = (width: number) => {
  if (width >= 1280) {
    return { visibleCount: 3, gap: 40 };
  }

  if (width >= 768) {
    return { visibleCount: 2, gap: 32 };
  }

  return { visibleCount: 1, gap: 24 };
};

const formatPriceK = (value: number) => {
  const amount = Number(value || 0);
  if (!Number.isFinite(amount) || amount <= 0) return "Liên hệ";
  return `${Math.round(amount / 1000)}K`;
};

const splitTitle = (value: string, firstWords = 2) => {
  const words = String(value || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (words.length <= firstWords) {
    return { first: words.join(" "), second: "" };
  }
  return {
    first: words.slice(0, firstWords).join(" "),
    second: words.slice(firstWords).join(" "),
  };
};

const splitDescription = (value: string) => {
  const text = String(value || "").trim();
  if (!text) return { lead: "", tail: "" };
  const firstDot = text.indexOf(".");
  if (firstDot < 0) return { lead: text, tail: "" };
  return {
    lead: text.slice(0, firstDot + 1).trim(),
    tail: text.slice(firstDot + 1).trim(),
  };
};

const truncateText = (value: string, maxLength = 120) => {
  const text = String(value || "").trim();
  if (!text || text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trim()}...`;
};

const getDiscountedServicePrice = (service?: BookingHomeSingleService | null) => {
  const basePrice = Number(service?.Price || 0);
  const salePercent = Number(service?.Sale_Price || 0);

  if (!Number.isFinite(basePrice) || basePrice <= 0) return 0;
  if (!Number.isFinite(salePercent) || salePercent <= 0 || salePercent >= 100) {
    return basePrice;
  }

  return Math.round(basePrice * ((100 - salePercent) / 100));
};

const comboUrl = (combo?: BookingHomeCombo | null) =>
  combo ? `/combo?comboId=${combo.Id_combo}` : "/combo";
const serviceBookingUrl = "/chonsalon?step=1";

const getServiceCategoryLabel = (service?: BookingHomeSingleService | null) => {
  const label = String(service?.category_name || "").trim();
  return label || "Dịch vụ khác";
};

const getServiceCategoryKey = (service?: BookingHomeSingleService | null) => {
  const categoryId = Number(service?.Id_category || 0);
  if (categoryId > 0) {
    return `cat-${categoryId}`;
  }

  return `cat-${getServiceCategoryLabel(service).toLowerCase()}`;
};

type ShowcaseComboPreference = {
  key: string;
  preferredId?: number;
  preferredName?: string;
  fallbackIndex?: number;
};

const selectShowcaseCombos = (
  combos: BookingHomeCombo[],
  preferences: ShowcaseComboPreference[]
) => {
  const usedIds = new Set<number>();

  return preferences.reduce<Record<string, BookingHomeCombo | null>>(
    (selected, preference) => {
      const normalizedName = String(preference.preferredName || "")
        .trim()
        .toLowerCase();

      const candidates = [
        normalizedName
          ? combos.find(
              (combo) =>
                String(combo.Name || "").trim().toLowerCase() === normalizedName
            ) || null
          : null,
        Number.isFinite(preference.preferredId)
          ? combos.find((combo) => combo.Id_combo === preference.preferredId) ||
            null
          : null,
        typeof preference.fallbackIndex === "number" &&
        preference.fallbackIndex >= 0 &&
        preference.fallbackIndex < combos.length
          ? combos[preference.fallbackIndex]
          : null,
        ...combos,
      ];

      const combo =
        candidates.find(
          (item) => item && !usedIds.has(Number(item.Id_combo || 0))
        ) || null;

      if (combo) {
        usedIds.add(combo.Id_combo);
      }

      selected[preference.key] = combo;
      return selected;
    },
    {}
  );
};

type TopCardProps = {
  combo: BookingHomeCombo | null;
  titleFallback: string;
  descFallback: string;
  imageFallback: string;
  titleHoverClass: string;
  titleAccentClass: string;
  tailAccentClass: string;
};

function HairTopCard({
  combo,
  titleFallback,
  descFallback,
  imageFallback,
  titleHoverClass,
  titleAccentClass,
  tailAccentClass,
}: TopCardProps) {
  const router = useRouter();
  const title = splitTitle(combo?.Name || titleFallback, 2);
  const desc = splitDescription(combo?.Description || descFallback);

  return (
    <div className="group relative cursor-pointer min-h-[420px] sm:min-h-[520px] md:min-h-[600px] lg:min-h-[680px] rounded-[3rem] overflow-hidden bg-white shadow-card border border-gray-100 flex flex-col">
      <div className="h-[200px] sm:h-[240px] lg:h-[260px] relative overflow-hidden">
        <img
          alt={combo?.Name || titleFallback}
          className="absolute inset-0 h-full w-full object-cover group-hover:scale-110 transition-transform duration-700"
          src={combo?.Image_URL || imageFallback}
        />
      </div>
      <div className="flex-1 relative p-6 sm:p-8 flex flex-col bg-white z-20 -mt-6 sm:-mt-10 rounded-t-[3rem]">
        <div className="flex-grow">
          <h3
            className={`text-2xl sm:text-3xl font-black text-[#003366] uppercase leading-[1.1] tracking-tighter mb-4 ${titleHoverClass}`}
          >
            {title.first}
            <br />
            <span className={titleAccentClass}>{title.second || "Dịch vụ"}</span>
          </h3>
          <p className="text-gray-500 text-base font-bold leading-relaxed mb-4">
            {desc.lead}
            {desc.tail ? <span className={tailAccentClass}>{` ${desc.tail}`}</span> : null}
          </p>
        </div>
        <div className="pt-10 border-t border-gray-200">
          <div className="flex justify-between items-end mb-10">
            <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">
              Giá từ
            </span>
            <span className="text-3xl sm:text-4xl font-black text-[#003366] leading-[0.95] sm:leading-none">
              {formatPriceK(combo?.Price || 0)}
            </span>
          </div>
          <button
            type="button"
            onClick={() => router.push(comboUrl(combo))}
            className="w-full bg-[#003366] text-white py-4 rounded-2xl font-black uppercase text-base transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:bg-[#33B1FA] hover:text-white"
          >
            XEM CHI TIẾT{" "}
            <span className="material-symbols-outlined font-black text-xl">
              arrow_forward
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

type RelaxCardProps = {
  combo: BookingHomeCombo | null;
  titleFallback: string;
  descFallback: string;
  imageFallback: string;
  badgeText: string;
  badgeColor: string;
  lineColor: string;
  accentColor: string;
  icon: string;
  circleIcon: string;
  buttonHoverClass: string;
};

function RelaxCard({
  combo,
  titleFallback,
  descFallback,
  imageFallback,
  badgeText,
  badgeColor,
  lineColor,
  accentColor,
  icon,
  circleIcon,
  buttonHoverClass,
}: RelaxCardProps) {
  const router = useRouter();
  const title = splitTitle(combo?.Name || titleFallback, 2);
  const desc = splitDescription(combo?.Description || descFallback);

  return (
    <div className="col-span-1 group cursor-pointer min-h-[480px] sm:min-h-[560px] md:min-h-[620px] lg:min-h-[720px] relative">
      <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-card service-card-hover border border-gray-100 h-full flex flex-col relative z-10">
        <div className="h-[220px] sm:h-[260px] lg:h-[300px] overflow-hidden relative">
          <img
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
            src={combo?.Image_URL || imageFallback}
            alt={combo?.Name || titleFallback}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-80" />
          <div className="absolute top-6 left-6 z-20">
            <span
              className={`${badgeColor} text-white px-4 py-2 rounded-xl text-xs font-black shadow-lg uppercase tracking-wide border border-white/20 flex items-center gap-2`}
            >
              <span className="material-symbols-outlined text-base">{icon}</span>
              {badgeText}
            </span>
          </div>
          <div className="absolute bottom-0 left-0 p-8 w-full z-20">
            <h3 className="text-2xl sm:text-3xl md:text-4xl font-black text-white uppercase leading-[0.9] text-shadow-lg mb-2">
              {title.first}
              <br />
              {title.second || "Dịch vụ"}
            </h3>
            <div className={`w-16 h-1.5 ${lineColor} mb-2`} />
          </div>
        </div>
        <div className="p-8 flex flex-col flex-grow relative bg-white justify-between -mt-4 sm:-mt-6 rounded-t-[2rem] z-30">
          <div>
            <p className="text-gray-600 text-base sm:text-lg font-bold leading-relaxed mb-6">
              {desc.lead}
              {desc.tail ? <span className={accentColor}>{` ${desc.tail}`}</span> : null}
            </p>
          </div>
          <div className="mt-auto pt-6 border-t border-gray-100">
            <div className="flex items-end justify-between mb-6">
              <div>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">
                  Giá trải nghiệm
                </p>
                <span
                  className={`text-3xl sm:text-4xl font-black tracking-tighter ${accentColor}`}
                >
                  {formatPriceK(combo?.Price || 0)}
                </span>
              </div>
              <div
                className={`w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center ${accentColor} transition-colors duration-300`}
              >
                <span className="material-symbols-outlined text-3xl">
                  {circleIcon}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => router.push(comboUrl(combo))}
              className={`w-full bg-navy text-white ${buttonHoverClass} px-6 py-4 sm:py-5 rounded-2xl font-black uppercase text-base shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3 transform active:scale-95 group-hover:-translate-y-1`}
            >
              XEM CHI TIẾT{" "}
              <span className="material-symbols-outlined text-xl font-black">
                arrow_forward
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

type SingleServiceCardProps = {
  service: BookingHomeSingleService;
  fallbackImage: string;
};

function SingleServiceCard({
  service,
  fallbackImage,
}: SingleServiceCardProps) {
  const router = useRouter();
  const primaryImage = service.Image_URL || fallbackImage;
  const [imageSrc, setImageSrc] = useState(primaryImage);
  const [hideImage, setHideImage] = useState(false);
  const description = truncateText(
    splitDescription(service.Description || "").lead ||
      service.Description ||
      "Trải nghiệm chăm sóc chuẩn salon với quy trình chỉn chu, gọn gàng và dễ đặt lịch.",
    110
  );
  const discountedPrice = getDiscountedServicePrice(service);
  const hasSale =
    Number.isFinite(Number(service.Sale_Price || 0)) &&
    Number(service.Sale_Price || 0) > 0 &&
    Number(service.Sale_Price || 0) < 100;

  useEffect(() => {
    setImageSrc(primaryImage);
    setHideImage(false);
  }, [primaryImage]);

  const handleBookService = useCallback(() => {
    const currentSelection = readStoredBookingFlowSelection();
    const result = addServiceToBookingSelection(
      currentSelection,
      service.Id_services,
    );
    const nextSelection = result.selection;

    writeStoredBookingFlowSelection(nextSelection);
    router.push(
      buildBookingFlowHref(2, nextSelection, {
        notice:
          result.status === "duplicate"
            ? "service_duplicate"
            : result.status === "limit"
              ? "service_limit"
              : result.status === "added"
                ? "service_added"
                : undefined,
      }),
    );
  }, [router, service.Id_services]);

  return (
    <article className="col-span-1 group relative min-h-[480px] sm:min-h-[560px] md:min-h-[620px] lg:min-h-[720px]">
      <div className="relative z-10 flex h-full flex-col overflow-hidden rounded-[2.5rem] border border-[#DCEAF7] bg-white text-slate-900 shadow-[0_20px_50px_rgba(15,23,42,0.08)] transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_28px_70px_rgba(15,23,42,0.14)]">
        <div className="relative h-[220px] sm:h-[260px] lg:h-[300px] overflow-hidden bg-white">
          {hideImage ? (
            <div className="absolute inset-0 bg-white" />
          ) : (
            <img
              alt=""
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
              src={imageSrc}
              onError={() => {
                if (imageSrc !== fallbackImage && fallbackImage) {
                  setImageSrc(fallbackImage);
                  return;
                }
                setHideImage(true);
              }}
            />
          )}
          {!hideImage ? (
            <div className="absolute inset-0 bg-gradient-to-t from-[#003366]/60 via-[#003366]/10 to-transparent" />
          ) : null}
          <div className="absolute left-5 top-5 flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-[#D6E5F3] bg-white px-3 py-1 text-[11px] font-bold tracking-[0.02em] text-[#003366] shadow-[0_6px_16px_rgba(15,23,42,0.04)]">
              {service.category_name || "Dịch vụ"}
            </span>
            <span className="rounded-full border border-[#DCEAF7] bg-[#EEF6FD] px-3 py-1 text-[11px] font-semibold text-[#0B3C6D] shadow-[0_6px_16px_rgba(15,23,42,0.04)]">
              {service.Duration_time || 0} phút
            </span>
          </div>
          {hasSale ? (
            <div className="absolute right-5 top-5 rounded-2xl border border-[#FFE4A6] bg-white px-3 py-2 text-right text-[#D97706] shadow-lg">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em]">
                Giảm
              </p>
              <p className="text-xl font-black leading-none">
                -{Number(service.Sale_Price || 0)}%
              </p>
            </div>
          ) : null}
        </div>

        <div className="relative z-20 -mt-4 sm:-mt-6 flex flex-1 flex-col rounded-t-[2rem] bg-white p-8">
          <div className="flex-grow">
            <h3
              className="mb-4 text-[1.5rem] sm:text-[1.8rem] md:text-[2.2rem] lg:text-[2.5rem] font-extrabold leading-[0.98] tracking-[-0.03em] text-[#031B34]"
              style={{
                display: "-webkit-box",
                WebkitBoxOrient: "vertical",
                WebkitLineClamp: 2,
                overflow: "hidden",
              }}
            >
              {service.Name}
            </h3>
            <p
              className="mb-6 text-sm sm:text-base font-medium leading-7 text-slate-600"
              style={{
                display: "-webkit-box",
                WebkitBoxOrient: "vertical",
                WebkitLineClamp: 3,
                overflow: "hidden",
              }}
            >
              {description}
            </p>
          </div>

          <div className="mt-auto border-t border-[#E7EEF7] pt-6">
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Giá dịch vụ
                </p>
                <div className="mt-1 flex items-end gap-3">
                  <span className="text-3xl sm:text-4xl font-black leading-[0.95] sm:leading-none text-[#003366]">
                    {formatPriceK(discountedPrice)}
                  </span>
                  {hasSale ? (
                    <span className="pb-1 text-sm font-medium text-slate-400 line-through">
                      {formatPriceK(service.Price)}
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#EAF4FF] text-[#0B3C6D] shadow-sm transition-colors duration-300">
                <span className="material-symbols-outlined text-3xl">
                  calendar_month
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleBookService}
              className="flex w-full items-center justify-center gap-3 rounded-2xl bg-[#003366] px-6 py-4 sm:py-5 text-sm sm:text-base font-black uppercase tracking-[0.14em] text-white shadow-lg transition-all duration-300 hover:bg-[#33B1FA]"
            >
              Đặt lịch
              <span className="material-symbols-outlined text-xl font-black">
                arrow_forward
              </span>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

type ServiceWindowProps = {
  services: BookingHomeSingleService[];
  columns: number;
  gap: number;
  fallbackStartIndex: number;
  className?: string;
  style?: CSSProperties;
};

function ServiceWindow({
  services,
  columns,
  gap,
  fallbackStartIndex,
  className = "",
  style,
}: ServiceWindowProps) {
  return (
    <div
      className={`grid ${className}`.trim()}
      style={{
        gap: `${gap}px`,
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        ...style,
      }}
    >
      {services.map((service, index) => (
        <div key={service.Id_services} className="flex min-w-0">
          <SingleServiceCard
            service={service}
            fallbackImage={
              SERVICE_FALLBACKS[
                (fallbackStartIndex + index) % SERVICE_FALLBACKS.length
              ]
            }
          />
        </div>
      ))}
    </div>
  );
}

function HomeServiceSkeleton() {
  return (
    <>
      <section className="py-16 sm:py-20 lg:py-24 bg-background-alt overflow-hidden">
        <div className="mx-auto max-w-container px-4 sm:px-6 lg:px-8">
          <div className="h-12 w-80 rounded-xl bg-gray-200 animate-pulse mb-8" />
          <div className="grid grid-cols-12 gap-6 sm:gap-8 lg:gap-10">
            <div className="col-span-12 lg:col-span-6 min-h-[680px] rounded-[2.5rem] bg-gray-200 animate-pulse" />
            <div className="col-span-12 md:col-span-6 lg:col-span-3 min-h-[680px] rounded-[3rem] bg-gray-200 animate-pulse" />
            <div className="col-span-12 md:col-span-6 lg:col-span-3 min-h-[680px] rounded-[3rem] bg-gray-200 animate-pulse" />
            <div className="col-span-12 min-h-[340px] rounded-[2.5rem] bg-gray-200 animate-pulse" />
          </div>
        </div>
      </section>
      <section className="py-16 sm:py-20 lg:py-24 bg-white overflow-hidden">
        <div className="mx-auto max-w-container px-4 sm:px-6 lg:px-8">
          <div className="h-12 w-96 rounded-xl bg-gray-200 animate-pulse mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 lg:gap-10">
            <div className="min-h-[720px] rounded-[2.5rem] bg-gray-200 animate-pulse" />
            <div className="min-h-[720px] rounded-[2.5rem] bg-gray-200 animate-pulse" />
            <div className="min-h-[720px] rounded-[2.5rem] bg-gray-200 animate-pulse" />
          </div>
        </div>
      </section>
      <section className="py-16 sm:py-20 lg:py-24 bg-[#031B34] overflow-hidden">
        <div className="mx-auto max-w-container px-4 sm:px-6 lg:px-8">
          <div className="h-12 w-72 rounded-xl bg-white/10 animate-pulse mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8">
            <div className="min-h-[440px] rounded-[2rem] bg-white/10 animate-pulse" />
            <div className="min-h-[440px] rounded-[2rem] bg-white/10 animate-pulse" />
            <div className="min-h-[440px] rounded-[2rem] bg-white/10 animate-pulse" />
          </div>
        </div>
      </section>
    </>
  );
}

export default function HomeServiceShowcase() {
  const router = useRouter();
  const [data, setData] = useState<BookingHomeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedServiceCategory, setSelectedServiceCategory] = useState("all");
  const [visibleServiceCount, setVisibleServiceCount] = useState(1);
  const [serviceGap, setServiceGap] = useState(24);
  const [serviceStartIndex, setServiceStartIndex] = useState(0);
  const [serviceTransition, setServiceTransition] = useState<{
    nextIndex: number;
    direction: "next" | "prev";
  } | null>(null);
  const serviceMotionTimeoutRef = useRef<number | null>(null);

  const loadData = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }

      const payload = await fetchBookingHomeSections();
      setData(payload);
      setError("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Không thể tải dữ liệu dịch vụ."
      );
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void loadData(true);
  }, [loadData]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const source = new EventSource(`${API_BASE}/api/realtime/booking-updates`);
    const refreshFromRealtime = () => {
      void loadData(false);
    };

    source.addEventListener("booking-content", refreshFromRealtime);
    source.onerror = () => {
      // Keep page usable even if SSE disconnects; polling effect below will sync data.
    };

    return () => {
      source.removeEventListener("booking-content", refreshFromRealtime);
      source.close();
    };
  }, [loadData]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const interval = window.setInterval(() => {
      void loadData(false);
    }, 5_000);

    const onFocus = () => {
      void loadData(false);
    };
    window.addEventListener("focus", onFocus);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [loadData]);

  const hairCombos = data?.sections.hair.combos ?? [];
  const relaxCombos = data?.sections.relax.combos ?? [];
  const singleServices = data?.singleServices ?? [];

  const hairShowcase = selectShowcaseCombos(hairCombos, [
    {
      key: "hero",
      preferredId: 5,
      preferredName: "Shine Cut Premium",
      fallbackIndex: 0,
    },
    { key: "uon", preferredId: 6, fallbackIndex: 1 },
    { key: "nhuom", preferredId: 7, fallbackIndex: 2 },
    { key: "banner", preferredId: 11, fallbackIndex: 3 },
  ]);
  const relaxShowcase = selectShowcaseCombos(relaxCombos, [
    { key: "goi", preferredId: 8, fallbackIndex: 0 },
    { key: "rayTai", preferredId: 9, fallbackIndex: 1 },
    { key: "daMat", preferredId: 10, fallbackIndex: 2 },
  ]);

  const hairHero = hairShowcase.hero ?? null;
  const hairUon = hairShowcase.uon ?? null;
  const hairNhuom = hairShowcase.nhuom ?? null;
  const hairBanner = hairShowcase.banner ?? null;
  const relaxGoi = relaxShowcase.goi ?? null;
  const relaxRayTai = relaxShowcase.rayTai ?? null;
  const relaxDaMat = relaxShowcase.daMat ?? null;
  const serviceCategoryOptions = Array.from(
    singleServices
      .reduce((map, service) => {
        const key = getServiceCategoryKey(service);
        const current = map.get(key);

        if (current) {
          current.total += 1;
          return map;
        }

        map.set(key, {
          id: key,
          label: getServiceCategoryLabel(service),
          total: 1,
          order: Number(service.Id_category || Number.MAX_SAFE_INTEGER),
        });
        return map;
      }, new Map<string, { id: string; label: string; total: number; order: number }>())
      .values()
  ).sort((left, right) => {
    if (left.order !== right.order) {
      return left.order - right.order;
    }

    return left.label.localeCompare(right.label, "vi");
  });
  const featuredSingleServices =
    selectedServiceCategory === "all"
      ? singleServices
      : singleServices.filter(
          (service) => getServiceCategoryKey(service) === selectedServiceCategory
        );
  const selectedServiceCategoryLabel =
    selectedServiceCategory === "all"
      ? "Tất cả dịch vụ"
      : serviceCategoryOptions.find(
          (category) => category.id === selectedServiceCategory
        )?.label || "Tất cả dịch vụ";
  const maxServiceStartIndex = Math.max(
    featuredSingleServices.length - visibleServiceCount,
    0
  );
  const visibleServiceWindow = featuredSingleServices.slice(
    serviceStartIndex,
    serviceStartIndex + visibleServiceCount
  );
  const visibleServiceEndIndex = Math.min(
    serviceStartIndex + visibleServiceWindow.length,
    featuredSingleServices.length
  );
  const incomingServiceWindow = serviceTransition
    ? featuredSingleServices.slice(
        serviceTransition.nextIndex,
        serviceTransition.nextIndex + visibleServiceCount
      )
    : [];
  const serviceGridColumns = Math.max(
    1,
    Math.min(visibleServiceCount, featuredSingleServices.length)
  );
  const heroTitle = splitTitle(hairHero?.Name || "Shine Cut Premium", 2);
  const heroDesc = splitDescription(
    hairHero?.Description ||
      'Combo 10 bước "đế vương". Cắt gội massage thư giãn đỉnh cao, phục hồi năng lượng phái mạnh.'
  );
  const bannerDesc = splitDescription(
    "Lột xác hoàn toàn diện mạo. Đẹp trai chuẩn soái ca chỉ trong 1 lần đến salon."
  );
  const hasServiceCarouselControls =
    featuredSingleServices.length > visibleServiceCount;
  const hasPreviousService = serviceStartIndex > 0;
  const hasNextService = serviceStartIndex < maxServiceStartIndex;
  const serviceProgressLabel =
    featuredSingleServices.length > 0
      ? `${serviceStartIndex + 1}-${visibleServiceEndIndex} / ${featuredSingleServices.length}`
      : "0 / 0";

  const moveToServiceIndex = useCallback(
    (nextIndex: number, direction: "next" | "prev") => {
      if (
        nextIndex === serviceStartIndex ||
        featuredSingleServices.length <= visibleServiceCount ||
        serviceTransition
      ) {
        return;
      }

      if (serviceMotionTimeoutRef.current !== null) {
        return;
      }

      setServiceTransition({ nextIndex, direction });

      serviceMotionTimeoutRef.current = window.setTimeout(() => {
        startTransition(() => {
          setServiceStartIndex(nextIndex);
        });
        setServiceTransition(null);
        serviceMotionTimeoutRef.current = null;
      }, SERVICE_WINDOW_TRANSITION_MS);
    },
    [
      featuredSingleServices.length,
      serviceStartIndex,
      serviceTransition,
      visibleServiceCount,
    ]
  );

  const showPreviousService = useCallback(() => {
    if (!hasPreviousService) {
      return;
    }

    moveToServiceIndex(Math.max(serviceStartIndex - 1, 0), "prev");
  }, [hasPreviousService, moveToServiceIndex, serviceStartIndex]);

  const showNextService = useCallback(() => {
    if (!hasNextService) {
      return;
    }

    moveToServiceIndex(
      Math.min(serviceStartIndex + 1, maxServiceStartIndex),
      "next"
    );
  }, [hasNextService, maxServiceStartIndex, moveToServiceIndex, serviceStartIndex]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const syncVisibleServices = () => {
      const config = getServiceCarouselConfig(window.innerWidth);
      setVisibleServiceCount(config.visibleCount);
      setServiceGap(config.gap);
    };

    syncVisibleServices();
    window.addEventListener("resize", syncVisibleServices);

    return () => {
      window.removeEventListener("resize", syncVisibleServices);
    };
  }, []);

  useEffect(() => {
    if (selectedServiceCategory === "all") return;

    const hasMatchingCategory = singleServices.some(
      (service) => getServiceCategoryKey(service) === selectedServiceCategory
    );

    if (!hasMatchingCategory) {
      setSelectedServiceCategory("all");
    }
  }, [selectedServiceCategory, singleServices]);

  useEffect(() => {
    if (serviceMotionTimeoutRef.current !== null) {
      window.clearTimeout(serviceMotionTimeoutRef.current);
      serviceMotionTimeoutRef.current = null;
    }

    setServiceTransition(null);
    setServiceStartIndex(0);
  }, [selectedServiceCategory]);

  useEffect(() => {
    setServiceStartIndex((currentIndex) =>
      Math.min(currentIndex, maxServiceStartIndex)
    );
  }, [maxServiceStartIndex]);

  useEffect(() => {
    return () => {
      if (serviceMotionTimeoutRef.current !== null) {
        window.clearTimeout(serviceMotionTimeoutRef.current);
      }
    };
  }, []);

  if (loading) return <HomeServiceSkeleton />;

  return (
    <>
      <section className="py-16 sm:py-20 lg:py-24 bg-background-alt overflow-hidden">
        <div className="mx-auto max-w-container px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center lg:items-end justify-between gap-6 mb-8 sm:mb-10 lg:mb-12">
            <div className="max-w-3xl relative text-center lg:text-left">
              <span className="absolute -top-6 left-1/2 -translate-x-1/2 lg:-left-4 lg:translate-x-0 text-6xl sm:text-7xl lg:text-9xl font-black text-gray-200 opacity-60 z-0 select-none tracking-tighter">
                HAIR
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-navy uppercase leading-[0.95] sm:leading-none relative z-10 tracking-tight">
                DỊCH VỤ{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-blue to-navy">
                  TÓC
                </span>
              </h2>
              <div className="h-1.5 w-24 bg-primary mt-4 relative z-10 mx-auto lg:mx-0" />
            </div>
            <div className="flex-shrink-0 relative z-20 w-full lg:w-auto flex justify-center lg:justify-start">
              <Link
                className="group relative z-10 inline-flex items-center gap-3 overflow-hidden rounded-full bg-gradient-to-r from-navy to-[#004a99] px-10 py-4 text-lg font-bold uppercase tracking-wider text-white shadow-[0_8px_30px_rgba(0,51,102,0.25)] ring-1 ring-white/10 transition-all duration-500 ease-out hover:scale-105 hover:shadow-[0_15px_40px_rgba(0,51,102,0.35)] hover:from-navy hover:to-accent-blue"
                href="/combo"
              >
                <span className="relative">Xem thêm</span>
                <span className="material-symbols-outlined relative text-2xl transition-transform duration-500 group-hover:translate-x-1">
                  arrow_forward
                </span>
              </Link>
            </div>
          </div>

          {error ? (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <div className="grid grid-cols-12 gap-6 sm:gap-8 lg:gap-10">
            <div className="col-span-12 lg:col-span-6">
              <div className="group relative cursor-pointer min-h-[420px] sm:min-h-[520px] md:min-h-[600px] lg:min-h-[680px] rounded-[2.5rem] overflow-hidden shadow-heavy service-card-hover bg-navy isolate flex flex-col justify-end">
                <div className="absolute inset-0 z-0">
                  <img
                    alt={hairHero?.Name || "Shine Cut Premium"}
                    className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-110"
                    src={hairHero?.Image_URL || HERO_FALLBACK}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/65 to-transparent opacity-95" />
                </div>
                <div className="relative z-10 p-6 sm:p-8 lg:p-12 w-full flex flex-col h-full justify-end">
                  <div className="absolute top-6 left-6 sm:top-10 sm:left-10">
                    <span className="inline-flex items-center gap-2 px-5 py-2 bg-red-600 text-white font-black text-sm uppercase rounded-xl shadow-lg tracking-wider animate-pulse">
                      <span className="material-symbols-outlined text-lg">local_fire_department</span>{" "}
                      Best Seller
                    </span>
                  </div>
                  <div className="mb-auto mt-12 sm:mt-16 lg:mt-20">
                    <h3 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white uppercase leading-[0.9] tracking-tighter mb-4 drop-shadow-2xl">
                      {heroTitle.first}
                      <br />
                      <span className="text-[#33B1FA] text-shadow-lg">{heroTitle.second || "Premium"}</span>
                    </h3>
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-[#0B325D]/90 p-6 shadow-[0_18px_45px_rgba(0,0,0,0.18)]">
                    <p className="text-white text-base sm:text-lg md:text-xl font-bold leading-relaxed mb-6">
                      <span className="text-[#33B1FA]">{heroDesc.lead}</span>
                      {heroDesc.tail ? " " + heroDesc.tail : ""}
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div>
                        <p className="text-gray-300 text-xs font-bold uppercase tracking-widest mb-1">Giá trọn gói</p>
                        <span className="text-5xl sm:text-6xl font-black text-white tracking-tighter drop-shadow-md">
                          {formatPriceK(hairHero?.Price || 100000)}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => router.push(comboUrl(hairHero))}
                        className="bg-[#33B1FA] text-white hover:bg-[#003366] hover:text-white px-6 sm:px-8 py-4 sm:py-5 rounded-2xl font-black uppercase text-base sm:text-lg md:text-xl transition-all duration-300 flex items-center gap-3 w-full sm:w-auto justify-center group-hover:scale-105"
                      >
                        Xem chi tiết
                        <span className="material-symbols-outlined font-black text-2xl">arrow_forward</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-span-12 md:col-span-6 lg:col-span-3">
              <HairTopCard
                combo={hairUon}
                titleFallback="Uốn tóc định hình"
                descFallback="Tóc đẹp chuẩn form ngay khi thức dậy. Không cần sấy vuốt cầu kỳ."
                imageFallback={UON_FALLBACK}
                titleHoverClass="group-hover:text-[#0066CC]"
                titleAccentClass="text-[#4F46E5]"
                tailAccentClass="text-[#33B1FA]"
              />
            </div>

            <div className="col-span-12 md:col-span-6 lg:col-span-3">
              <HairTopCard
                combo={hairNhuom}
                titleFallback="Nhuộm thời trang"
                descFallback="Màu chuẩn salon, bảo vệ tóc tối đa. Lên màu cực chất, khẳng định cá tính."
                imageFallback={NHUOM_FALLBACK}
                titleHoverClass="group-hover:text-[#9333EA]"
                titleAccentClass="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-500"
                tailAccentClass="text-purple-600"
              />
            </div>

            <div className="col-span-12 mt-4">
              <div className="relative overflow-hidden rounded-[2.5rem] bg-navy min-h-[260px] sm:min-h-[320px] md:min-h-[340px] flex flex-col justify-center shadow-float border-4 border-white/10 group cursor-pointer service-card-hover">
                <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy-light to-blue-900" />
                <img
                  className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-overlay group-hover:scale-105 transition-transform duration-1000"
                  src={hairBanner?.Image_URL || BANNER_FALLBACK}
                  alt={hairBanner?.Name || "Cắt + Uốn + Nhuộm"}
                />
                <div className="relative z-10 p-6 sm:p-8 lg:p-12 flex flex-col lg:flex-row items-center justify-between h-full gap-6 sm:gap-8 lg:gap-10">
                  <div className="flex-1 text-center lg:text-left z-20">
                    <div className="inline-flex items-center gap-3 mb-6 justify-center lg:justify-start">
                      <span className="bg-red-600 text-white font-black px-4 py-2 rounded-lg text-sm uppercase shadow-lg border border-white/10 animate-pulse">
                        Combo Hot Nhất
                      </span>
                      <span className="text-primary font-bold text-sm uppercase tracking-widest bg-white/10 px-3 py-2 rounded-lg border border-white/10">
                        Tiết kiệm tới 20%
                      </span>
                    </div>
                    <h3 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white uppercase mb-4 leading-[0.95] sm:leading-none tracking-tight drop-shadow-lg">
                      {hairBanner?.Name || "Cắt + Uốn + Nhuộm"}
                    </h3>
                    <p className="text-white/90 font-bold text-base sm:text-lg md:text-xl max-w-1xl mx-auto lg:mx-0">
                      {bannerDesc.lead}{" "}
                      <span className="text-primary">{bannerDesc.tail}</span>
                    </p>
                  </div>
                  <div className="flex-shrink-0 relative z-20 w-full lg:w-auto">
                    <button
                      type="button"
                      onClick={() => router.push(comboUrl(hairBanner))}
                      className="w-full lg:w-auto bg-[#33B1FA]/20 text-[#F9F506] font-black px-8 sm:px-10 lg:px-12 py-4 sm:py-5 lg:py-6 rounded-2xl uppercase tracking-wide transition-all flex items-center justify-center gap-4 text-base sm:text-lg md:text-xl transform group-hover:-translate-y-2 duration-300 hover:bg-[#FFD700] hover:text-[#000080] hover:scale-105"
                    >
                      XEM CHI TIẾT
                      <span className="material-symbols-outlined font-black text-3xl">
                        arrow_forward
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20 lg:py-24 bg-white relative overflow-hidden">
        <div className="absolute top-40 left-0 w-1/3 h-1/2 bg-green-50/50 rounded-full blur-[100px] -z-10" />
        <div className="absolute bottom-0 right-0 w-1/3 h-1/2 bg-teal-50/50 rounded-full blur-[100px] -z-10" />
        <div className="mx-auto max-w-container px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-end justify-between gap-6 mb-8 sm:mb-10 lg:mb-12">
            <div className="max-w-4xl relative">
              <span className="absolute -top-6 -left-4 text-6xl sm:text-7xl lg:text-9xl font-black text-green-100 opacity-60 z-0 select-none tracking-tighter">
                RELAX
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-navy uppercase leading-[0.95] sm:leading-none relative z-10 tracking-tight">
                THƯ GIÃN &amp;{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-teal-500">
                  CHĂM SÓC DA
                </span>
              </h2>
              <div className="h-1.5 w-24 bg-green-500 mt-4 relative z-10" />
            </div>
            <div className="flex-shrink-0 relative z-20">
              <Link
                className="group relative z-10 inline-flex items-center gap-3 overflow-hidden rounded-full bg-gradient-to-r from-navy to-[#004a99] px-10 py-4 text-lg font-bold uppercase tracking-wider text-white shadow-[0_8px_30px_rgba(0,51,102,0.25)] ring-1 ring-white/10 transition-all duration-500 ease-out hover:scale-105 hover:shadow-[0_15px_40px_rgba(0,51,102,0.35)] hover:from-navy hover:to-teal-600"
                href="/combo"
              >
                <span className="relative">Xem thêm</span>
                <span className="material-symbols-outlined relative text-2xl transition-transform duration-500 group-hover:translate-x-1">
                  arrow_forward
                </span>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 lg:gap-10">
            <RelaxCard
              combo={relaxGoi}
              titleFallback="Gội dưỡng sinh"
              descFallback="Massage bấm huyệt cổ vai gáy chuyên sâu 30 phút. Đánh tan đau mỏi, tái tạo năng lượng tức thì."
              imageFallback={GOI_FALLBACK}
              badgeText="Phục hồi"
              badgeColor="bg-green-600"
              lineColor="bg-green-500"
              accentColor="text-green-600"
              icon="self_improvement"
              circleIcon="spa"
              buttonHoverClass="hover:bg-green-600"
            />
            <RelaxCard
              combo={relaxRayTai}
              titleFallback="Lấy ráy tai êm"
              descFallback='Kỹ thuật độc quyền "phê" quên lối về. Dụng cụ 1 lần, vệ sinh tuyệt đối an toàn cho bạn.'
              imageFallback={RAYTAI_FALLBACK}
              badgeText="Sạch sâu"
              badgeColor="bg-blue-600"
              lineColor="bg-blue-500"
              accentColor="text-blue-600"
              icon="clean_hands"
              circleIcon="flight"
              buttonHoverClass="hover:bg-blue-600"
            />
            <RelaxCard
              combo={relaxDaMat}
              titleFallback="Chăm sóc da mặt"
              descFallback="Combo hút mụn, tẩy da chết, đắp mặt nạ lạnh. Da sáng mịn, đầy sức sống chỉ sau 20 phút."
              imageFallback={DAMAT_FALLBACK}
              badgeText="Trị liệu"
              badgeColor="bg-teal-600"
              lineColor="bg-teal-500"
              accentColor="text-teal-600"
              icon="face"
              circleIcon="water_drop"
              buttonHoverClass="hover:bg-teal-600"
            />
          </div>
        </div>
      </section>

      {featuredSingleServices.length > 0 ? (
        <section className="relative overflow-visible bg-background-alt py-16 sm:py-20 lg:py-24">
          <div className="relative z-10 mx-auto max-w-container px-4 sm:px-6 lg:px-8">
            <div className="mb-8 flex flex-col gap-6 lg:mb-12 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <span className="inline-flex items-center gap-2 rounded-full border border-[#D7E8F7] bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-[#0B3C6D] shadow-sm">
                  Trải nghiệm nổi bật
                </span>
                <h2 className="mt-5 text-3xl font-black uppercase leading-[0.95] tracking-tight text-[#003366] sm:text-4xl md:text-5xl lg:text-6xl">
                  DỊCH VỤ
                </h2>
                <div className="mt-4 h-1.5 w-24 rounded-full bg-[#33B1FA]" />
              </div>

              <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
                <div className="min-w-0 sm:min-w-[240px] lg:min-w-[280px]">
                  <label
                    htmlFor="service-category-filter"
                    className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-[#6B85A3]"
                  >
                    Chọn danh mục
                  </label>
                  <div>
                    <select
                      id="service-category-filter"
                      value={selectedServiceCategory}
                      onChange={(event) =>
                        setSelectedServiceCategory(event.target.value)
                      }
                      className="h-14 w-full rounded-2xl border border-[#D6E5F3] bg-white px-4 text-sm font-semibold text-[#003366] shadow-[0_10px_24px_rgba(15,23,42,0.06)] outline-none transition-all duration-300 focus:border-[#0B3C6D] focus:ring-2 focus:ring-[#D9ECFA]"
                    >
                      <option value="all">
                        Tất cả dịch vụ ({singleServices.length})
                      </option>
                      {serviceCategoryOptions.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.label} ({category.total})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {hasServiceCarouselControls ? (
                  <div className="hidden">
                    <button
                      type="button"
                      aria-label="Dịch vụ trước"
                      onClick={showPreviousService}
                      className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#D6E5F3] bg-[#F3F8FC] text-[#003366] shadow-[0_8px_18px_rgba(15,23,42,0.05)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#0B3C6D] hover:bg-[#E7F1FB] active:scale-95 sm:h-14 sm:w-14"
                    >
                      <span className="material-symbols-outlined text-[24px] font-black sm:text-[28px]">
                        chevron_left
                      </span>
                    </button>
                    <button
                      type="button"
                      aria-label="Dịch vụ tiếp theo"
                      onClick={showNextService}
                      className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#D6E5F3] bg-[#F3F8FC] text-[#003366] shadow-[0_8px_18px_rgba(15,23,42,0.05)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#0B3C6D] hover:bg-[#E7F1FB] active:scale-95 sm:h-14 sm:w-14"
                    >
                      <span className="material-symbols-outlined text-[24px] font-black sm:text-[28px]">
                        chevron_right
                      </span>
                    </button>
                  </div>
                ) : null}

                <Link
                  className="inline-flex items-center justify-center gap-3 rounded-full bg-[#003366] px-8 py-4 text-sm font-black uppercase tracking-[0.18em] text-white shadow-[0_16px_40px_rgba(0,51,102,0.18)] transition-all duration-300 hover:bg-[#33B1FA]"
                  href={serviceBookingUrl}
                >
                  Đặt lịch ngay
                  <span className="material-symbols-outlined text-xl">arrow_forward</span>
                </Link>
              </div>
            </div>

            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-[#EAF4FF] px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-[#0B3C6D]">
                Đang xem
              </span>
              <span className="text-sm font-semibold text-[#4B627D]">
                {selectedServiceCategoryLabel} ({featuredSingleServices.length} dịch vụ)
              </span>
              </div>
              {hasServiceCarouselControls ? (
                <div className="hidden items-center gap-3 rounded-full border border-[#D6E5F3] bg-white px-4 py-2 text-sm font-semibold text-[#4B627D] shadow-[0_10px_24px_rgba(15,23,42,0.06)] sm:flex">
                  <span className="text-[#003366]">{serviceProgressLabel}</span>
                  <div className="h-1.5 w-20 overflow-hidden rounded-full bg-[#EAF4FF]">
                    <div
                      className="h-full rounded-full bg-[#33B1FA] transition-all duration-300"
                      style={{
                        width: `${
                          featuredSingleServices.length > 0
                            ? (visibleServiceEndIndex /
                                featuredSingleServices.length) *
                              100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              ) : null}
            </div>

            <div className="relative">
              {hasServiceCarouselControls ? (
                <div className="pointer-events-none absolute inset-x-0 top-1/2 z-30 flex -translate-y-1/2 items-center justify-between px-2 sm:px-4 lg:px-6">
                  <button
                    type="button"
                    aria-label="Dịch vụ trước"
                    onClick={showPreviousService}
                    disabled={!hasPreviousService}
                    className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-[1.35rem] border border-[#D6E5F3] bg-white text-[#003366] shadow-[0_16px_34px_rgba(15,23,42,0.12)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#0B3C6D] hover:bg-[#F7FBFF] active:scale-95 disabled:pointer-events-none disabled:border-[#E7EEF7] disabled:bg-[#F7FAFD] disabled:text-[#A2B4C9] disabled:shadow-none sm:h-14 sm:w-14"
                  >
                    <span className="material-symbols-outlined text-[24px] font-black sm:text-[28px]">
                      chevron_left
                    </span>
                  </button>
                  <button
                    type="button"
                    aria-label="Dịch vụ tiếp theo"
                    onClick={showNextService}
                    disabled={!hasNextService}
                    className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-[1.35rem] border border-[#D6E5F3] bg-white text-[#003366] shadow-[0_16px_34px_rgba(15,23,42,0.12)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#0B3C6D] hover:bg-[#F7FBFF] active:scale-95 disabled:pointer-events-none disabled:border-[#E7EEF7] disabled:bg-[#F7FAFD] disabled:text-[#A2B4C9] disabled:shadow-none sm:h-14 sm:w-14"
                  >
                    <span className="material-symbols-outlined text-[24px] font-black sm:text-[28px]">
                      chevron_right
                    </span>
                  </button>
                </div>
              ) : null}

              <ServiceWindow
                services={visibleServiceWindow}
                columns={serviceGridColumns}
                gap={serviceGap}
                fallbackStartIndex={serviceStartIndex}
                className={`relative z-10 will-change-transform ${
                  serviceTransition ? "pointer-events-none" : ""
                }`}
                style={
                  serviceTransition
                    ? {
                        animation:
                          serviceTransition.direction === "next"
                            ? `serviceWindowExitNext ${SERVICE_WINDOW_TRANSITION_MS}ms cubic-bezier(0.22, 1, 0.36, 1) both`
                            : `serviceWindowExitPrev ${SERVICE_WINDOW_TRANSITION_MS}ms cubic-bezier(0.22, 1, 0.36, 1) both`,
                      }
                    : undefined
                }
              />

              {serviceTransition ? (
                <ServiceWindow
                  services={incomingServiceWindow}
                  columns={serviceGridColumns}
                  gap={serviceGap}
                  fallbackStartIndex={serviceTransition.nextIndex}
                  className="pointer-events-none absolute inset-0 z-20 will-change-transform"
                  style={{
                    animation:
                      serviceTransition.direction === "next"
                        ? `serviceWindowEnterNext ${SERVICE_WINDOW_TRANSITION_MS}ms cubic-bezier(0.22, 1, 0.36, 1) both`
                        : `serviceWindowEnterPrev ${SERVICE_WINDOW_TRANSITION_MS}ms cubic-bezier(0.22, 1, 0.36, 1) both`,
                  }}
                />
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      <style jsx>{`
        @keyframes serviceWindowEnterNext {
          from {
            opacity: 0.22;
            transform: translate3d(24px, 0, 0) scale(0.995);
          }
          to {
            opacity: 1;
            transform: translate3d(0, 0, 0) scale(1);
          }
        }

        @keyframes serviceWindowEnterPrev {
          from {
            opacity: 0.22;
            transform: translate3d(-24px, 0, 0) scale(0.995);
          }
          to {
            opacity: 1;
            transform: translate3d(0, 0, 0) scale(1);
          }
        }

        @keyframes serviceWindowExitNext {
          from {
            opacity: 1;
            transform: translate3d(0, 0, 0) scale(1);
          }
          to {
            opacity: 0.22;
            transform: translate3d(-24px, 0, 0) scale(0.995);
          }
        }

        @keyframes serviceWindowExitPrev {
          from {
            opacity: 1;
            transform: translate3d(0, 0, 0) scale(1);
          }
          to {
            opacity: 0.22;
            transform: translate3d(24px, 0, 0) scale(0.995);
          }
        }
      `}</style>
    </>
  );
}
