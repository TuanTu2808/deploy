import { apiUrl } from "./api";
import { type LookbookItem } from "@/app/bosuutap/lookbookData";

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
    return Array.isArray(payload) ? payload : [];
  } catch (error) {
    console.error("Không thể tải bộ sưu tập từ database:", error);
    return [];
  }
};
