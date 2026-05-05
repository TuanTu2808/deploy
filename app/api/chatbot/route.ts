import { NextResponse } from "next/server";
import { fetchBookingServices } from "@/lib/booking-services";
import { fetchBookingSalons } from "@/lib/booking-salons";
import { fetchBookingComboCatalog } from "@/lib/booking-combo";

export const runtime = "nodejs";

export async function POST(request: Request) {
    try {
        const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "AIzaSyCrRGNxfMe9C8NBafPC7dNcq5CjAqJuT1w";
        if (!apiKey) {
            return NextResponse.json(
                { error: "Missing GEMINI_API_KEY or GOOGLE_API_KEY in environment." },
                { status: 500 }
            );
        }

        const body = await request.json();
        let messages = body.messages || [];

        // Nếu có Authorization header (người dùng đã đăng nhập), lấy lịch sử đặt lịch
        let bookingHistoryText = "Khách CHƯA ĐĂNG NHẬP nên không thể có lịch sử đặt lịch.";
        const authHeader = request.headers.get("Authorization");
        const isLoggedIn = !!authHeader;
        if (isLoggedIn) {
            try {
                const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.25zone.io.vn";
                const historyRes = await fetch(`${apiBase}/api/datlich/me`, {
                    headers: { Authorization: authHeader }
                });
                if (historyRes.ok) {
                    const data = await historyRes.json();
                    const bookings = data.bookings || [];
                    if (bookings.length > 0) {
                        bookingHistoryText = "LỊCH SỬ ĐẶT LỊCH CỦA KHÁCH HÀNG NÀY (HÃY DÙNG DATA NÀY KHI KHÁCH HỎI VỀ LỊCH CỦA HỌ):\n" + 
                            bookings.slice(0, 5).map((b: any) => 
                                `- Mã lịch: ${b.Booking_code} | Ngày: ${new Date(b.Booking_date).toLocaleDateString("vi-VN")} lúc ${new Date(b.Start_time).toLocaleTimeString("vi-VN", {hour: "2-digit", minute:"2-digit"})} | Salon: ${b.Store_name || "Chưa rõ"} | Stylist: ${b.Stylist_name || "Chưa chọn"} | Trạng thái: ${b.Status} | Tổng tiền: ${b.Total_price?.toLocaleString()}đ | Dịch vụ đã đặt: ${b.Services_preview?.join(", ")}`
                            ).join("\n");
                    } else {
                        bookingHistoryText = "Khách hàng này ĐÃ ĐĂNG NHẬP nhưng chưa từng đặt lịch nào trước đây.";
                    }
                }
            } catch (e) {
                console.error("Failed to fetch booking history for AI context", e);
            }
        }

        // Filter out the initial welcome message to avoid sequence errors
        messages = messages.filter((msg: any) => msg.id !== "welcome");

        if (!Array.isArray(messages) || messages.length === 0) {
            return NextResponse.json({ error: "Missing messages" }, { status: 400 });
        }

        // Lấy data thực tế từ các modules để inject vào Context
        // Để gọi song song cho nhanh
        const [services, salons, comboCatalog] = await Promise.all([
            fetchBookingServices(),
            fetchBookingSalons(),
            fetchBookingComboCatalog(),
        ]);

        // Format dữ liệu cho gọn, tránh vượt quá giới hạn token, NHỚ TRUYỀN ID
        const formattedServices = services
            .slice(0, 15)
            .map((s) => `- ID ${s.id}: ${s.title} (${s.priceValue.toLocaleString()}đ)`)
            .join("\n");

        const formattedSalons = salons
            .slice(0, 10)
            .map((s) => `- ID ${s.id}: ${s.name} (${s.address})`)
            .join("\n");

        const formattedCombos = comboCatalog.combos
            .slice(0, 5)
            .map((c) => `- ID ${c.Id_combo}: ${c.Name} (${c.Price.toLocaleString()}đ)`)
            .join("\n");

        const systemPrompt = `Bạn là trợ lý ảo AI của 25Zone.
Nhiệm vụ: Tư vấn dịch vụ, chi nhánh, combo và giúp khách đặt lịch, tra cứu lịch sử đặt lịch.
QUAN TRỌNG NHẤT: BẠN PHẢI LUÔN LUÔN TRẢ VỀ DỮ LIỆU DƯỚI DẠNG JSON. KHÔNG ĐƯỢC TRẢ VỀ TEXT THƯỜNG.
Định dạng JSON bắt buộc:
{
  "reply": "Câu trả lời của bạn gửi cho khách hàng...",
  "bookingContext": {
    "salonId": null,
    "serviceIds": [],
    "comboIds": []
  }
}

TRẠNG THÁI KHÁCH HÀNG HIỆN TẠI: ${isLoggedIn ? "ĐÃ ĐĂNG NHẬP" : "CHƯA ĐĂNG NHẬP"}

Hướng dẫn điền JSON:
- "reply": Câu trả lời của bạn. Nếu khách có ý định đặt lịch, hãy chèn chính xác chuỗi "/chonsalon" vào cuối câu reply.
- NẾU khách YÊU CẦU TRA CỨU LỊCH SỬ nhưng họ CHƯA ĐĂNG NHẬP: Bạn PHẢI yêu cầu họ đăng nhập bằng cách chèn chính xác chuỗi "/yeucaudangnhap" vào cuối câu reply. (VD: "Dạ, để mình xem được lịch sử, bạn vui lòng đăng nhập trước nhé! /yeucaudangnhap")
- "bookingContext": Dựa vào cuộc hội thoại, nếu khách ĐÃ CHỌN hoặc BẠN ĐÃ GỢI Ý một chi nhánh cụ thể, hãy điền ID của chi nhánh đó vào "salonId" (số nguyên). Nếu khách đã chọn dịch vụ hoặc combo, hãy điền ID của chúng vào "serviceIds" (mảng số nguyên) và "comboIds" (mảng số nguyên). Nếu chưa xác định được, để null hoặc mảng rỗng [].

THÔNG TIN LỊCH SỬ KHÁCH HÀNG:
${bookingHistoryText}

DỮ LIỆU DỊCH VỤ CƠ BẢN (Dùng ID này cho serviceIds):
${formattedServices}

DỮ LIỆU COMBO NỔI BẬT (Dùng ID này cho comboIds):
${formattedCombos}

DỮ LIỆU CHI NHÁNH CHÍNH (Dùng ID này cho salonId):
${formattedSalons}

Ví dụ mẫu bạn PHẢI tuân thủ:
{"reply": "Dạ bên mình uốn tóc nam Hàn Quốc giá 250k ạ. Mình đặt lịch luôn ở quận 1 nhé? /chonsalon", "bookingContext": {"salonId": 1, "serviceIds": [5], "comboIds": []}}
`;

        // Chuyển đổi định dạng message của mình sang định dạng của Gemini
        const formattedHistory = messages.map((msg: any) => ({
            role: msg.role === "assistant" ? "model" : "user",
            parts: [{ text: msg.content }],
        }));

        const contents = [
            {
                role: "user",
                parts: [{ text: `[SYSTEM INSTRUCTIONS: ${systemPrompt}]` }],
            },
            {
                role: "model",
                parts: [{ text: `{"reply": "Tôi đã hiểu! Tôi sẽ luôn trả về JSON hợp lệ."}` }],
            },
            ...formattedHistory
        ];

        const model = process.env.GEMINI_MODEL || "gemini-flash-latest";

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents,
                    generationConfig: {
                        response_mime_type: "application/json",
                    }
                }),
            }
        );

        const payload = await response.json();

        if (!response.ok) {
            console.error("Gemini Chatbot Error:", payload);
            return NextResponse.json(
                { error: "Lỗi từ Gemini: " + JSON.stringify(payload) },
                { status: 502 }
            );
        }

        const rawText = payload.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

        try {
            const aiData = JSON.parse(rawText);
            return NextResponse.json({
                reply: aiData.reply || "Xin lỗi, mình chưa hiểu ý bạn.",
                bookingContext: aiData.bookingContext || null
            });
        } catch (e) {
            console.error("Failed to parse Gemini JSON:", rawText);
            return NextResponse.json({ reply: rawText.replace(/```json|```/g, '').trim() });
        }
    } catch (error: any) {
        console.error("Chatbot exception:", error);
        return NextResponse.json(
            { error: "Lỗi hệ thống: " + (error?.message || String(error)) },
            { status: 500 }
        );
    }
}
