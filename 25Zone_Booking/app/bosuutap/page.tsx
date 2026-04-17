import type { Metadata } from "next";
import React from "react";
import LookbookAi from "./LookbookAi";
import { fetchLookbook } from "@/lib/lookbook";

export const metadata: Metadata = {
  title: "25Zone - Bộ sưu tập kiểu tóc",
};

export default async function Page() {
  const dynamicLookbook = await fetchLookbook();

  return (
    <main className="bg-background-light">
      <section className="relative overflow-hidden bg-slate-950">
        <div className="absolute inset-0">
          <img
            alt="Hair style collection background"
            className="h-full w-full object-cover opacity-60"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDZEkuRrvtNlvt44BtWgDQbL3-PPIQh3F-12JQovq0VzV989URnuZfGyuzlXqGfkLkpQ5865o5MW3tDnQuD7C8RbmDzIOCDuZdq_yu-BFzUf2L-1BfjeB-NnoVoPRBiGJfitNbiLAE-3tja9x5C2lfp86RgJiXPSaeCmQsbOwhCzug1ZayAy0_jpwB2EKgr3T0i54m_FwkpBDu185K-6eTA_YHXh20Y5HgSlGbrdxf_kj_w6kr75KsihfZJE6wlGyB9ShVKqwRUSLU"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-black/80" />
        </div>
        <div className="relative z-10 max-w-content mx-auto px-4 sm:px-6 py-14 sm:py-18 lg:py-24 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-white/80">
            BỘ SƯU TẬP
          </div>
          <h1 className="mt-4 text-3xl sm:text-4xl lg:text-6xl font-black text-white tracking-tight">
            Bộ sưu tập kiểu tóc nam
          </h1>
          <p className="mt-4 text-sm sm:text-base lg:text-lg text-white/80 max-w-2xl">
            Tuyển chọn các kiểu tóc chuẩn salon, đa phong cách từ cổ điển đến hiện đại. Chọn kiểu phù hợp khuôn mặt và phong cách sống của bạn.
          </p>
        </div>
      </section>

      <LookbookAi />

      <section className="max-w-content mx-auto px-4 sm:px-6 py-10 sm:py-14 lg:py-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
          {dynamicLookbook.map((item, idx) => (
            <article
              key={`${item.title}-${idx}`}
              className="group overflow-hidden rounded-2xl bg-white border border-gray-100 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
            >
              <div className="relative aspect-[4/5] overflow-hidden">
                <img
                  alt={item.title || "Hình ảnh"}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  src={item.image}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <span className="inline-flex items-center rounded-full bg-white/20 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white backdrop-blur-md">
                    {item.tag || "Trending"}
                  </span>
                  <h3 className="mt-2 text-lg sm:text-xl font-bold text-white">
                    {item.title}
                  </h3>
                </div>
              </div>
              <div className="p-4 sm:p-5">
                <p className="text-[13px] sm:text-sm text-gray-600 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
