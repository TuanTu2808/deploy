// app/news/page.tsx
import Link from "next/link";

function cn(...s: Array<string | false | undefined>) {
    return s.filter(Boolean).join(" ");
}

function CategoryChip({ active, children }: { active?: boolean; children: React.ReactNode }) {
    return (
        <button
            type="button"
            className={cn(
                "shrink-0 rounded-full px-4 py-2 text-sm font-extrabold border transition-colors",
                active
                    ? "bg-[#003366] text-white border-[#003366]"
                    : "bg-white text-[#003366] border-gray-200 hover:border-[#33B1FA] hover:text-[#33B1FA]"
            )}
        >
            {children}
        </button>
    );
}

function SidebarLink({
    href,
    title,
    meta,
}: {
    href: string;
    title: string;
    meta: string;
}) {
    return (
        <Link
            href={href}
            className="block rounded-2xl border border-gray-100 p-4 hover:border-[#33B1FA] hover:shadow-sm transition"
        >
            <p className="text-[#003366] font-extrabold line-clamp-2">{title}</p>
            <p className="mt-2 text-xs text-gray-500">{meta}</p>
        </Link>
    );
}


function NewsCard({
    href,
    title,
    excerpt,
    tag,
    img,
    meta,
}: {
    href: string;
    title: string;
    excerpt: string;
    tag: string;
    img: string;
    meta: string;
}) {
    return (
        <Link
            href={href}
            className="group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-shadow"
        >
            <div className="relative">
                <img src={img} alt={title} className="h-48 w-full object-cover sm:h-52" loading="lazy" />
                <div className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-[#003366]">
                    {tag}
                </div>
            </div>

            <div className="p-4 sm:p-5">
                <h3 className="text-[16px] sm:text-[17px] font-extrabold text-[#003366] leading-snug group-hover:text-[#33B1FA] transition-colors line-clamp-2">
                    {title}
                </h3>

                <p className="mt-2 text-sm text-gray-600 leading-relaxed line-clamp-2">
                    {excerpt}
                </p>

                <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
                    <span>{meta}</span>
                    <span className="font-semibold text-[#003366] group-hover:text-[#33B1FA] transition-colors">
                        Đọc →
                    </span>
                </div>
            </div>
        </Link>
    );
}

export default function NewsPage() {
    return (
        <main className="bg-white">
            <section className="mx-auto max-w-[1604px] px-4 sm:px-6 lg:px-6 py-7 sm:py-10">
                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
                    <div>
                        <h1 className="text-[26px] sm:text-[32px] font-black text-[#003366] tracking-tight">
                            Tin tức
                        </h1>
                        <p className="mt-1 text-gray-600">
                            Trang tĩnh minh hoạ layout (không dùng dữ liệu/không filter/search).
                        </p>
                    </div>

                    {/* Search UI minh hoạ (không xử lý) */}
                    <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                        <div className="relative">
                            <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                placeholder="Tìm bài viết… (UI minh hoạ)"
                                className="w-full sm:w-[320px] h-11 pl-11 pr-4 rounded-2xl border border-gray-200 outline-none focus:border-[#33B1FA]"
                            />
                        </div>

                        <button
                            type="button"
                            className="h-11 rounded-2xl border border-gray-200 px-4 font-extrabold text-[#003366] hover:border-[#33B1FA] hover:text-[#33B1FA] transition-colors"
                        >
                            Mới nhất ▾
                        </button>
                    </div>
                </div>

                {/* Category chips (tĩnh) */}
                <div className="mt-5">
                    <div className="flex gap-2 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                        <CategoryChip active>Tất cả</CategoryChip>
                        <CategoryChip>Xu hướng</CategoryChip>
                        <CategoryChip>Kiến thức</CategoryChip>
                        <CategoryChip>Khuyến mãi</CategoryChip>
                        <CategoryChip>Chăm sóc tóc</CategoryChip>
                        <CategoryChip>Sản phẩm</CategoryChip>
                        <CategoryChip>Sự kiện</CategoryChip>
                    </div>
                </div>

                {/* Desktop: main + sidebar */}
                <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Main */}
                    <div className="lg:col-span-8">
                        {/* Featured (tĩnh) */}
                        <Link
                            href="/news/bai-viet-minh-hoa"
                            className="group grid grid-cols-1 md:grid-cols-2 overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-shadow"
                        >
                            <div className="relative">
                                <img
                                    src="https://images.unsplash.com/photo-1520975958225-9f61b677b3dd?auto=format&fit=crop&w=1400&q=80"
                                    alt="Bài nổi bật"
                                    className="h-60 w-full object-cover md:h-full"
                                />
                                <div className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-black text-[#003366]">
                                    Bài nổi bật
                                </div>
                            </div>

                            <div className="p-5 sm:p-6 md:p-7 flex flex-col justify-center">
                                <h2 className="text-[20px] sm:text-[24px] font-black text-[#003366] leading-tight group-hover:text-[#33B1FA] transition-colors">
                                    Bài viết minh hoạ layout tin tức (tĩnh)
                                </h2>
                                <p className="mt-3 text-gray-600 leading-relaxed">
                                    Đây là phần mô tả ngắn để show spacing/typography đúng trên mobile–tablet–desktop.
                                </p>

                                <div className="mt-5 flex flex-wrap gap-3 text-xs text-gray-500">
                                    <span className="rounded-full bg-gray-50 px-3 py-1 border border-gray-100">Xu hướng</span>
                                    <span className="rounded-full bg-gray-50 px-3 py-1 border border-gray-100">07/02/2026</span>
                                    <span className="rounded-full bg-gray-50 px-3 py-1 border border-gray-100">6 phút đọc</span>
                                </div>

                                <div className="mt-6">
                                    <span className="inline-flex items-center justify-center rounded-full bg-[#003366] px-5 py-2 text-white font-extrabold tracking-wide text-sm group-hover:bg-[#33B1FA] transition-colors">
                                        Đọc ngay
                                    </span>
                                </div>
                            </div>
                        </Link>

                        {/* Grid cards (tĩnh) */}
                        <div className="mt-7 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                            <NewsCard
                                href="/news/bai-viet-minh-hoa"
                                tag="Kiến thức"
                                title="Wax vs Clay: chọn sao cho tóc không bết?"
                                excerpt="Card minh hoạ line-clamp 2, spacing đều, hover nhẹ."
                                meta="06/02/2026 • 5 phút"
                                img="https://images.unsplash.com/photo-1517832606294-6e0b6c1c49f0?auto=format&fit=crop&w=1400&q=80"
                            />
                            <NewsCard
                                href="/news/bai-viet-minh-hoa"
                                tag="Khuyến mãi"
                                title="Ưu đãi cuối tuần: combo cắt + gội + tạo kiểu"
                                excerpt="Bài viết minh hoạ kiểu news ngắn gọn."
                                meta="05/02/2026 • 3 phút"
                                img="https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1400&q=80"
                            />
                            <NewsCard
                                href="/news/bai-viet-minh-hoa"
                                tag="Chăm sóc tóc"
                                title="5 thói quen giúp tóc đỡ rụng, da đầu sạch hơn"
                                excerpt="Tập trung layout đọc dễ, chữ vừa, khoảng cách thoáng."
                                meta="03/02/2026 • 7 phút"
                                img="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1400&q=80"
                            />
                            <NewsCard
                                href="/news/bai-viet-minh-hoa"
                                tag="Sản phẩm"
                                title="Checklist chọn sáp theo chất tóc Việt Nam"
                                excerpt="Tĩnh minh hoạ card + tag + meta."
                                meta="01/02/2026 • 6 phút"
                                img="https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=1400&q=80"
                            />
                            <NewsCard
                                href="/news/bai-viet-minh-hoa"
                                tag="Sự kiện"
                                title="Barber show: tư vấn form mặt & demo tạo kiểu"
                                excerpt="Thêm 1 card để test grid trên tablet/desktop."
                                meta="30/01/2026 • 4 phút"
                                img="https://images.unsplash.com/photo-1536520002442-39764a41e987?auto=format&fit=crop&w=1400&q=80"
                            />
                            <NewsCard
                                href="/news/bai-viet-minh-hoa"
                                tag="Xu hướng"
                                title="Top kiểu tóc gọn nhẹ cho mùa nóng ẩm"
                                excerpt="Minh hoạ tiêu đề dài để test clamp."
                                meta="28/01/2026 • 6 phút"
                                img="https://images.unsplash.com/photo-1520975958225-9f61b677b3dd?auto=format&fit=crop&w=1400&q=80"
                            />
                        </div>

                        {/* Pagination UI minh hoạ */}
                        <div className="mt-8 flex justify-center">
                            <button
                                type="button"
                                className="h-11 px-6 rounded-full font-extrabold tracking-wide border-2 border-[#003366] text-[#003366] hover:bg-[#33B1FA] hover:border-[#33B1FA] hover:text-white transition-all active:scale-95"
                            >
                                Xem thêm (UI)
                            </button>
                        </div>
                    </div>

                    {/* Sidebar (desktop) */}
                    {/* Sidebar (desktop) */}
                    <aside className="hidden lg:block lg:col-span-4">
                        <div className="sticky top-[110px] space-y-6">
                            {/* Danh mục */}
                            <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
                                <h3 className="text-[#003366] font-black text-lg">Danh mục</h3>
                                <div className="mt-4 flex flex-wrap gap-2">
                                    <CategoryChip active>Tất cả</CategoryChip>
                                    <CategoryChip>Xu hướng</CategoryChip>
                                    <CategoryChip>Kiến thức</CategoryChip>
                                    <CategoryChip>Khuyến mãi</CategoryChip>
                                    <CategoryChip>Chăm sóc tóc</CategoryChip>
                                </div>
                            </div>

                            {/* Tin mới (tĩnh) */}
                            <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
                                <h3 className="text-[#003366] font-black text-lg">Tin mới</h3>
                                <div className="mt-4 space-y-3">
                                    <SidebarLink
                                        href="/news/bai-viet-minh-hoa"
                                        title="Top kiểu tóc gọn nhẹ cho mùa nóng ẩm"
                                        meta="07/02/2026 • 6 phút đọc"
                                    />
                                    <SidebarLink
                                        href="/news/bai-viet-minh-hoa"
                                        title="Wax vs Clay: chọn sao cho tóc không bết?"
                                        meta="06/02/2026 • 5 phút đọc"
                                    />
                                    <SidebarLink
                                        href="/news/bai-viet-minh-hoa"
                                        title="Ưu đãi cuối tuần: combo cắt + gội + tạo kiểu"
                                        meta="05/02/2026 • 3 phút đọc"
                                    />
                                </div>
                            </div>

                            {/* Banner/CTA (tĩnh) */}
                            <div className="rounded-3xl overflow-hidden border border-gray-100 shadow-sm">
                                <div className="bg-[#003366] p-6 text-white">
                                    <p className="text-sm font-bold opacity-90">Khuyến mãi</p>
                                    <h3 className="mt-2 text-xl font-black leading-tight">
                                        Giảm 10% khi mua combo tạo kiểu khi mua trực tiếp tại cửa hàng
                                    </h3>
                                    <p className="mt-2 text-sm opacity-90">
                                       Lưu ý: Áp dụng cho mua trực tiếp tại cửa hàng
                                    </p>

                                    <Link
                                        href="/promotions"
                                        className="mt-5 inline-flex h-11 items-center justify-center rounded-full bg-white px-6 font-extrabold text-[#003366] hover:bg-[#33B1FA] hover:text-white transition-colors"
                                    >
                                        Xem ưu đãi
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </aside>

                </div>
            </section>
        </main>
    );
}
