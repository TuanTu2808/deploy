import { fetchBookingComboCatalog } from "./booking-combo";
import {
  normalizeBookingFlowSelection,
  pruneInactiveBookingFlowSelection,
  type BookingFlowSelection,
} from "./booking-flow-selection";
import { fetchBookingServiceAvailabilityByIds } from "./booking-services";

export const INACTIVE_BOOKING_SELECTION_NOTICE = "inactive_selection";

export const validateBookingFlowSelectionAvailability = async (
  selection: BookingFlowSelection,
) => {
  const normalized = normalizeBookingFlowSelection(selection);

  if (normalized.serviceIds.length === 0 && normalized.comboIds.length === 0) {
    return {
      ...pruneInactiveBookingFlowSelection(normalized),
      canValidate: true,
    };
  }

  try {
    const [serviceAvailability, comboCatalog] = await Promise.all([
      normalized.serviceIds.length > 0
        ? fetchBookingServiceAvailabilityByIds(normalized.serviceIds)
        : Promise.resolve([]),
      normalized.comboIds.length > 0 ? fetchBookingComboCatalog() : Promise.resolve(null),
    ]);

    const activeServiceIds = serviceAvailability
      .filter((service) => service.exists && service.isActive)
      .map((service) => service.id);
    const activeComboIds = normalized.comboIds.filter(id => 
      comboCatalog?.combos.some((combo) => combo.Id_combo === id)
    );
    const result = pruneInactiveBookingFlowSelection(normalized, {
      activeServiceIds,
      activeComboIds,
    });

    return {
      ...result,
      canValidate: true,
    };
  } catch (error) {
    console.error("Khong the xac thuc trang thai booking flow:", error);
    return {
      ...pruneInactiveBookingFlowSelection(normalized),
      canValidate: false,
    };
  }
};
