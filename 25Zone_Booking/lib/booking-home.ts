import { apiUrl, toAbsoluteImageUrl } from "./api";

export type BookingHomeCombo = {
  Id_combo: number;
  Name: string;
  Price: number;
  Duration_time: number;
  Description: string | null;
  Image_URL: string | null;
  category_ids: number[];
  category_names: string[];
  section: "hair" | "relax";
  hair_score: number;
  relax_score: number;
};

export type BookingHomeSingleService = {
  Id_services: number;
  Name: string;
  Price: number;
  Sale_Price: number;
  Duration_time: number;
  Description: string | null;
  Id_category: number;
  category_name: string | null;
  Image_URL: string | null;
};

export type BookingHomeSection = {
  key: "hair" | "relax";
  title: string;
  combos: BookingHomeCombo[];
};

type RawComboResponse = {
  generated_at?: string;
  sections?: {
    hair?: BookingHomeSection;
    relax?: BookingHomeSection;
  };
};

type RawServiceItem = BookingHomeSingleService & {
  Status?: number;
};

export type BookingHomeResponse = {
  generatedAt: string | null;
  singleServices: BookingHomeSingleService[];
  sections: {
    hair: BookingHomeSection;
    relax: BookingHomeSection;
  };
};

const defaultSection = (
  key: "hair" | "relax",
  title: string
): BookingHomeSection => ({
  key,
  title,
  combos: [],
});

export const normalizeHomeCombo = (
  combo: BookingHomeCombo
): BookingHomeCombo => ({
  ...combo,
  Image_URL: toAbsoluteImageUrl(combo.Image_URL),
});

export const normalizeHomeSingleService = (
  service: BookingHomeSingleService
): BookingHomeSingleService => ({
  ...service,
  Image_URL: toAbsoluteImageUrl(service.Image_URL),
});

export const fetchBookingHomeSections = async (): Promise<BookingHomeResponse> => {
  const [comboResponse, serviceResponse] = await Promise.all([
    fetch(apiUrl("/api/booking/home/services"), {
      method: "GET",
      cache: "no-store",
    }),
    fetch(apiUrl("/api/dichvu?paginate=0&status=1"), {
      method: "GET",
      cache: "no-store",
    }),
  ]);

  if (!comboResponse.ok || !serviceResponse.ok) {
    throw new Error("Không thể tải dữ liệu combo dịch vụ.");
  }

  const comboPayload = (await comboResponse
    .json()
    .catch(() => ({}))) as RawComboResponse;
  const servicePayload = (await serviceResponse
    .json()
    .catch(() => [])) as RawServiceItem[];

  const hair =
    comboPayload.sections?.hair ?? defaultSection("hair", "Dịch vụ tóc");
  const relax =
    comboPayload.sections?.relax ??
    defaultSection("relax", "Thư giãn và chăm sóc da");

  return {
    generatedAt: comboPayload.generated_at || null,
    singleServices: Array.isArray(servicePayload)
      ? servicePayload
          .map(normalizeHomeSingleService)
          .filter((service) => service.Id_services > 0)
      : [],
    sections: {
      hair: {
        ...hair,
        combos: Array.isArray(hair.combos)
          ? hair.combos.map(normalizeHomeCombo)
          : [],
      },
      relax: {
        ...relax,
        combos: Array.isArray(relax.combos)
          ? relax.combos.map(normalizeHomeCombo)
          : [],
      },
    },
  };
};
