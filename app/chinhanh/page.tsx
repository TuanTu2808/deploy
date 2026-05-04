import type { Metadata } from "next";
import BranchFinderPage from "./BranchFinderPage";

export const metadata: Metadata = {
  title: "25Zone - Tìm salon",
};

type SearchParams = {
  [key: string]: string | string[] | undefined;
};

type PageProps = {
  searchParams?: Promise<SearchParams>;
};

const getSingleParam = (value?: string | string[]) =>
  Array.isArray(value) ? value[0] : value;

const toPositivePage = (value?: string | string[]) => {
  const raw = getSingleParam(value) || "";
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return 1;
  return Math.max(1, Math.floor(parsed));
};

export default async function Page({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};

  return (
    <BranchFinderPage
      initialQuery={getSingleParam(params.q) || ""}
      initialCity={getSingleParam(params.city) || ""}
      initialWard={getSingleParam(params.ward) || ""}
      initialSort={getSingleParam(params.sort) || "newest"}
      initialPage={toPositivePage(params.page)}
    />
  );
}
