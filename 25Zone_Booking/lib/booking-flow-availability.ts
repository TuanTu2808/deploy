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

  if (normalized.serviceIds.length === 0 && !normalized.comboId) {
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
      normalized.comboId ? fetchBookingComboCatalog() : Promise.resolve(null),
    ]);

    const activeServiceIds = serviceAvailability
      .filter((service) => service.exists && service.isActive)
      .map((service) => service.id);
    const activeComboId = normalized.comboId
      ? (comboCatalog?.combos.some((combo) => combo.Id_combo === normalized.comboId)
          ? normalized.comboId
          : null)
      : undefined;
    const result = pruneInactiveBookingFlowSelection(normalized, {
      activeServiceIds,
      activeComboId,
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
