import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import database from "../database.js";
import { requireAdminAuth } from "../middleware/auth.js";
import { publishBookingContentChanged } from "../utils/realtime.js";

const router = express.Router();

// Đường dẫn lưu ảnh
const uploadDir = path.join(process.cwd(), "public", "image", "dichvu");

// Tạo thư mục nếu chưa tồn tại
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Cấu hình multer
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueName = Date.now() + path.extname(file.originalname);
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

// =========================
// POST: Upload ảnh dịch vụ
// =========================
router.post("/", requireAdminAuth, upload.array("images"), async (req, res) => {
  try {
    const { Id_services } = req.body;

    if (!Id_services) {
      return res.status(400).json({ error: "Thiếu Id_services" });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "Không có file ảnh" });
    }

    // Lưu vào DB
    for (const file of req.files) {
      const imageUrl = `/image/dichvu/${file.filename}`;

      await database.query(
        `
        INSERT INTO Image_Services (Id_services, Image_URL)
        VALUES (?, ?)
        `,
        [Number(Id_services), imageUrl]
      );
    }

    publishBookingContentChanged({
      type: "service_images_updated",
      serviceId: Number(Id_services),
    });

    return res.json({ message: "Upload ảnh thành công" });
  } catch (error) {
    console.error("Lỗi upload ảnh:", error);
    return res.status(500).json({ error: "Upload ảnh thất bại" });
  }
});

export default router;
