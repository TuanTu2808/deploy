// app/news/[slug]/page.tsx
import Link from "next/link";

function titleFromSlug(slug: string) {
    const s = decodeURIComponent(slug || "bai-viet-minh-hoa").replace(/-/g, " ");
    return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function NewsDetailPage({ params }: { params: { slug: string } }) {
    const title = titleFromSlug(params.slug);

    return (
        <main className="bg-white">
            <article className="mx-auto max-w-[1604px] px-4 sm:px-6 lg:px-6 py-7 sm:py-10">
                {/* Breadcrumb */}
                <div className="text-sm text-gray-500">
                    <Link href="/" className="hover:text-[#33B1FA]">Trang chủ</Link>
                    <span className="mx-2">/</span>
                    <Link href="/news" className="hover:text-[#33B1FA]">Tin tức</Link>
                    <span className="mx-2">/</span>
                    <span className="text-gray-700 line-clamp-1">{title}</span>
                </div>

                {/* Title */}
                <h1 className="mt-4 text-[26px] sm:text-[36px] font-black text-[#003366] leading-tight">
                    {title} (template tĩnh)
                </h1>

                <div className="mt-3 flex flex-wrap gap-3 text-xs text-gray-500">
                    <span className="rounded-full bg-gray-50 px-3 py-1 border border-gray-100">Xu hướng</span>
                    <span className="rounded-full bg-gray-50 px-3 py-1 border border-gray-100">07/02/2026</span>
                    <span className="rounded-full bg-gray-50 px-3 py-1 border border-gray-100">6 phút đọc</span>
                    <span className="rounded-full bg-gray-50 px-3 py-1 border border-gray-100">25Zone Editor</span>
                </div>

                {/* Cover */}
                <div className="mt-6 overflow-hidden rounded-3xl border border-gray-100 shadow-sm">
                    <img
                        src="https://images.unsplash.com/photo-1520975958225-9f61b677b3dd?auto=format&fit=crop&w=1600&q=80"
                        alt={title}
                        className="w-full h-[240px] sm:h-[420px] object-cover"
                    />
                </div>

                {/* Content layout */}
                <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Main content */}
                    <div className="lg:col-span-8">
                        <p className="text-gray-700 leading-relaxed text-[15px] sm:text-[16px]">
                            Đây là nội dung minh hoạ để test typography, spacing, list, callout…
                            Trang này không phụ thuộc dữ liệu; slug nào cũng hiển thị cùng template.
                        </p>

                        <div className="mt-6 space-y-4 text-gray-700 leading-relaxed">
                            <h2 className="text-[#003366] font-black text-xl mt-6">
                                1) Tiêu đề section minh hoạ
                            </h2>
                            <p>
                                Nội dung đoạn văn minh hoạ. Mục tiêu là đọc dễ trên mobile, và
                                không bị dồn chữ trên desktop.
                            </p>

                            <h2 className="text-[#003366] font-black text-xl mt-6">
                                2) Danh sách gạch đầu dòng
                            </h2>
                            <ul className="list-disc pl-5 space-y-2">
                                <li>Gội sạch da đầu, lau khô khoảng 70% trước khi sấy.</li>
                                <li>Sấy theo hướng form, dùng lượng sáp vừa đủ.</li>
                                <li>Chốt nếp bằng xịt giữ nếp nếu cần.</li>
                            </ul>

                            <div className="mt-8 rounded-3xl border border-gray-100 bg-gray-50 p-6">
                                <p className="text-[#003366] font-extrabold">
                                    Callout minh hoạ (CTA)
                                </p>
                                <p className="mt-1 text-sm text-gray-600">
                                    Box này dùng để test nền, border, padding trên 3 thiết bị.
                                </p>
                                <div className="mt-4 flex flex-wrap gap-3">
                                    <Link
                                        href="/news"
                                        className="inline-flex h-11 items-center justify-center rounded-full bg-[#003366] px-6 text-white font-extrabold hover:bg-[#33B1FA] transition-colors"
                                    >
                                        Quay lại Tin tức
                                    </Link>
                                    <Link
                                        href="/"
                                        className="inline-flex h-11 items-center justify-center rounded-full border-2 border-[#003366] px-6 font-extrabold text-[#003366] hover:bg-[#33B1FA] hover:border-[#33B1FA] hover:text-white transition-colors"
                                    >
                                        Về trang chủ
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <aside className="lg:col-span-4">
                        <div className="sticky top-[110px] space-y-6">
                            <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
                                <h3 className="text-[#003366] font-black text-lg">Bài liên quan</h3>
                                <div className="mt-4 space-y-3">
                                    <Link
                                        href="/news/bai-viet-minh-hoa"
                                        className="block rounded-2xl border border-gray-100 p-4 hover:border-[#33B1FA] hover:shadow-sm transition"
                                    >
                                        <p className="text-[#003366] font-extrabold line-clamp-2">
                                            Bài viết minh hoạ 1 (template)
                                        </p>
                                        <p className="mt-2 text-xs text-gray-500">06/02/2026 • 5 phút</p>
                                    </Link>

                                    <Link
                                        href="/news/bai-viet-minh-hoa"
                                        className="block rounded-2xl border border-gray-100 p-4 hover:border-[#33B1FA] hover:shadow-sm transition"
                                    >
                                        <p className="text-[#003366] font-extrabold line-clamp-2">
                                            Bài viết minh hoạ 2 (template)
                                        </p>
                                        <p className="mt-2 text-xs text-gray-500">03/02/2026 • 7 phút</p>
                                    </Link>

                                    <Link
                                        href="/news/bai-viet-minh-hoa"
                                        className="block rounded-2xl border border-gray-100 p-4 hover:border-[#33B1FA] hover:shadow-sm transition"
                                    >
                                        <p className="text-[#003366] font-extrabold line-clamp-2">
                                            Bài viết minh hoạ 3 (template)
                                        </p>
                                        <p className="mt-2 text-xs text-gray-500">01/02/2026 • 6 phút</p>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </aside>
                </div>
            </article>
        </main>
    );
}
