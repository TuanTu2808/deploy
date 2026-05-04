import { apiUrl, toAbsoluteImageUrl } from "./api";

export type BookingComboCategory = {
  Id_category_service: number;
  Name: string;
  combo_total: number;
};

export type BookingComboItem = {
  Id_combo: number;
  Name: string;
  Price: number;
  Duration_time: number;
  Status: number;
  Description: string | null;
  feature_lines: string[];
  Image_URL: string | null;
  service_count: number;
  service_names: string[];
  category_ids: number[];
  category_names: string[];
  service_ids: number[]; // 👈 thêm cái này
};

export type BookingComboCatalog = {
  generatedAt: string | null;
  combos: BookingComboItem[];
  categories: BookingComboCategory[];
};

type RawCombo = Partial<BookingComboItem> & {
  category_ids?: number[] | string | null;
  category_names?: string[] | string | null;
  service_names?: string[] | string | null;
  service_ids?: number[] | string | null; 
};

type RawCategory = Partial<BookingComboCategory>;

type RawCatalog = {
  generated_at?: string;
  combos?: RawCombo[];
  categories?: RawCategory[];
};

const parseNumberArray = (value: unknown): number[] => {
  if (Array.isArray(value)) {
    return value
      .map((item) => Number(item))
      .filter((item) => Number.isFinite(item));
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => Number(item.trim()))
      .filter((item) => Number.isFinite(item));
  }

  return [];
};

const parseStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item || "").trim())
      .filter(Boolean);
  }

  if (typeof value === "string") {
    const separator = value.includes("||") ? "||" : ",";
    return value
      .split(separator)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

const normalizeCombo = (combo: RawCombo): BookingComboItem => ({
  Id_combo: Number(combo.Id_combo || 0),
  Name: String(combo.Name || "").trim(),
  Price: Number(combo.Price || 0),
  Duration_time: Number(combo.Duration_time || 0),
  Status: Number(combo.Status || 0),
  Description: combo.Description ? String(combo.Description) : null,
  feature_lines: parseStringArray(combo.feature_lines),
  Image_URL: toAbsoluteImageUrl(combo.Image_URL || null),
  service_count: Number(combo.service_count || 0),
  service_names: parseStringArray(combo.service_names),
service_ids: parseNumberArray((combo as any).service_ids ?? combo.service_ids ?? []),  category_ids: parseNumberArray(combo.category_ids),
  category_names: parseStringArray(combo.category_names),

});

const normalizeCategory = (category: RawCategory): BookingComboCategory => ({
  Id_category_service: Number(category.Id_category_service || 0),
  Name: String(category.Name || "").trim(),
  combo_total: Number(category.combo_total || 0),
});

export const fetchBookingComboCatalog = async (): Promise<BookingComboCatalog> => {
  const response = await fetch(apiUrl("/api/combodichvu/catalog"), {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Không thể tải dữ liệu combo");
  }

  const payload = (await response.json().catch(() => ({}))) as RawCatalog;
  const combos = Array.isArray(payload.combos)
    ? payload.combos.map(normalizeCombo).filter((combo) => combo.Id_combo > 0)
    : [];
  const categories = Array.isArray(payload.categories)
    ? payload.categories
        .map(normalizeCategory)
        .filter((category) => category.Id_category_service > 0 && category.Name)
    : [];

  return {
    generatedAt: payload.generated_at || null,
    combos,
    categories,
  };
};

export const fetchBookingComboById = async (
  comboId?: number | null,
): Promise<BookingComboItem | null> => {
  const normalizedId = Number(comboId);
  if (!Number.isFinite(normalizedId) || normalizedId <= 0) {
    return null;
  }

  try {
    const catalog = await fetchBookingComboCatalog();
    return (
      catalog.combos.find((combo) => combo.Id_combo === Math.floor(normalizedId)) ||
      null
    );
  } catch (error) {
    console.error(`Khong the tai combo #${comboId}:`, error);
    return null;
  }
};
