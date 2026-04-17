import { NextResponse } from "next/server";
import { type LookbookItem } from "@/app/bosuutap/lookbookData";
import { fetchLookbook } from "@/lib/lookbook";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const normalizeText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

const buildSuggestions = (titles: string[], catalogItems: LookbookItem[]) => {
  const normalizedMap = new Map<string, LookbookItem>();
  catalogItems.forEach((item) => {
    normalizedMap.set(normalizeText(item.title), item);
  });

  const picked: LookbookItem[] = [];
  const seen = new Set<string>();

  titles.forEach((title) => {
    const matched = normalizedMap.get(normalizeText(title));
    if (matched && !seen.has(matched.title)) {
      picked.push(matched);
      seen.add(matched.title);
    }
  });

  if (picked.length < 5) {
    catalogItems.forEach((item) => {
      if (picked.length >= 5) return;
      if (!seen.has(item.title)) {
        picked.push(item);
        seen.add(item.title);
      }
    });
  }

  return picked.slice(0, 5);
};

const extractText = (payload: any) => {
  const parts = payload?.candidates?.[0]?.content?.parts ?? [];
  const text = parts.map((part: any) => part?.text ?? "").join(" ").trim();
  return text;
};

const extractTitles = (rawText: string) => {
  if (!rawText) return [];
  try {
    const parsed = JSON.parse(rawText);
    if (Array.isArray(parsed?.titles)) {
      return parsed.titles;
    }
  } catch {
    // ignore
  }

  const lines = rawText
    .split("\n")
    .map((line) => line.replace(/^[\-\*\d\.\)\s]+/, "").trim())
    .filter(Boolean);

  if (lines.length) return lines;

  return rawText
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Thiếu GEMINI_API_KEY trong env." },
      { status: 500 }
    );
  }

  const formData = await request.formData();
  const file = formData.get("image");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Thiếu ảnh tải lên." }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "Ảnh vượt quá 5MB. Vui lòng chọn ảnh nhỏ hơn." },
      { status: 413 }
    );
  }

  const catalogItems = await fetchLookbook();

  if (!catalogItems.length) {
    return NextResponse.json(
      { error: "Hệ thống chưa có dịch vụ nào có hình ảnh." },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const base64 = buffer.toString("base64");
  const mimeType = file.type || "image/jpeg";

  const catalog = catalogItems
    .map((item) => `- ${item.title} (${item.tag})`)
    .join("\n");

  const prompt = `Bạn là stylist chuyên nghiệp. 
Nhiệm vụ 1: PHÂN TÍCH ẢNH. Hãy kiểm tra xem ảnh tải lên CÓ PHẢI LÀ KHUÔN MẶT NGƯỜI THẬT (rõ ràng, không bị che khuất quá mức) hay không. Nếu ảnh là động vật (chó, mèo,...), đồ vật, phong cảnh, hoặc ảnh mờ không thể nhận diện khuôn mặt người, HÃY TRẢ VỀ JSON: {"error": "Không tìm thấy khuôn mặt người hợp lệ. Vui lòng tải lên ảnh chân dung rõ mặt của bạn."}
Nhiệm vụ 2: Nếu ảnh CÓ KHUÔN MẶT NGƯỜI hợp lệ, hãy chọn đúng 5 dịch vụ làm tóc phù hợp nhất với khuôn mặt này trong danh sách bên dưới.
Chỉ chọn từ danh sách, không tạo tên mới.
Trả về JSON đúng định dạng: {"titles": ["..."]}.
Danh sách kiểu tóc:
${catalog}`;

  const model = process.env.GEMINI_MODEL || "gemini-flash-latest";

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
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

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    let apiMessage =
      payload?.error?.message ||
      payload?.error ||
      "Lỗi từ Gemini. Vui lòng thử lại sau.";
      
    if (response.status === 503 || apiMessage.includes("high demand")) {
        apiMessage = "Hệ thống AI phân tích khuôn mặt đang quá tải tạm thời. Mong bạn thông cảm và thử lại sau ít phút nhé!";
    }

    console.error("Gemini error", response.status, payload);
    return NextResponse.json({ error: apiMessage }, { status: response.status || 502 });
  }

  const text = extractText(payload);
  
  // Catch face detection errors explicitly returned from prompt instructions
  try {
    const parsedText = JSON.parse(text);
    if (parsedText?.error) {
      return NextResponse.json({ error: parsedText.error }, { status: 400 });
    }
  } catch (e) {
    // continue if not json or not error format
  }

  const titles = extractTitles(text);

  const suggestions = buildSuggestions(titles, catalogItems);
  if (!suggestions.length) {
    return NextResponse.json(
      { error: "Không nhận được gợi ý phù hợp từ AI." },
      { status: 502 }
    );
  }

  return NextResponse.json({ suggestions });
}
