import Link from "next/link";
import { formatCurrency } from "@/app/components/booking_flow/bookingData";
import { fetchBookingComboById } from "@/lib/booking-combo";
import { parseBookingFlowSelection } from "@/lib/booking-flow-selection";
import { fetchBookingSalonById } from "@/lib/booking-salons";
import { fetchBookingServicesByIds } from "@/lib/booking-services";
import { fetchStylists } from "@/lib/booking-stylist";

export const metadata = {
  title: "Đặt lịch thành công | 25ZONE",
};

type SearchParams = {
  [key: string]: string | string[] | undefined;
};

type PageProps = {
  searchParams?: Promise<SearchParams>;
};

const getParam = (value?: string | string[]) =>
  Array.isArray(value) ? value[0] : value;

export default async function Page({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};
  const selection = parseBookingFlowSelection(params);
  const bookingId = getParam(params.bookingId) ?? getParam(params.id) ?? "";
  const selectedStylistId = Number(getParam(params.stylistId));
  const selectedDate = getParam(params.date) ?? "";
  const selectedTime = getParam(params.time) ?? "";

  const [selectedSalon, selectedServices, selectedCombo, stylists] = await Promise.all([
    fetchBookingSalonById(selection.salonId),
    fetchBookingServicesByIds(selection.serviceIds),
    Promise.all(
      (selection.comboIds || []).map((id) =>
        fetchBookingComboById(id)
      )
    ),
    fetchStylists(selection.salonId ?? 0, selectedDate),
  ]);

  const selectedStylistRaw = stylists?.find(
    (stylist: any) => Number(stylist.Id_user) === selectedStylistId,
  );
  
  const selectedStylist = {
    name: selectedStylistRaw ? selectedStylistRaw.Name_user : "25Zone chọn giúp bạn"
  };
  const selectedItems = [
    ...selectedServices.map((service) => ({
      key: `service-${service.id}`,
      title: service.title,
      price: service.priceValue,
    })),
    ...(selectedCombo || [])
      .filter(Boolean)
      .map((combo: any) => ({
        key: `combo-${combo.Id_combo}`,
        title: combo.Name,
        price: Number(combo.Price || 0),
      })),
  ];
  const total = selectedItems.reduce((sum, item) => sum + item.price, 0);

  return (
    <main className="bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="rounded-3xl bg-white border border-gray-100 p-6 sm:p-10 shadow-sm">
          <div className="flex flex-col items-center text-center">
            <div className="h-16 w-16 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <svg
                className="h-8 w-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="mt-5 text-2xl sm:text-3xl font-black text-slate-900">
              Đặt lịch thành công
            </h1>
            <p className="mt-2 text-sm sm:text-base text-slate-600 max-w-2xl">
              Cảm ơn bạn đã đặt lịch tại 25ZONE. Nhân viên sẽ liên hệ xác nhận
              trong thời gian sớm nhất.
            </p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">
                Thông tin lịch hẹn
              </p>
              <div className="mt-3 space-y-2 text-sm text-slate-700">
                <p>
                  <span className="font-semibold">Salon:</span>{" "}
                  {selectedSalon?.name ?? "Chưa có"}
                </p>
                <p>
                  <span className="font-semibold">Stylist:</span>{" "}
                  {selectedStylist?.name ?? "Chưa chọn"}
                </p>
                <p>
                  <span className="font-semibold">Ngày:</span>{" "}
                  {selectedDate || "--/--/----"}
                </p>
                <p>
                  <span className="font-semibold">Giờ:</span>{" "}
                  {selectedTime || "--:--"}
                </p>
                <p>
                  <span className="font-semibold">SĐT:</span>{" "}
                  {selection.phone || "Chưa có"}
                </p>
                {bookingId ? (
                  <p>
                    <span className="font-semibold">Mã đặt lịch:</span>{" "}
                    {bookingId}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">
                Mục đã chọn
              </p>
              <div className="mt-3 space-y-2 text-sm text-slate-700">
                {selectedItems.length > 0 ? (
                  selectedItems.map((item) => <p key={item.key}>{item.title}</p>)
                ) : (
                  <p>Chưa chọn dịch vụ hoặc combo.</p>
                )}
                <p className="font-semibold text-slate-900">
                  Tổng thanh toán: {formatCurrency(total)}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/"
              className="h-11 px-6 rounded-full border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:border-blue-200 flex items-center justify-center"
            >
              Về trang chủ
            </Link>
            <Link
              href={`/chonsalon?step=1${selection.phone ? `&phone=${encodeURIComponent(selection.phone)}` : ""}`}
              className="h-11 px-6 rounded-full bg-blue-900 text-white text-sm font-semibold hover:bg-blue-800 flex items-center justify-center"
            >
              Đặt lịch mới
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
