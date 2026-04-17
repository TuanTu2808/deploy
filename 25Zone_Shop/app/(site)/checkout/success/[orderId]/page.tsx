import Link from "next/link";

function Row({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between gap-4 text-sm">
            <span className="text-gray-600">{label}</span>
            <span className="font-extrabold text-gray-900 tabular-nums">{value}</span>
        </div>
    );
}

function ItemRow() {
    return (
        <div className="flex gap-3">
            <img
                src="/img/image%2077.png"
                alt="Sản phẩm"
                className="w-14 h-14 rounded-xl border border-gray-200 object-cover"
            />
            <div className="flex-1 min-w-0">
                <p className="font-extrabold text-gray-900 truncate">Sáp Zone Clay</p>
                <p className="text-xs text-gray-500 mt-1">Phân loại: 100g • SL: 1</p>
            </div>
            <div className="text-right">
                <p className="text-xs text-gray-500">Giá</p>
                <p className="font-extrabold text-[#8b1e1e] tabular-nums">350.000đ</p>
            </div>
        </div>
    );
}

export default async function OrderSuccessPage({
    params,
}: {
    params: Promise<{ orderId: string }>;
}) {
    const { orderId } = await params;
    const orderCode = decodeURIComponent(orderId || "ODR-250127");

    return (
        <main>
            {/* Breadcrumb */}
            <div className="max-w-[1604px] mx-auto px-4 mt-10 text-[15px] sm:text-base text-gray-500">
                <div className="flex flex-wrap items-center gap-2">
                    <Link className="hover:text-[#003366] font-semibold transition" href="/">
                        Trang chủ
                    </Link>
                    <i className="fa-solid fa-chevron-right text-[11px] text-gray-300"></i>
                    <span className="text-gray-700 font-semibold">Thanh toán</span>
                    <i className="fa-solid fa-chevron-right text-[11px] text-gray-300"></i>
                    <span className="text-gray-700 font-extrabold">Đặt hàng thành công</span>
                </div>
            </div>

            <section className="max-w-[1604px] mx-auto px-4 py-10">
                {/* Top success card */}
                <div className="border border-gray-200 rounded-3xl bg-white shadow-sm overflow-hidden">
                    <div className="p-6 sm:p-8 border-b border-gray-100">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                                <i className="fa-solid fa-circle-check text-2xl text-emerald-600"></i>
                            </div>

                            <div className="min-w-0">
                                <h1 className="text-xl sm:text-2xl font-extrabold text-[#003366]">
                                    Đặt hàng thành công!
                                </h1>
                                <p className="mt-1 text-gray-600">
                                    Cảm ơn bạn đã mua hàng. Mã đơn hàng của bạn là{" "}
                                    <span className="font-extrabold text-gray-900">#{orderCode}</span>.
                                </p>
                            </div>

                            <div className="sm:ml-auto flex flex-wrap gap-3">
                                <Link
                                    href={`/account/orders/${encodeURIComponent(orderCode)}`}
                                    className="inline-flex items-center justify-center rounded-xl bg-[#003366] px-5 py-3 text-sm font-extrabold text-white hover:bg-[#002244] transition"
                                >
                                    <i className="fa-solid fa-receipt mr-2"></i>
                                    Xem đơn hàng
                                </Link>

                                <Link
                                    href="/products"
                                    className="inline-flex items-center justify-center rounded-xl border border-gray-200 px-5 py-3 text-sm font-extrabold text-gray-700 hover:bg-gray-50 transition"
                                >
                                    Tiếp tục mua sắm
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Main content */}
                    <div className="p-6 sm:p-8">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                            {/* Left */}
                            <div className="lg:col-span-8 space-y-6">
                                {/* Order info */}
                                <div className="border border-gray-200 rounded-2xl p-5">
                                    <h3 className="font-extrabold text-[#003366] flex items-center gap-2">
                                        <i className="fa-solid fa-info-circle text-[#33B1FA]"></i>
                                        Thông tin đơn hàng
                                    </h3>

                                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div className="rounded-2xl border border-gray-100 p-4">
                                            <Row label="Mã đơn" value={`#${orderCode}`} />
                                            <div className="h-px bg-gray-100 my-3" />
                                            <Row label="Ngày đặt" value="07/02/2026" />
                                            <div className="h-px bg-gray-100 my-3" />
                                            <Row label="Trạng thái" value="Chờ xác nhận" />
                                        </div>

                                        <div className="rounded-2xl border border-gray-100 p-4">
                                            <Row label="Thanh toán" value="COD" />
                                            <div className="h-px bg-gray-100 my-3" />
                                            <Row label="Vận chuyển" value="Giao tiêu chuẩn" />
                                            <div className="h-px bg-gray-100 my-3" />
                                            <Row label="Dự kiến nhận" value="09/02/2026" />
                                        </div>
                                    </div>

                                    <div className="mt-4 rounded-2xl bg-sky-50 border border-sky-100 p-4 text-sm text-sky-800">
                                        <span className="font-extrabold">Lưu ý:</span> Shop sẽ gọi xác nhận trước khi giao. Vui lòng để ý điện thoại nhé.
                                    </div>
                                </div>

                                {/* Shipping address */}
                                <div className="border border-gray-200 rounded-2xl p-5">
                                    <h3 className="font-extrabold text-[#003366] flex items-center gap-2">
                                        <i className="fa-solid fa-location-dot text-[#33B1FA]"></i>
                                        Địa chỉ nhận hàng
                                    </h3>

                                    <div className="mt-3 text-sm text-gray-700 space-y-1">
                                        <p className="font-extrabold text-gray-900">Nguyễn Văn A</p>
                                        <p>0901 234 567</p>
                                        <p className="text-gray-600">
                                            12 Nguyễn Trãi, P. Bến Thành, Q.1, TP.HCM
                                        </p>
                                    </div>
                                </div>

                                {/* Next steps (static) */}
                                <div className="border border-gray-200 rounded-2xl p-5">
                                    <h3 className="font-extrabold text-[#003366] flex items-center gap-2">
                                        <i className="fa-solid fa-route text-[#33B1FA]"></i>
                                        Bước tiếp theo
                                    </h3>

                                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                        <div className="rounded-2xl border border-gray-100 p-4">
                                            <p className="font-extrabold text-gray-900">1) Xác nhận đơn</p>
                                            <p className="text-gray-600 mt-1">Shop xác nhận trong giờ làm việc.</p>
                                        </div>
                                        <div className="rounded-2xl border border-gray-100 p-4">
                                            <p className="font-extrabold text-gray-900">2) Đóng gói & giao hàng</p>
                                            <p className="text-gray-600 mt-1">Cập nhật vận đơn khi bắt đầu giao.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right */}
                            <div className="lg:col-span-4">
                                <div className="lg:sticky lg:top-24 space-y-6">
                                    {/* Summary */}
                                    <div className="border border-gray-200 rounded-2xl p-5">
                                        <h3 className="font-extrabold text-[#003366] flex items-center gap-2">
                                            <i className="fa-solid fa-bag-shopping text-[#33B1FA]"></i>
                                            Tóm tắt đơn hàng
                                        </h3>

                                        <div className="mt-4 space-y-4">
                                            <div className="rounded-2xl border border-gray-100 p-4">
                                                <ItemRow />
                                            </div>
                                            <div className="rounded-2xl border border-gray-100 p-4">
                                                <ItemRow />
                                            </div>
                                        </div>

                                        <div className="mt-5 space-y-3 text-sm">
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

                                        <div className="mt-5 grid gap-3">
                                            <Link
                                                href={`/account/orders/${encodeURIComponent(orderCode)}`}
                                                className="w-full inline-flex items-center justify-center rounded-xl bg-[#003366] px-4 py-3 text-sm font-extrabold text-white hover:bg-[#002244] transition"
                                            >
                                                <i className="fa-solid fa-receipt mr-2"></i>
                                                Xem chi tiết đơn
                                            </Link>


                                            <Link
                                                href="/"
                                                className="w-full inline-flex items-center justify-center rounded-xl border border-gray-200 px-4 py-3 text-sm font-extrabold text-gray-700 hover:bg-gray-50 transition"
                                            >
                                                Về trang chủ
                                            </Link>
                                        </div>
                                    </div>

                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </section>
        </main>
    );
}
