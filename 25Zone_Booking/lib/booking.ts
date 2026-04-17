export async function fetchBookingById(bookingId: number, token?: string) {
  if (!bookingId) return null;

  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || "http://localhost:5001";
  
  const res = await fetch(
    `${baseUrl}/api/datlich/me/${bookingId}`,
    {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      cache: "no-store",
    }
  );

  if (!res.ok) return null;

  const data = await res.json();
  return data || null;
}