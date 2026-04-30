import express from "express";
import fs from "fs";
import path from "path";
import multer from "multer";
import database from "../database.js";

const uploadDir = path.join(process.cwd(), "public", "image", "stores");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const safeOriginal = file.originalname.replace(/[^\w.-]/g, "_");
    cb(null, `${Date.now()}-${safeOriginal}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

const router = express.Router();

const normalizeProvince = (value = "") =>
  String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9 ]+/g, " ")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

const toCityParam = (province = "") => normalizeProvince(province).replace(/\s+/g, "-");

/**
 * =========================
 * GET: Lấy danh sách chi nhánh
 * =========================
 * GET /api/chinhanh
 */
router.get("/", async (req, res) => {
  try {
    const { status } = req.query;

    let query = `
      SELECT 
        Id_store,
        Name_store,
        Image,
        Address,
        Province,
        Ward,
        Email,
        Phone,
        Opening_time,
        Closing_time,
        Status
      FROM Stores
    `;

    const params = [];

    if (status !== undefined) {
      query += " WHERE Status = ?";
      params.push(Number(status));
    }

    query += " ORDER BY Id_store DESC";

    const [rows] = await database.query(query, params);

    res.json(rows);
  } catch (error) {
    console.error("Lỗi lấy danh sách chi nhánh:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
});

/**
 * =========================
 * GET: Tóm tắt số chi nhánh theo tỉnh/thành
 * =========================
 * GET /api/chinhanh/summary/provinces
 */
router.get("/summary/provinces", async (req, res) => {
  try {
    const { status, limit } = req.query;

    let query = `
      SELECT
        Province,
        COUNT(*) AS total
      FROM Stores
      WHERE Province IS NOT NULL
        AND TRIM(Province) <> ''
    `;
    const params = [];

    if (status !== undefined) {
      query += " AND Status = ?";
      params.push(Number(status));
    }

    query += " GROUP BY Province ORDER BY total DESC, Province ASC";

    const parsedLimit = Number(limit);
    if (Number.isFinite(parsedLimit) && parsedLimit > 0) {
      query += " LIMIT ?";
      params.push(Math.floor(parsedLimit));
    }

    const [rows] = await database.query(query, params);

    const payload = rows.map((row) => {
      const province = String(row.Province || "").trim();
      const normalized = normalizeProvince(province);
      return {
        province,
        total: Number(row.total || 0),
        normalized_province: normalized,
        city_param: toCityParam(province),
      };
    });

    return res.json(payload);
  } catch (error) {
    console.error("Lỗi tóm tắt chi nhánh theo tỉnh/thành:", error);
    return res.status(500).json({ message: "Lỗi server" });
  }
});

/**
 * =========================
 * GET: Lấy chi tiết 1 chi nhánh
 * =========================
 * GET /api/chinhanh/:id
 */
router.get("/:id", async (req, res) => {
  try {
    const storeId = Number(req.params.id);

    if (isNaN(storeId)) {
      return res.status(400).json({
        message: "Id chi nhánh không hợp lệ",
      });
    }

    const [rows] = await database.query(
      `
      SELECT 
        Id_store,
        Name_store,
        Image,
        Address,
        Province,
        Ward,
        Email,
        Phone,
        Opening_time,
        Closing_time,
        Status
      FROM Stores
      WHERE Id_store = ?
      `,
      [storeId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        message: "Không tìm thấy chi nhánh",
      });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error("Lỗi lấy chi tiết chi nhánh:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
});

/**
 * =========================
 * POST: Tạo chi nhánh mới
 * =========================
 * POST /api/chinhanh
 */
router.post("/", upload.single("Image"), async (req, res) => {
  try {
    const {
      Name_store,
      Address,
      Province,
      Ward,
      Email,
      Phone,
      Opening_time,
      Closing_time,
      Status,
    } = req.body;

    const imagePath = req.file ? `/image/stores/${req.file.filename}` : "";

    if (!Name_store || !Address || !Province || !Ward || !Phone) {
      return res.status(400).json({
        message: "Thiếu dữ liệu bắt buộc",
      });
    }

    const [result] = await database.query(
      `
      INSERT INTO Stores
      (Name_store, Address, Province, Ward, Email, Phone, Opening_time, Closing_time, Status, Image)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        Name_store,
        Address,
        Province,
        Ward,
        Email ?? null,
        Phone,
        Opening_time ?? null,
        Closing_time ?? null,
        Number(Status ?? 1),
        imagePath,
      ]
    );

    res.json({
      message: "Tạo chi nhánh thành công",
      Id_store: result.insertId,
    });
  } catch (error) {
    console.error("Lỗi tạo chi nhánh:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
});

/**
 * =========================
 * PUT: Cập nhật FULL chi nhánh
 * =========================
 * PUT /api/chinhanh/:id
 */
router.put("/:id", upload.single("Image"), async (req, res) => {
  try {
    const storeId = Number(req.params.id);

    if (isNaN(storeId)) {
      return res.status(400).json({
        message: "Id chi nhánh không hợp lệ",
      });
    }

    const {
      Name_store,
      Address,
      Province,
      Ward,
      Email,
      Phone,
      Opening_time,
      Closing_time,
      Status,
    } = req.body;

    let imagePath = req.body.Image || ""; // In case they send existing image path as string
    if (req.file) {
      imagePath = `/image/stores/${req.file.filename}`;
    }

    if (!Name_store || !Address || !Province || !Ward || !Phone) {
      return res.status(400).json({
        message: "Thiếu dữ liệu bắt buộc",
      });
    }

    const [result] = await database.query(
      `
      UPDATE Stores
      SET 
        Name_store = ?,
        Address = ?,
        Province = ?,
        Ward = ?,
        Email = ?,
        Phone = ?,
        Opening_time = ?,
        Closing_time = ?,
        Status = ?,
        Image = ?
      WHERE Id_store = ?
      `,
      [
        Name_store,
        Address,
        Province,
        Ward,
        Email ?? null,
        Phone,
        Opening_time ?? null,
        Closing_time ?? null,
        Number(Status ?? 1),
        imagePath,
        storeId,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Không tìm thấy chi nhánh",
      });
    }

    res.json({
      message: "Cập nhật chi nhánh thành công",
    });
  } catch (error) {
    console.error("Lỗi cập nhật chi nhánh:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
});

/**
 * =========================
 * PATCH: Đổi trạng thái chi nhánh
 * =========================
 * PATCH /api/chinhanh/:id/status
 */
router.patch("/:id/status", async (req, res) => {
  try {
    const storeId = Number(req.params.id);
    const { Status } = req.body;

    if (isNaN(storeId)) {
      return res.status(400).json({
        message: "Id chi nhánh không hợp lệ",
      });
    }

    if (Status !== 0 && Status !== 1) {
      return res.status(400).json({
        message: "Status phải là 0 hoặc 1",
      });
    }

    const [result] = await database.query(
      `
      UPDATE Stores
      SET Status = ?
      WHERE Id_store = ?
      `,
      [Number(Status), storeId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Không tìm thấy chi nhánh",
      });
    }

    res.json({
      message:
        Number(Status) === 0
          ? "Đã ngưng hoạt động chi nhánh"
          : "Đã kích hoạt lại chi nhánh",
    });
  } catch (error) {
    console.error("Lỗi đổi status chi nhánh:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
});

export default router;
