import { NextResponse } from "next/server";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ ok: true }); // Bỏ qua nếu chưa cài api key để khỏi crash
  }

  const formData = await request.formData();
  const file = formData.get("image");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Thiếu ảnh tải lên." }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "Ảnh vượt quá 5MB." }, { status: 413 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString("base64");
    const mimeType = file.type || "image/jpeg";

    const prompt = `Phân tích ảnh này và chỉ trả về "YES" nếu trong ảnh có một khuôn mặt người thật rõ ràng. Trả về "NO" nếu ảnh là động vật, đồ vật, phong cảnh, hoặc mặt người quá mờ không thể tạo kiểu tóc. Chỉ trả lời 1 chữ YES hoặc NO.`;
    const model = process.env.GEMINI_MODEL || "gemini-flash-latest";

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { inline_data: { mime_type: mimeType, data: base64 } },
                { text: prompt },
              ],
            },
          ],
        }),
      }
    );

    const payload = await response.json();
    const text = payload?.candidates?.[0]?.content?.parts?.[0]?.text?.trim()?.toUpperCase() || "";

    if (text.includes("NO")) {
      return NextResponse.json({ ok: false, error: "Không tìm thấy khuôn mặt người (hoặc ảnh quá mờ). Vui lòng chọn ảnh chụp thẳng rõ mặt." });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    // Bỏ qua lỗi ngầm để không chặn quyền lợi của user nếu AI lỗi đột xuất
    return NextResponse.json({ ok: true });
  }
}
