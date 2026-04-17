export async function fetchStylists(storeId: number, date?: string) {
  const url = new URL("http://localhost:5001/api/thocat");

  url.searchParams.set("store", String(storeId));

  if (date) {
    url.searchParams.set("date", date);
  }

  console.log("FETCH URL:", url.toString()); // 👈 thêm dòng này

  const res = await fetch(url.toString(), {
    cache: "no-store",
  });

  console.log("STATUS:", res.status); // 👈 thêm

  if (!res.ok) {
    const text = await res.text(); // 👈 đọc lỗi backend
    console.error("API ERROR:", text);
    throw new Error("Failed to fetch stylists");
  }

  return res.json();
}