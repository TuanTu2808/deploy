import Link from "next/link";
import { redirect } from "next/navigation";
import StepQuerySync from "@/app/components/booking_flow/StepQuerySync";
import { formatCurrency } from "@/app/components/booking_flow/bookingData";
import TimeSelectionStep from "@/app/components/booking_flow/TimeSelectionStep";
import { fetchBookingComboById } from "@/lib/booking-combo";
import { calculateBookingDurations } from "@/lib/booking-duration";
import {
  INACTIVE_BOOKING_SELECTION_NOTICE,
  validateBookingFlowSelectionAvailability,
} from "@/lib/booking-flow-availability";
import {
  buildBookingFlowHref,
  parseBookingFlowSelection,
} from "@/lib/booking-flow-selection";
import { fetchBookingSalonById } from "@/lib/booking-salons";
import { fetchBookingServicesByIds } from "@/lib/booking-services";
import { fetchStylists } from "@/lib/booking-stylist";

export const metadata = {
  title: "Chon Thoi Gian",
};

type SearchParams = {
  [key: string]: string | string[] | undefined;
};

type PageProps = {
  searchParams?: Promise<SearchParams>;
};

// MAP API → UI MODEL
function mapStylist(apiData: any[]) {
  return apiData.map((s) => ({
    id: s.Id_user,
    name: s.Name_user,
    image: s.Image,
    times: [],
  }));
}

export default async function Page({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};
  const selection = parseBookingFlowSelection(params);
  const selectedDate =
    typeof params.date === "string"
      ? params.date
      : new Date().toLocaleDateString("en-CA");
  const validationResult =
    await validateBookingFlowSelectionAvailability(selection);

  if (validationResult.hasChanges) {
    redirect(
      buildBookingFlowHref(2, validationResult.selection, {
        step: 2,
        notice: INACTIVE_BOOKING_SELECTION_NOTICE,
      }),
    );
  }

  const safeSelection = validationResult.selection;

  // ===============================
  // 1. FETCH SALON FIRST (IMPORTANT)
  // ===============================
  const selectedSalon = await fetchBookingSalonById(
    safeSelection.salonId,
  );
  console.log(selectedSalon);
  // storeId lấy từ salon đã chọn (KHÔNG fallback cứng nữa)
  const storeId = selectedSalon?.id ?? 3;

  // ===============================
  // 2. FETCH DATA PARALLEL
  // ===============================
  const [rawStylists, selectedServices, combosRaw] =
    await Promise.all([
      fetchStylists(storeId, selectedDate),
      fetchBookingServicesByIds(safeSelection.serviceIds),
      Promise.all(
        (safeSelection.comboIds || []).map((id) =>
          fetchBookingComboById(id)
        )
      )
    ]);

  // 👉 remove null
  const selectedCombos = combosRaw.filter(
    (c): c is NonNullable<typeof c> => c !== null
  );

  const stylists = mapStylist(rawStylists);

  // ===============================
  // 3. stylist selected
  // ===============================
  const selectedStylistId = Number(
    Array.isArray(params.stylistId)
      ? params.stylistId[0]
      : params.stylistId,
  );

  const selectedStylist = stylists.find(
    (s) => s.id === selectedStylistId,
  );

  // ===============================
  // 4. TOTAL PRICE
  // ===============================
  const totalSelectedPrice =
    selectedServices.reduce(
      (sum, service) => sum + service.priceValue,
      0,
    ) + selectedCombos.reduce(
      (sum, combo) => sum + Number(combo.Price || 0),
      0
    );
    const services = await fetchBookingServicesByIds([
  ...safeSelection.serviceIds,
  ...selectedCombos.flatMap(c => c.service_ids)
]);

  const { totalStylistDuration } =
  calculateBookingDurations(
    services,
    selectedServices,
    selectedCombos
  );
  return (
    <main className="bg-slate-50">
      <StepQuerySync step={3} />

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10 lg:py-12">
        <div className="max-w-6xl mx-auto space-y-5 sm:space-y-8">

          {/* ================= HEADER ================= */}
          <section className="rounded-3xl bg-white border border-gray-100 p-3 sm:p-6 lg:p-7 shadow-sm">
            <div className="flex flex-col gap-5 sm:gap-6">

              {/* TITLE */}
              <div>
                <h1 className="mt-1 text-xl sm:text-3xl lg:text-4xl font-black text-slate-900">
                  Chọn thời gian
                </h1>
                <p className="mt-2 text-[12px] sm:text-base text-slate-600 max-w-2xl hidden sm:block">
                  Chọn stylist và khung giờ trống phù hợp để hoàn tất lịch hẹn.
                </p>
                {/* STEPS */}
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

                  <div className="shrink-0 inline-flex items-center justify-center rounded-full border border-blue-300 bg-blue-50 px-4 py-2 text-[11px] sm:text-sm lg:text-base lg:px-6 lg:py-3 sm:min-w-[140px] lg:min-w-[210px] font-semibold text-blue-700">
                    3. Thời gian
                  </div>

                  <span className="h-px w-4 sm:w-10 lg:w-auto lg:flex-1 lg:mx-2 bg-slate-200 shrink-0" />
                  
                  <div className="shrink-0 inline-flex items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-[10px] sm:text-sm lg:text-base lg:px-6 lg:py-3 sm:min-w-[140px] lg:min-w-[210px] font-semibold text-slate-600">
                    4. Xác nhận
                  </div>

                </div>
              </div>

            </div>
          </section>

          {/* ================= TIME STEP WITH CART ================= */}
          <section className="mt-0">
            <TimeSelectionStep
              stylists={stylists}
              initialDate={selectedDate}
              phone={safeSelection.phone}
              salonId={safeSelection.salonId ?? undefined}
              serviceIds={safeSelection.serviceIds}
              comboIds={safeSelection.comboIds}
              safeSelection={safeSelection}
              salon={selectedSalon}
              services={selectedServices}
              combos={selectedCombos}
              totalPrice={totalSelectedPrice}
              duration={totalStylistDuration}
            />
          </section>
        </div>
      </div>
    </main>
  );
}
