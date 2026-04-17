import Link from "next/link";
import React from "react";
import { calculateBookingDurations } from "@/lib/booking-duration";
import { redirect } from "next/navigation";
import StepQuerySync from "@/app/components/booking_flow/StepQuerySync";
import VoucherSection from "@/app/components/booking_flow/VoucherSection";
import { fetchBookingComboById } from "@/lib/booking-combo";
import {
  INACTIVE_BOOKING_SELECTION_NOTICE,
  validateBookingFlowSelectionAvailability,
} from "@/lib/booking-flow-availability";
import {
  buildBookingFlowHref,
  parseBookingFlowSelection,
} from "@/lib/booking-flow-selection";
import { fetchBookingSalonById } from "@/lib/booking-salons";
import {fetchStylists} from "@/lib/booking-stylist"
import { fetchBookingServicesByIds } from "@/lib/booking-services";

export const metadata = {
  title: "Xac Nhan Thong Tin",
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
  const validationResult = await validateBookingFlowSelectionAvailability(selection);
  if (validationResult.hasChanges) {
    redirect(
      buildBookingFlowHref(2, validationResult.selection, {
        step: 2,
        notice: INACTIVE_BOOKING_SELECTION_NOTICE,
      }),
    );
  }

  const safeSelection = validationResult.selection;
  const selectedStylistId = Number(getParam(params.stylistId));
  const selectedDate = getParam(params.date) ?? "";
  const selectedTime = getParam(params.time) ?? "";

const [selectedSalon, selectedServices, combosRaw,stylists] = await Promise.all([
  fetchBookingSalonById(safeSelection.salonId),
  fetchBookingServicesByIds(safeSelection.serviceIds),
  Promise.all(
    (safeSelection.comboIds || []).map((id) =>
      fetchBookingComboById(id)
    )
  ),
    fetchStylists(safeSelection.salonId ?? 0, selectedDate)
]);
const selectedStylist = stylists?.find(
  (s: any) => Number(s.Id_user) === selectedStylistId
);
console.log("params.stylistId:", params.stylistId);
console.log("selectedStylistId:", selectedStylistId);
const selectedCombos = combosRaw.filter(
  (c): c is NonNullable<typeof c> => c !== null
);

const { totalCustomerDuration, totalStylistDuration } =
  calculateBookingDurations(
    selectedServices,
    selectedServices,
    selectedCombos
  );

console.log("Customer duration:", totalCustomerDuration);
console.log("Stylist duration:", totalStylistDuration);

const selectedItems = [
  ...selectedServices.map((service) => ({
    key: `service-${service.id}`,
    title: service.title,
    price: service.priceValue,
    tone: "slate" as const,
  })),
  ...selectedCombos.map((combo) => ({
    key: `combo-${combo.Id_combo}`,
    title: combo.Name,
    price: Number(combo.Price || 0),
    tone: "amber" as const,
  })),
];
  const total = selectedItems.reduce((sum, item) => sum + item.price, 0);
  const discount = 0;
  const payable = total - discount;

  return (
    <main className="bg-slate-50">
      <StepQuerySync step={4} />
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10 lg:py-12">
        <div className="max-w-6xl mx-auto space-y-5 sm:space-y-8">
          <section className="rounded-3xl bg-white border border-gray-100 p-3 sm:p-6 lg:p-7 shadow-sm">
            <div className="flex flex-col gap-5 sm:gap-6">
              <div className="flex-1">
                <h1 className="mt-1 text-xl sm:text-3xl lg:text-4xl font-black text-slate-900">
                  Xác nhận đặt lịch
                </h1>
                <p className="mt-2 text-[12px] sm:text-base text-slate-600 max-w-2xl hidden sm:block">
                  Vui lòng kiểm tra lại thông tin salon, dịch vụ, combo và thời gian
                  trước khi hoàn tất.
                </p>

                <div className="mt-4 flex w-full items-center gap-2 overflow-x-auto pb-1 sm:overflow-visible lg:justify-between">
                  <Link
                    href={buildBookingFlowHref(1, safeSelection)}
                    className="shrink-0 inline-flex items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-[10px] sm:text-sm lg:text-base lg:px-6 lg:py-3 sm:min-w-[140px] lg:min-w-[210px] font-semibold text-slate-600 hover:border-blue-300 hover:text-blue-700"
                  >
                    1. Salon
                  </Link>
                  <span className="h-px w-4 sm:w-10 lg:w-auto lg:flex-1 lg:mx-2 bg-slate-200 shrink-0" />
                  <Link
                    href={buildBookingFlowHref(2, safeSelection)}
                    className="shrink-0 inline-flex items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-[10px] sm:text-sm lg:text-base lg:px-6 lg:py-3 sm:min-w-[140px] lg:min-w-[210px] font-semibold text-slate-600 hover:border-blue-300 hover:text-blue-700"
                  >
                    2. Dịch vụ
                  </Link>
                  <span className="h-px w-4 sm:w-10 lg:w-auto lg:flex-1 lg:mx-2 bg-slate-200 shrink-0" />
                  <Link
                    href={buildBookingFlowHref(3, safeSelection, {
                      stylistId: selectedStylistId || undefined,
                      date: selectedDate || undefined,
                      time: selectedTime || undefined,
                    })}
                    className="shrink-0 inline-flex items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-[10px] sm:text-sm lg:text-base lg:px-6 lg:py-3 sm:min-w-[140px] lg:min-w-[210px] font-semibold text-slate-600 hover:border-blue-300 hover:text-blue-700"
                  >
                    3. Thời gian
                  </Link>
                  <span className="h-px w-4 sm:w-10 lg:w-auto lg:flex-1 lg:mx-2 bg-slate-200 shrink-0" />
                  <div className="shrink-0 inline-flex items-center justify-center rounded-full border border-blue-300 bg-blue-50 px-4 py-2 text-[11px] sm:text-sm lg:text-base lg:px-6 lg:py-3 sm:min-w-[140px] lg:min-w-[210px] font-semibold text-blue-700">
                    4. Xác nhận
                  </div>
                </div>
              </div>

              <div className="w-full">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex items-start gap-3">
                        <div className="h-12 w-12 shrink-0 rounded-2xl bg-blue-600/10 text-blue-600 flex items-center justify-center">
                          <svg
                            className="h-5 w-5"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                        <div className="space-y-1">
                          <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-700">
                            Salon đã chọn
                          </span>
                          <h2 className="text-base sm:text-xl font-bold text-slate-900">
                            {selectedSalon?.name ?? "Chưa chọn salon"}
                          </h2>
                          <p className="text-[11px] sm:text-sm text-slate-600">
                            {selectedSalon?.address ?? "Vui lòng chọn salon trước."}
                          </p>
                        </div>
                      </div>
                      <Link
                        href={buildBookingFlowHref(3, safeSelection, {
                          stylistId: selectedStylistId || undefined,
                          date: selectedDate || undefined,
                          time: selectedTime || undefined,
                        })}
                        className="inline-flex w-full sm:w-auto items-center justify-center rounded-full border border-blue-600 bg-white px-4 py-2 text-[11px] font-semibold text-blue-600 hover:border-blue-700 hover:text-blue-700"
                      >
                        Đổi thời gian
                      </Link>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-semibold text-slate-600">
                        {selectedDate || "--/--/----"}
                      </span>
                      <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-semibold text-slate-600">
                        {selectedTime || "--:--"}
                      </span>
                      <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-semibold text-slate-600">
                        Stylist: {selectedStylistId === -1 ? "25Zone chọn giúp" : (selectedStylist?.Name_user ?? "Chưa chọn")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <VoucherSection
            total={total}
            selectedItems={selectedItems}
            safeSelection={safeSelection}
            selectedSalon={selectedSalon}
            selectedStylist={selectedStylist}
            selectedStylistId={selectedStylistId}
            selectedDate={selectedDate}
            selectedTime={selectedTime}
            totalStylistDuration={totalStylistDuration}
          />
        </div>
      </div>
    </main>
  );
}
