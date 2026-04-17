import type { Metadata } from "next";
import Link from "next/link";
import { fetchNewsList, getNewsExcerpt, normalizeNewsImage, type BookingNewsItem } from "@/lib/news";

export const metadata: Metadata = {
  title: "25Zone - Nụ cười dịch vụ",
};

function FeaturedArticle({ item }: { item: BookingNewsItem }) {
  return (
    <article className="group grid grid-cols-1 items-center gap-0 lg:grid-cols-12 lg:gap-12">
      <Link
        href={`/tintuc/${encodeURIComponent(item.Slug)}`}
        className="relative overflow-hidden rounded-2xl shadow-lg lg:col-span-8"
      >
        <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/60 to-transparent lg:hidden" />
        <img
          alt={item.Title}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          src={normalizeNewsImage(item.Thumbnail)}
        />
      </Link>

      <div className="flex flex-col justify-center py-6 lg:col-span-4 lg:py-0">
        <div className="mb-4 hidden items-center gap-3 lg:flex">
          <span className="rounded bg-primary px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white">
            {item.Name_category_news || "Tiêu điểm"}
          </span>
          <span className="text-sm font-semibold text-gray-500">Bài #{item.Id_news}</span>
        </div>
        <Link
          href={`/tintuc/${encodeURIComponent(item.Slug)}`}
          className="text-3xl font-black leading-tight text-dark-text transition-colors hover:text-primary lg:text-4xl"
        >
          {item.Title}
        </Link>
        <p className="mb-6 mt-4 text-lg leading-relaxed text-gray-600">
          {getNewsExcerpt(item.Content, 240)}
        </p>
        <Link
          href={`/tintuc/${encodeURIComponent(item.Slug)}`}
          className="group/link mt-2 inline-flex items-center gap-2 text-base font-bold text-primary transition-all hover:gap-3"
        >
          Đọc toàn bộ câu chuyện
          <span className="material-symbols-outlined text-sm transition-transform group-hover/link:translate-x-1">
            arrow_forward
          </span>
        </Link>
      </div>
    </article>
  );
}

function LargeNewsCard({ item }: { item: BookingNewsItem }) {
  return (
    <article className="group grid cursor-pointer grid-cols-1 gap-6 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md md:col-span-2 lg:col-span-2 md:grid-cols-2">
      <Link href={`/tintuc/${encodeURIComponent(item.Slug)}`} className="h-64 overflow-hidden md:h-full">
        <img
          alt={item.Title}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          src={normalizeNewsImage(item.Thumbnail)}
        />
      </Link>
      <div className="flex flex-col justify-center p-6 md:p-8">
        <div className="mb-3 flex items-center gap-3 text-xs font-bold uppercase tracking-wider">
          <span className="rounded bg-blue-50 px-2 py-1 text-secondary">
            {item.Name_category_news || "Tin tức"}
          </span>
          <span className="text-gray-400">Bài #{item.Id_news}</span>
        </div>
        <Link
          href={`/tintuc/${encodeURIComponent(item.Slug)}`}
          className="mb-3 text-2xl font-bold leading-tight text-dark-text transition-colors hover:text-primary"
        >
          {item.Title}
        </Link>
        <p className="mb-4 line-clamp-3 leading-relaxed text-gray-600">{getNewsExcerpt(item.Content, 180)}</p>
        <span className="mt-auto inline-flex items-center text-sm font-bold text-primary">
          Xem chi tiết
          <span className="material-symbols-outlined ml-1 text-sm">arrow_outward</span>
        </span>
      </div>
    </article>
  );
}

function SmallNewsCard({ item }: { item: BookingNewsItem }) {
  return (
    <article className="group flex h-full cursor-pointer flex-col">
      <Link href={`/tintuc/${encodeURIComponent(item.Slug)}`} className="relative mb-4 aspect-[4/3] overflow-hidden rounded-xl bg-gray-100">
        <img
          alt={item.Title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          src={normalizeNewsImage(item.Thumbnail)}
        />
      </Link>
      <div className="flex flex-1 flex-col">
        <Link
          href={`/tintuc/${encodeURIComponent(item.Slug)}`}
          className="mb-2 line-clamp-2 text-xl font-bold leading-snug text-dark-text transition-colors hover:text-primary"
        >
          {item.Title}
        </Link>
        <p className="mb-3 line-clamp-3 text-sm leading-relaxed text-gray-500">
          {getNewsExcerpt(item.Content, 120)}
        </p>
        <div className="mt-auto flex items-center justify-between text-xs font-medium text-gray-400">
          <span>Bài #{item.Id_news}</span>
          <span className="transition-colors group-hover:text-primary">Đọc thêm</span>
        </div>
      </div>
    </article>
  );
}

export default async function Page() {
  let items: BookingNewsItem[] = [];
  let errorMessage = "";

  try {
    const response = await fetchNewsList({ page: 1, limit: 9 });
    items = response.items;
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : "Không thể tải dữ liệu tin tức.";
  }

  const featured = items[0] || null;
  const large = items[1] || null;
  const smallCards = items.slice(2, 7);

  return (
    <>
      <div className="border-b border-gray-100 bg-white pb-12 pt-16">
        <div className="container mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-20">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
            <div>
              <span className="mb-3 block text-sm font-bold uppercase tracking-widest text-primary">
                Tạp chí 25Zone
              </span>
              <h1 className="text-5xl font-black uppercase leading-none tracking-tight text-dark-text lg:text-7xl">
                Nụ cười dịch vụ
              </h1>
            </div>
            <p className="hidden max-w-md border-l-4 border-gray-200 pl-6 text-right text-lg font-medium text-gray-500 md:block">
              Những câu chuyện về sự tận tâm, chuyên nghiệp và hành trình kiến tạo niềm tin.
            </p>
          </div>
        </div>
      </div>

      <main className="flex-grow py-12 lg:py-16">
        <div className="container mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-20">
          {errorMessage && (
            <div className="mb-8 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </div>
          )}

          {!errorMessage && featured && (
            <section className="mb-20">
              <FeaturedArticle item={featured} />
            </section>
          )}

          <section>
            <div className="mb-10 flex items-center justify-between">
              <h3 className="border-l-4 border-primary pl-4 text-2xl font-bold uppercase tracking-wide text-dark-text">
                Bài viết mới nhất
              </h3>
            </div>

            {items.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-10 text-center text-gray-500">
                Chưa có bài viết nào để hiển thị.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-x-8 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
                {large && <LargeNewsCard item={large} />}
                {smallCards.map((item) => (
                  <SmallNewsCard key={item.Id_news} item={item} />
                ))}

                <article className="relative col-span-1 flex h-full cursor-pointer flex-col overflow-hidden rounded-xl bg-secondary p-6 text-white lg:col-span-1">
                  <div className="relative z-10 flex h-full flex-col">
                    <span className="mb-4 text-xs font-bold uppercase tracking-widest text-primary">Sứ mệnh</span>
                    <h4 className="mb-4 text-2xl font-black leading-tight">
                      "Tôn vinh đôi bàn tay tài hoa của người thợ Việt."
                    </h4>
                    <p className="mb-6 text-sm leading-relaxed text-blue-100 opacity-90">
                      25Zone luôn lấy trải nghiệm và nụ cười của khách hàng làm trung tâm trong mọi hoạt động phục vụ.
                    </p>
                    <Link href="/gioithieu" className="mt-auto flex items-center gap-2 border-t border-white/20 pt-4 text-sm font-bold">
                      Tìm hiểu về văn hóa 25Zone
                      <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </Link>
                  </div>
                </article>
              </div>
            )}

            <div className="mt-16 text-center">
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-full border-2 border-gray-200 px-8 py-3 font-bold text-dark-text transition-all hover:border-primary hover:text-primary"
              >
                Về trang chủ
                <span className="material-symbols-outlined text-sm">arrow_back</span>
              </Link>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
