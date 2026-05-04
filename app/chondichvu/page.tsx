import { redirect } from "next/navigation";
import StepQuerySync from "@/app/components/booking_flow/StepQuerySync";
import BookingServiceSelectionView from "@/app/components/booking_flow/BookingServiceSelectionView";
import { fetchBookingComboCatalog } from "@/lib/booking-combo";
import {
  INACTIVE_BOOKING_SELECTION_NOTICE,
  validateBookingFlowSelectionAvailability,
} from "@/lib/booking-flow-availability";
import {
  buildBookingFlowHref,
  parseBookingFlowSelection,
  type BookingFlowSelection,
} from "@/lib/booking-flow-selection";
import { fetchBookingSalonById } from "@/lib/booking-salons";
import { fetchBookingServices } from "@/lib/booking-services";

export const metadata = {
  title: "Chon Dich Vu",
};

type SearchParams = {
  [key: string]: string | string[] | undefined;
};

type PageProps = {
  searchParams?: Promise<SearchParams>;
};

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

  const initialNotice = Array.isArray(params.notice) ? params.notice[0] : params.notice;
  const safeSelection = validationResult.selection as BookingFlowSelection;

  const [selectedSalon, services, comboCatalog] = await Promise.all([
    fetchBookingSalonById(safeSelection.salonId),
    fetchBookingServices(),
    fetchBookingComboCatalog(),
  ]);
const selectedCombos = comboCatalog.combos.filter((combo) =>
  safeSelection.comboIds?.includes(combo.Id_combo)
);

  return (
    <main className="bg-slate-50">
      <StepQuerySync step={2} />
      <div className="mx-auto max-w-7xl px-3 py-6 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
        <div className="mx-auto max-w-6xl space-y-5 sm:space-y-8">
          <BookingServiceSelectionView
            services={services}
            combos={comboCatalog.combos}
            selectedSalon={selectedSalon}
            initialSelection={safeSelection}
            initialSelectedCombos={selectedCombos}
            initialNotice={initialNotice}
          />
        </div>
      </div>
    </main>
  );
}
