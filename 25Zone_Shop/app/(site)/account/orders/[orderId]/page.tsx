import Link from "next/link";
import { AccountShell } from "@/app/components/account/AccountShell";

function StatusBadge({ status }: { status: "pending" | "shipping" | "done" | "cancel" }) {
    const map = {
        pending: {
            cls: "bg-amber-50 text-amber-700",
            icon: "fa-clock",
            label: "Chờ xác nhận",
        },
        shipping: {
            cls: "bg-sky-50 text-sky-700",
            icon: "fa-truck-fast",
            label: "Đang giao",
        },
        done: {
            cls: "bg-emerald-50 text-emerald-700",
            icon: "fa-circle-check",
            label: "Hoàn thành",
        },
        cancel: {
            cls: "bg-rose-50 text-rose-700",
            icon: "fa-ban",
            label: "Đã hủy",
        },
    }[status];

    return (
        <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-bold ${map.cls}`}>
            <i className={`fa-solid ${map.icon}`}></i>
            {map.label}
        </span>
    );
}

function Step({ active, title, desc }: { active?: boolean; title: string; desc: string }) {
    return (
        <div className="flex gap-3">
            <div className="mt-0.5">
                <span
                    className={
                        "inline-flex w-6 h-6 items-center justify-center rounded-full border text-xs font-extrabold " +
                        (active
                            ? "bg-[#003366] text-white border-[#003366]"
                            : "bg-white text-gray-400 border-gray-200")
                    }
                >
                    <i className={"fa-solid " + (active ? "fa-check" : "fa-minus")}></i>
                </span>
            </div>
            <div className="min-w-0">
                <p className={"font-extrabold " + (active ? "text-[#003366]" : "text-gray-500")}>{title}</p>
                <p className="text-sm text-gray-500">{desc}</p>
            </div>
        </div>
    );
}

function ProductRow() {
    return (
        <div className="flex gap-4">
            <img
                alt="Sản phẩm"
                className="w-20 h-20 rounded-xl border border-gray-200 object-cover"
                src="/img/image%2077.png"
            />
            <div className="flex-1 min-w-0">
                <p className="font-extrabold text-gray-900 truncate">
                    Sáp Zone Clay - Styling Clay
                </p>
                <p className="text-sm text-gray-600 mt-1">Phân loại: 100g</p>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                    <span className="text-gray-600">
                        Số lượng: <span className="font-semibold text-gray-800">1</span>
                    </span>
                    <span className="text-gray-600">
                        Đơn giá: <span className="font-semibold text-gray-800">350.000đ</span>
                    </span>
                </div>
            </div>

            <div className="text-right hidden sm:block">
                <p className="text-xs text-gray-500">Thành tiền</p>
                <p className="font-extrabold text-[#8b1e1e] tabular-nums">350.000đ</p>
            </div>
        </div>
    );
}

export default async function OrderDetailPage({
    params,
}: {
    params: Promise<{ orderId: string }>;
}) {
    const { orderId } = await params;

    const orderCode = decodeURIComponent(orderId || "ODR-250127");
    const status: "pending" | "shipping" | "done" | "cancel" = "shipping";

    return (
        <main>
            {/* Breadcrumb */}
            <div className="max-w-[1604px] mx-auto px-4 mt-10 text-[15px] sm:text-base text-gray-500">
                <div className="flex flex-wrap items-center gap-2">
                    <Link className="hover:text-[#003366] font-semibold transition" href="/">
                        Trang chủ
                    </Link>
                    <i className="fa-solid fa-chevron-right text-[11px] text-gray-300"></i>
                    <span className="text-gray-700 font-semibold">Tài khoản</span>
                    <i className="fa-solid fa-chevron-right text-[11px] text-gray-300"></i>
                    <Link className="hover:text-[#003366] font-semibold transition" href="/account/orders">
                        Đơn hàng của tôi
                    </Link>
                    <i className="fa-solid fa-chevron-right text-[11px] text-gray-300"></i>
                    <span className="text-gray-700 font-extrabold">#{orderCode}</span>
                </div>
            </div>

            <section className="max-w-[1604px] mx-auto px-4 py-10">
                <AccountShell active="orders">
                    <div className="border border-gray-200 rounded-2xl bg-white shadow-sm overflow-hidden">
                        {/* Header */}
                        <div className="p-6 border-b border-gray-100">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <h3 className="text-lg sm:text-xl font-extrabold text-[#003366]">
                                            Chi tiết đơn hàng <span className="text-gray-900">#{orderCode}</span>
                                        </h3>
                                        <StatusBadge status={status} />
                                    </div>

                                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-600">
                                        <span className="inline-flex items-center gap-2">
                                            <i className="fa-solid fa-calendar text-gray-400"></i>
                                            Ngày đặt: <span className="font-semibold text-gray-800">12/01/2026</span>
                                        </span>
                                        <span className="inline-flex items-center gap-2">
                                            <i className="fa-solid fa-credit-card text-gray-400"></i>
                                            Thanh toán: <span className="font-semibold text-gray-800">COD</span>
                                        </span>
                                        <span className="inline-flex items-center gap-2">
                                            <i className="fa-solid fa-truck text-gray-400"></i>
                                            Vận chuyển: <span className="font-semibold text-gray-800">Giao tiêu chuẩn</span>
                                        </span>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-3">
                                    <Link
                                        href="/account/orders"
                                        className="inline-flex items-center justify-center rounded-xl border border-gray-200 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50 transition"
                                    >
                                        <i className="fa-solid fa-arrow-left mr-2"></i>
                                        Quay lại
                                    </Link>
                                    <button className="inline-flex items-center justify-center rounded-xl bg-[#003366] px-4 py-2 text-sm font-extrabold text-white hover:bg-[#002244] transition">
                                        <i className="fa-solid fa-rotate-right mr-2"></i>
                                        Mua lại
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6">
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                                {/* Left */}
                                <div className="lg:col-span-8 space-y-6">
                                    {/* Timeline */}
                                    <div className="border border-gray-200 rounded-2xl p-5">
                                        <h4 className="font-extrabold text-[#003366] flex items-center gap-2">
                                            <i className="fa-solid fa-route text-[#33B1FA]"></i>
                                            Trạng thái đơn hàng
                                        </h4>

                                        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <Step active title="Đã đặt hàng" desc="12/01/2026 • 10:15" />
                                            <Step active title="Đã xác nhận" desc="12/01/2026 • 11:02" />
                                            <Step active title="Đang giao" desc="13/01/2026 • 09:20" />
                                            <Step title="Giao thành công" desc="Dự kiến: 14/01/2026" />
                                        </div>

                                        <div className="mt-4 rounded-xl bg-sky-50 border border-sky-100 p-4 text-sm text-sky-800">
                                            <span className="font-bold">Gợi ý:</span> Bạn có thể theo dõi đơn hàng qua mã vận đơn khi shop cập nhật.
                                        </div>
                                    </div>

                                    {/* Items */}
                                    <div className="border border-gray-200 rounded-2xl p-5">
                                        <div className="flex items-center justify-between gap-3 flex-wrap">
                                            <h4 className="font-extrabold text-[#003366] flex items-center gap-2">
                                                <i className="fa-solid fa-bag-shopping text-[#33B1FA]"></i>
                                                Sản phẩm
                                            </h4>
                                            <span className="text-sm text-gray-500">2 sản phẩm</span>
                                        </div>

                                        <div className="mt-4 space-y-4">
                                            <div className="rounded-2xl border border-gray-100 p-4">
                                                <ProductRow />
                                            </div>
                                            <div className="rounded-2xl border border-gray-100 p-4">
                                                <ProductRow />
                                            </div>
                                        </div>

                                        {/* Mobile total line (vì desktop đã có cột thành tiền) */}
                                        <div className="mt-4 sm:hidden flex items-center justify-between text-sm">
                                            <span className="text-gray-600">Tạm tính</span>
                                            <span className="font-extrabold text-[#8b1e1e] tabular-nums">700.000đ</span>
                                        </div>
                                    </div>

                                    {/* Notes */}
                                    <div className="border border-gray-200 rounded-2xl p-5">
                                        <h4 className="font-extrabold text-[#003366] flex items-center gap-2">
                                            <i className="fa-solid fa-note-sticky text-[#33B1FA]"></i>
                                            Ghi chú đơn hàng
                                        </h4>
                                        <p className="mt-3 text-sm text-gray-600">
                                            (Tĩnh minh hoạ) Giao giờ hành chính. Nếu không liên hệ được xin gọi lại sau.
                                        </p>
                                    </div>
                                </div>

                                {/* Right */}
                                <div className="lg:col-span-4 space-y-6">
                                    <div className="lg:sticky lg:top-24 space-y-6">
                                        {/* Address */}
                                        <div className="border border-gray-200 rounded-2xl p-5">
                                            <h4 className="font-extrabold text-[#003366] flex items-center gap-2">
                                                <i className="fa-solid fa-location-dot text-[#33B1FA]"></i>
                                                Địa chỉ nhận hàng
                                            </h4>

                                            <div className="mt-3 text-sm text-gray-700 space-y-1">
                                                <p className="font-extrabold text-gray-900">Nguyễn Văn A</p>
                                                <p>0901 234 567</p>
                                                <p className="text-gray-600">
                                                    12 Nguyễn Trãi, P. Bến Thành, Q.1, TP.HCM
                                                </p>
                                            </div>
                                        </div>

                                        {/* Payment */}
                                        <div className="border border-gray-200 rounded-2xl p-5">
                                            <h4 className="font-extrabold text-[#003366] flex items-center gap-2">
                                                <i className="fa-solid fa-wallet text-[#33B1FA]"></i>
                                                Thanh toán
                                            </h4>
                                            <div className="mt-3 text-sm text-gray-700 space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-gray-600">Phương thức</span>
                                                    <span className="font-extrabold text-gray-900">COD</span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-gray-600">Trạng thái</span>
                                                    <span className="font-extrabold text-amber-700">Chưa thanh toán</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Totals */}
                                        <div className="border border-gray-200 rounded-2xl p-5">
                                            <h4 className="font-extrabold text-[#003366] flex items-center gap-2">
                                                <i className="fa-solid fa-receipt text-[#33B1FA]"></i>
                                                Tổng thanh toán
                                            </h4>

                                            <div className="mt-4 space-y-3 text-sm">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-gray-600">Tạm tính</span>
                                                    <span className="font-semibold text-gray-900 tabular-nums">700.000đ</span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-gray-600">Phí vận chuyển</span>
                                                    <span className="font-semibold text-gray-900 tabular-nums">30.000đ</span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-gray-600">Giảm giá</span>
                                                    <span className="font-semibold text-emerald-700 tabular-nums">-20.000đ</span>
                                                </div>

                                                <div className="h-px bg-gray-200" />

                                                <div className="flex items-center justify-between">
                                                    <span className="text-gray-700 font-extrabold">Tổng</span>
                                                    <span className="font-extrabold text-[#8b1e1e] text-lg tabular-nums">
                                                        710.000đ
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
                                                <button className="w-full rounded-xl bg-[#003366] px-4 py-3 text-sm font-extrabold text-white hover:bg-[#002244] transition">
                                                    <i className="fa-solid fa-headset mr-2"></i>
                                                    Liên hệ hỗ trợ
                                                </button>
                                                <button className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm font-extrabold text-gray-700 hover:bg-gray-50 transition">
                                                    <i className="fa-solid fa-file-arrow-down mr-2"></i>
                                                    Tải hóa đơn (UI)
                                                </button>
                                            </div>

                                            {/* Nút hủy chỉ là UI demo */}
                                            <button className="mt-3 w-full rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-extrabold text-rose-700 hover:bg-rose-100 transition">
                                                <i className="fa-solid fa-xmark mr-2"></i>
                                                Hủy đơn (UI)
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <p className="text-sm text-gray-500">
                                * Trang tĩnh minh hoạ. Sau này chỉ cần thay data bằng API theo <b>orderId</b>.
                            </p>
                            <div className="flex gap-3">
                                <Link
                                    href="/products"
                                    className="inline-flex items-center justify-center rounded-xl border border-gray-200 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50 transition"
                                >
                                    Tiếp tục mua sắm
                                </Link>
                                <Link
                                    href="/account/orders"
                                    className="inline-flex items-center justify-center rounded-xl bg-[#003366] px-4 py-2 text-sm font-extrabold text-white hover:bg-[#002244] transition"
                                >
                                    Về danh sách đơn
                                </Link>
                            </div>
                        </div>
                    </div>
                </AccountShell>
            </section>
        </main>
    );
}
