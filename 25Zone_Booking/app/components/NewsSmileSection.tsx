"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { fetchNewsList, getNewsExcerpt, normalizeNewsImage, type BookingNewsItem } from "@/lib/news";

function FeatureCard({ item }: { item: BookingNewsItem }) {
  return (
    <Link
      href={`/tintuc/${encodeURIComponent(item.Slug)}`}
      className="group col-span-1 md:col-span-2 lg:col-span-2 block"
    >
      <div className="flex h-full flex-col overflow-hidden rounded-3xl bg-white shadow-card transition-all duration-300 hover:shadow-heavy">
        <div className="relative h-[220px] overflow-hidden sm:h-[260px] md:h-[300px]">
          <img
            alt={item.Title}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            src={normalizeNewsImage(item.Thumbnail)}
          />
          <div className="absolute left-4 top-4 rounded bg-navy px-3 py-1 text-xs font-bold uppercase text-white">
            {item.Name_category_news || "Câu chuyện 25Zone"}
          </div>
        </div>
        <div className="flex flex-grow flex-col justify-between p-8">
          <div>
            <h3 className="mb-4 text-2xl font-black leading-tight text-navy transition-colors group-hover:text-accent-blue">
              {item.Title}
            </h3>
            <p className="mb-6 text-base leading-relaxed text-gray-500">
              {getNewsExcerpt(item.Content, 260)}
            </p>
          </div>
          <span className="inline-flex items-center text-sm font-bold uppercase tracking-wider text-navy transition-colors group-hover:text-primary">
            Đọc chi tiết
            <span className="material-symbols-outlined ml-1 text-lg">arrow_right_alt</span>
          </span>
        </div>
      </div>
    </Link>
  );
}

function SmallCard({ item }: { item: BookingNewsItem }) {
  return (
    <Link href={`/tintuc/${encodeURIComponent(item.Slug)}`} className="group col-span-1 block">
      <div className="flex h-full flex-col overflow-hidden rounded-3xl bg-white shadow-card transition-all duration-300 hover:shadow-heavy">
        <div className="relative h-[180px] overflow-hidden sm:h-[200px]">
          <img
            alt={item.Title}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            src={normalizeNewsImage(item.Thumbnail)}
          />
        </div>
        <div className="flex flex-grow flex-col justify-between p-6">
          <h3 className="mb-3 line-clamp-2 text-xl font-bold leading-tight text-navy transition-colors group-hover:text-accent-blue">
            {item.Title}
          </h3>
          <p className="mb-4 line-clamp-3 text-sm text-gray-500">
            {getNewsExcerpt(item.Content, 120)}
          </p>
          <span className="inline-flex items-center gap-1 text-xs font-bold uppercase text-navy transition-colors group-hover:text-primary">
            Xem thêm
            <span className="material-symbols-outlined text-[20px] leading-none">arrow_right_alt</span>
          </span>
        </div>
      </div>
    </Link>
  );
}

function NewsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
      <div className="col-span-1 h-[420px] animate-pulse rounded-3xl bg-white md:col-span-2 lg:col-span-2" />
      <div className="col-span-1 h-[420px] animate-pulse rounded-3xl bg-white" />
      <div className="col-span-1 h-[420px] animate-pulse rounded-3xl bg-white" />
    </div>
  );
}

export default function NewsSmileSection() {
  const [items, setItems] = useState<BookingNewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await fetchNewsList({ page: 1, limit: 4 });
        if (!active) return;
        setItems(response.items);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Không thể tải dữ liệu tin tức.");
      } finally {
        if (!active) return;
        setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, []);

  const feature = items[0] || null;
  const sideItems = useMemo(() => items.slice(1, 3), [items]);

  return (
    <section className="bg-background-alt py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-container px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-navy text-white">
              <span className="material-symbols-outlined text-3xl">sentiment_satisfied_alt</span>
            </span>
            <h2 className="text-4xl font-black uppercase tracking-tight text-navy">Nụ cười dịch vụ</h2>
          </div>
          <Link
            href="/tintuc"
            className="hidden rounded-full border-2 border-[#003366] px-6 py-2 text-sm font-extrabold uppercase text-[#003366] transition-colors hover:border-[#33B1FA] hover:bg-[#33B1FA] hover:text-white md:inline-flex"
          >
            Xem tất cả
          </Link>
        </div>

        {loading && <NewsSkeleton />}

        {!loading && error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-10 text-center text-gray-500">
            Chưa có bài viết tin tức nào.
          </div>
        )}

        {!loading && !error && items.length > 0 && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {feature && <FeatureCard item={feature} />}
            {sideItems.map((item) => (
              <SmallCard key={item.Id_news} item={item} />
            ))}
          </div>
        )}

        <div className="mt-8 md:hidden">
          <Link
            href="/tintuc"
            className="inline-flex w-full items-center justify-center rounded-full border-2 border-[#003366] px-6 py-3 text-sm font-extrabold uppercase text-[#003366] transition-colors hover:border-[#33B1FA] hover:bg-[#33B1FA] hover:text-white"
          >
            Xem tất cả tin tức
          </Link>
        </div>
      </div>
    </section>
  );
}
