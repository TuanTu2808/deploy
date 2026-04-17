"use client";

import { useEffect, useState } from "react";

const slides = [
  {
    id: "summer",
    image: "/Immersive Salon Experience.png",
    titlePrimary: "SHINELOOK",
    titleAccent: "SUMMER",
    tagline: "Đẳng cấp phái mạnh - Khẳng định vị thế",
  },
  {
    id: "modern",
    image: "https://wallpaperaccess.com/full/2666350.jpg",
    titlePrimary: "MEN",
    titleAccent: "STYLE",
    tagline: "Chuẩn salon hiện đại cho quý ông bận rộn",
  },
  {
    id: "classic",
    image: "https://tiki.vn/blog/wp-content/uploads/2023/03/tattoo-toc-nam.jpg",
    titlePrimary: "CLASSIC",
    titleAccent: "GENT",
    tagline: "Lịch lãm tinh gọn, nâng tầm phong cách",
  },
];

export default function HeroSlider() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (media.matches) {
      return undefined;
    }

    const id = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, 6000);

    return () => window.clearInterval(id);
  }, []);

  return (
    <section className="w-full font-sans antialiased">
      <div className="mx-auto max-w-[1920px]">
        <div className="relative h-[360px] sm:h-[460px] md:h-[520px] lg:h-[600px] w-full overflow-hidden">
          {slides.map((slide, index) => {
            const isActive = index === activeIndex;
            return (
              <div
                key={slide.id}
                className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                  isActive ? "opacity-100" : "opacity-0 pointer-events-none"
                }`}
              >
                <div className="absolute inset-0 bg-navy/35 z-10"></div>
                <img
                  alt={slide.titlePrimary}
                  className={`h-full w-full object-cover transition-transform duration-[1400ms] ease-out ${
                    isActive ? "scale-100" : "scale-105"
                  }`}
                  src={slide.image}
                />
                <div
                  className={`absolute inset-0 z-20 flex flex-col items-center justify-center text-center px-4 -translate-y-6 sm:-translate-y-8 md:-translate-y-10 lg:-translate-y-12 transition-all duration-1000 ${
                    isActive ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                  }`}
                >
                  <h2
                    className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-[900] uppercase tracking-tighter text-white leading-[0.85]"
                    style={{ filter: "drop-shadow(0px 4px 8px rgba(0, 0, 0, 0.6))" }}
                  >
                    {slide.titlePrimary}
                  </h2>
                  <h2
                    className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-[900] uppercase tracking-tighter text-[#FFD700] leading-[0.85]"
                    style={{ filter: "drop-shadow(0px 4px 8px rgba(0, 0, 0, 0.6))" }}
                  >
                    {slide.titleAccent}
                  </h2>
                  <div className="w-48 md:w-64 border-t border-white/40 mt-6 mb-4"></div>
                  <p
                    className="text-[10px] sm:text-xs md:text-sm font-bold text-white uppercase tracking-[0.2em] sm:tracking-[0.3em]"
                    style={{ filter: "drop-shadow(0px 2px 4px rgba(0, 0, 0, 0.5))" }}
                  >
                    {slide.tagline}
                  </p>
                </div>
              </div>
            );
          })}

          <div className="absolute bottom-5 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2">
            {slides.map((slide, index) => (
              <button
                key={slide.id}
                aria-label={`Chuyển tới slide ${index + 1}`}
                className={`h-2.5 w-2.5 rounded-full border border-white/70 transition-all duration-300 ${
                  index === activeIndex ? "bg-white scale-125" : "bg-white/40"
                }`}
                onClick={() => setActiveIndex(index)}
                type="button"
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}