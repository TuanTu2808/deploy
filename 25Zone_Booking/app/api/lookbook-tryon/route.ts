import { NextResponse } from "next/server";
import { client, handle_file } from "@gradio/client";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

export async function POST(request: Request) {
  const formData = await request.formData();
  const personImage = formData.get("person_image");   // Ảnh chứa khuôn mặt (Swap Image)
  const styleUrl = formData.get("style_url");         // Ảnh chứa kiểu tóc (Base Image)

  if (!(personImage instanceof File)) {
    return NextResponse.json(
      { error: "Thiếu ảnh khuôn mặt." },
      { status: 400 }
    );
  }

  if (typeof styleUrl !== "string" || !styleUrl) {
    return NextResponse.json(
      { error: "Thiếu thông tin kiểu tóc." },
      { status: 400 }
    );
  }

  if (personImage.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "Ảnh vượt quá 5MB." },
      { status: 413 }
    );
  }

  try {
    // Tải ảnh style về dưới dạng Blob thay vì base64
    const styleResponse = await fetch(styleUrl);
    if (!styleResponse.ok) throw new Error("Không thể tải ảnh gốc.");
    const styleBlob = await styleResponse.blob();

    const hfToken = process.env.HF_TOKEN;

    // Kết nối đến Hugging Face Space Face Swap
    const app = await client("tonyassi/face-swap", {
      hf_token: hfToken,
    } as any);

    // Truyền trực tiếp handle_file() theo chuẩn Gradio >=2.0 thay vì chuỗi base64
    const result = await app.predict("/swap_faces", [
      handle_file(personImage), // src_img
      handle_file(styleBlob), // dest_img
    ]);

    // Trích xuất kết quả trả về từ tonyassi/face-swap
    // Thường là mảng có chứa URL file hoặc object
    const outData = result.data as any;
    
    let swapDataUrl = "";
    if (Array.isArray(outData) && outData.length > 0) {
      const output = outData[0];
      if (typeof output === "string") {
        swapDataUrl = output;
      } else if (output?.url) {
        swapDataUrl = output.url;
      }
    }

    if (!swapDataUrl) {
      throw new Error("Không lấy được kết quả Face Swap.");
    }

    return NextResponse.json({ image: swapDataUrl }, { status: 200 });
  } catch (error: any) {
    console.error("Face swap error:", error?.message || error);

    const errorMsg = String(error?.message || "").toLowerCase();

    // Bắt lỗi không có khuôn mặt hợp lệ trong ảnh lúc ghép
    if (errorMsg.includes("no face") || errorMsg.includes("faces detected")) {
      return NextResponse.json(
        { error: "Không phát hiện thấy khuôn mặt (hoặc mặt bị che/quá mờ) để ghép. Vui lòng thử ảnh khác." },
        { status: 400 }
      );
    }

    // Bắt lỗi Space đang ngủ hoặc không tải được metadata
    if (errorMsg.includes("space metadata could not be loaded")) {
      return NextResponse.json(
        { error: "AI hiện đang bảo trì hoặc ở trạng thái ngủ. Vui lòng thử lại sau ít phút." },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "Hệ thống bận hoặc lỗi ảnh. Vui lòng thử lại." },
      { status: 502 }
    );
  }
}
