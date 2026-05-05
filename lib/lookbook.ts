import { apiUrl, toAbsoluteImageUrl } from "./api";

export type LookbookItem = {
  title: string;
  desc: string;
  tag: string;
  image: string;
};

export const fetchLookbook = async (): Promise<LookbookItem[]> => {
  try {
    const response = await fetch(apiUrl("/api/bosuutap"), {
      method: "GET",
      cache: "no-store", 
    });

    if (!response.ok) {
      throw new Error("Không thể tải danh sách bộ sưu tập.");
    }

    const payload = await response.json();
    if (!Array.isArray(payload)) return [];

    return payload.map((item: any) => ({
      ...item,
      image: toAbsoluteImageUrl(item.image) || "/image 11.png",
    }));
  } catch (error) {
    console.error("Không thể tải bộ sưu tập từ database:", error);
    return [];
  }
};
