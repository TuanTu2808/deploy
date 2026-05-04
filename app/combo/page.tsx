import type { Metadata } from "next";
import ComboCatalogPage from "./ComboCatalogPage";

export const metadata: Metadata = {
  title: "25Zone - Trang tất cả combo dịch vụ",
};

type SearchParams = {
  [key: string]: string | string[] | undefined;
};

type PageProps = {
  searchParams?: Promise<SearchParams>;
};

type SortValue = "popular" | "price_asc" | "price_desc" | "newest";

const getSingleParam = (value?: string | string[]) =>
  Array.isArray(value) ? value[0] : value;

const parseSort = (value?: string): SortValue => {
  const raw = String(value || "").trim();
  if (raw === "price_asc" || raw === "price_desc" || raw === "newest") {
    return raw;
  }
  return "popular";
};

const parseCategory = (value?: string) => {
  const raw = String(value || "").trim();
  if (!raw) return "all";
  if (raw === "all") return "all";
  const numeric = Number(raw);
  if (!Number.isFinite(numeric) || numeric <= 0) return "all";
  return String(Math.floor(numeric));
};

const parseComboId = (value?: string) => {
  const numeric = Number(value || "");
  if (!Number.isFinite(numeric) || numeric <= 0) return null;
  return Math.floor(numeric);
};

export default async function Page({ searchParams }: PageProps) {
  const params = (await searchParams) || {};

  return (
    <ComboCatalogPage
      initialSort={parseSort(getSingleParam(params.sort))}
      initialCategory={parseCategory(getSingleParam(params.category))}
      initialQuery={String(getSingleParam(params.q) || "")}
      initialComboId={parseComboId(getSingleParam(params.comboId))}
    />
  );
}
