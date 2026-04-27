import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import database from "../database.js";
import { requireAdminAuth } from "../middleware/auth.js";
import { publishBookingContentChanged } from "../utils/realtime.js";

const router = express.Router();

const uploadDir = path.join(process.cwd(), "public", "image", "combo");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const uniqueName = `${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

const parsePositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
};

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return parsed;
};

const splitCsvNumbers = (value) =>
  String(value || "")
    .split(",")
    .map((item) => Number(item.trim()))
    .filter((item) => Number.isFinite(item));

const splitCsvStrings = (value) =>
  String(value || "")
    .split("||")
    .map((item) => item.trim())
    .filter(Boolean);

const parseFeatureLinesFromDescription = (value) => {
  if (!value) return [];

  return String(value)
    .split(/\r?\n+/)
    .map((line) => line.replace(/^[•*\-\u2022]+\s*/u, "").trim())
    .filter(Boolean);
};

const parseServices = (value) => {
  if (Array.isArray(value)) {
    return value
      .map((item) => Number(item))
      .filter((item) => Number.isFinite(item));
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];

    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed
          .map((item) => Number(item))
          .filter((item) => Number.isFinite(item));
      }
    } catch {
      // Fallback to CSV parse below.
    }

    return trimmed
      .split(",")
      .map((item) => Number(item.trim()))
      .filter((item) => Number.isFinite(item));
  }

  return [];
};

const toImagePath = (file) => {
  if (!file?.filename) return null;
  return `/image/combo/${file.filename}`;
};

const sanitizeDescriptionLine = (value) =>
  String(value || "")
    .replace(/\r?\n+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const createRequestError = (message, status = 400) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

const validateComboServices = async (executor, serviceIds) => {
  const normalizedIds = serviceIds
    .map((id) => Number(id))
    .filter((id) => Number.isFinite(id));

  if (!normalizedIds.length) {
    return [];
  }

  const uniqueIds = Array.from(new Set(normalizedIds));
  if (uniqueIds.length !== normalizedIds.length) {
    throw createRequestError("Combo không được chứa dịch vụ trùng lặp.");
  }

  const [serviceRows] = await executor.query(
    `
    SELECT
      s.Id_services,
      s.Id_category_service,
      COALESCE(cs.Name, 'Khác') AS category_name
    FROM Services s
    LEFT JOIN Categories_service cs ON cs.Id_category_service = s.Id_category_service
    WHERE s.Id_services IN (?)
    `,
    [uniqueIds]
  );

  if (serviceRows.length !== uniqueIds.length) {
    throw createRequestError("Có dịch vụ không hợp lệ trong combo.");
  }

  const serviceMap = new Map(
    serviceRows.map((service) => [Number(service.Id_services), service])
  );
  const categoryMap = new Map();

  uniqueIds.forEach((serviceId) => {
    const service = serviceMap.get(serviceId);
    if (!service) {
      throw createRequestError("Có dịch vụ không hợp lệ trong combo.");
    }

    const categoryKey = Number(service.Id_category_service || 0);
    if (categoryMap.has(categoryKey)) {
      throw createRequestError(
        `Danh mục "${service.category_name || "Khác"}" đã có dịch vụ trong combo. Mỗi danh mục chỉ được chọn 1 dịch vụ.`
      );
    }

    categoryMap.set(categoryKey, serviceId);
  });

  return uniqueIds;
};

const buildComboDescriptionFromServices = async (executor, serviceIds) => {
  const normalizedIds = Array.from(
    new Set(serviceIds.map((id) => Number(id)).filter((id) => Number.isFinite(id)))
  );

  if (!normalizedIds.length) return null;

  const [serviceRows] = await executor.query(
    `
    SELECT Id_services, Name
    FROM Services
    WHERE Id_services IN (?)
    `,
    [normalizedIds]
  );

  const serviceMap = new Map(
    serviceRows.map((service) => [Number(service.Id_services), service])
  );

  const lines = [];
  for (const serviceId of normalizedIds) {
    const service = serviceMap.get(serviceId);
    if (!service) continue;

    const descriptionLine = sanitizeDescriptionLine(service.Name);
    if (!descriptionLine) continue;

    lines.push(descriptionLine);
  }

  const uniqueLines = Array.from(new Set(lines));
  if (!uniqueLines.length) return null;

  return uniqueLines.map((line) => `• ${line}`).join("\n");
};

/**
 * GET: list combos
 */
router.get("/", async (req, res) => {
  try {
    const { status, page, limit, search, paginate } = req.query;
    const usePagination =
      paginate === "1" || page !== undefined || limit !== undefined;
    const currentPage = parsePositiveInt(page, 1);
    const perPage = Math.min(parsePositiveInt(limit, 10), 100);
    const offset = (currentPage - 1) * perPage;
    const searchKeyword = String(search || "").trim();

    const whereClauses = [];
    const params = [];

    if (status !== undefined) {
      whereClauses.push("Status = ?");
      params.push(Number(status));
    }

    if (searchKeyword) {
      whereClauses.push("Name LIKE ?");
      params.push(`%${searchKeyword}%`);
    }

    let baseQuery =
      "SELECT Id_combo, Name, Price, Duration_time, Status, Image_URL FROM Combos";
    if (whereClauses.length > 0) {
      baseQuery += ` WHERE ${whereClauses.join(" AND ")}`;
    }
    baseQuery += " ORDER BY Id_combo DESC";

    if (!usePagination || paginate === "0") {
      const [rows] = await database.query(baseQuery, params);
      return res.status(200).json(rows);
    }

    let countQuery = "SELECT COUNT(*) AS totalItems FROM Combos";
    if (whereClauses.length > 0) {
      countQuery += ` WHERE ${whereClauses.join(" AND ")}`;
    }

    const [countRows] = await database.query(countQuery, params);
    const totalItems = Number(countRows?.[0]?.totalItems || 0);
    const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / perPage);

    const [rows] = await database.query(`${baseQuery} LIMIT ? OFFSET ?`, [
      ...params,
      perPage,
      offset,
    ]);

    return res.status(200).json({
      data: rows,
      pagination: {
        page: currentPage,
        limit: perPage,
        totalItems,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Loi GET combo:", error);
    return res.status(500).json({
      error: "Loi server khi lay danh sach combo",
      message: error.message,
    });
  }
});

/**
 * GET: public combo catalog for Booking
 */
router.get("/catalog", async (_req, res) => {
  try {
    const [comboRows] = await database.query(
      `
      SELECT
        c.Id_combo,
        c.Name,
        c.Price,
        c.Duration_time,
        c.Status,
        c.Image_URL,
        c.Description AS combo_description,
        COUNT(DISTINCT s.Id_services) AS service_count,
        GROUP_CONCAT(s.Id_services ORDER BY s.Id_services) AS service_ids, 
        GROUP_CONCAT(s.Id_category_service ORDER BY s.Id_category_service) AS category_ids,
        GROUP_CONCAT(cs.Name ORDER BY cs.Id_category_service SEPARATOR '||') AS category_names,
        GROUP_CONCAT(s.Name ORDER BY s.Id_services SEPARATOR '||') AS service_names,
        COALESCE(
          c.Image_URL,
          (
            SELECT i.Image_URL
            FROM Combo_Detail cd_image
            JOIN Image_Services i ON i.Id_services = cd_image.Id_services
            WHERE cd_image.Id_combo = c.Id_combo
            ORDER BY i.Id_image_service ASC
            LIMIT 1
          )
        ) AS image_url,
        (
          SELECT s_desc.Description
          FROM Combo_Detail cd_desc
          JOIN Services s_desc ON s_desc.Id_services = cd_desc.Id_services
          WHERE cd_desc.Id_combo = c.Id_combo
            AND s_desc.Status = 1
            AND s_desc.Description IS NOT NULL
            AND TRIM(s_desc.Description) <> ''
          ORDER BY s_desc.Id_services ASC
          LIMIT 1
        ) AS service_description
      FROM Combos c
      LEFT JOIN Combo_Detail cd ON cd.Id_combo = c.Id_combo
      LEFT JOIN Services s ON s.Id_services = cd.Id_services AND s.Status = 1
      LEFT JOIN Categories_service cs ON cs.Id_category_service = s.Id_category_service
      WHERE c.Status = 1
      GROUP BY c.Id_combo, c.Name, c.Price, c.Duration_time, c.Status, c.Image_URL, c.Description
      ORDER BY c.Id_combo DESC
      `
    );

    const [categoryRows] = await database.query(
      `
      SELECT
        cs.Id_category_service,
        cs.Name,
        COUNT(DISTINCT cd.Id_combo) AS combo_total
      FROM Categories_service cs
      JOIN Services s
        ON s.Id_category_service = cs.Id_category_service
       AND s.Status = 1
      JOIN Combo_Detail cd ON cd.Id_services = s.Id_services
      JOIN Combos c ON c.Id_combo = cd.Id_combo AND c.Status = 1
      WHERE cs.Is_active = 1
      GROUP BY cs.Id_category_service, cs.Name
      ORDER BY cs.Id_category_service ASC
      `
    );

    const combos = comboRows.map((row) => ({
      Id_combo: Number(row.Id_combo),
      Name: row.Name,
      Price: Number(row.Price || 0),
      Duration_time: Number(row.Duration_time || 0),
      Status: Number(row.Status || 0),
      Description: row.service_description || null,
      feature_lines: parseFeatureLinesFromDescription(row.combo_description),
      Image_URL: row.image_url || null,
      service_count: Number(row.service_count || 0),
      service_names: splitCsvStrings(row.service_names),
      category_ids: splitCsvNumbers(row.category_ids),
      category_names: splitCsvStrings(row.category_names),
      service_ids: splitCsvNumbers(row.service_ids),
    }));

    const categories = categoryRows.map((row) => ({
      Id_category_service: Number(row.Id_category_service),
      Name: row.Name,
      combo_total: Number(row.combo_total || 0),
    }));

    return res.status(200).json({
      generated_at: new Date().toISOString(),
      combos,
      categories,
    });
  } catch (error) {
    console.error("Loi lay catalog combo:", error);
    return res.status(500).json({
      message: "Khong the lay du lieu combo.",
    });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const comboId = Number(req.params.id);
    if (!Number.isFinite(comboId)) {
      return res.status(400).json({ error: "Id combo khong hop le" });
    }

    const [comboRows] = await database.query(
      `
      SELECT Id_combo, Name, Price, Duration_time, Status, Image_URL, Description
      FROM Combos
      WHERE Id_combo = ?
      LIMIT 1
      `,
      [comboId]
    );

    if (!comboRows.length) {
      return res.status(404).json({ error: "Khong tim thay combo" });
    }

    const [serviceRows] = await database.query(
      `
      SELECT 
        s.Id_services,
        s.Name,
        s.Price,
        s.Sale_Price,
        s.Duration_time,
        s.Description,
        s.Status,
        s.Id_category_service AS Id_category,
        cs.Name AS category_name,
        (
          SELECT i.Image_URL
          FROM Image_Services i
          WHERE i.Id_services = s.Id_services
          ORDER BY i.Id_image_service ASC
          LIMIT 1
        ) AS Image_URL
      FROM Combo_Detail cd
      JOIN Services s ON s.Id_services = cd.Id_services
      LEFT JOIN Categories_service cs ON cs.Id_category_service = s.Id_category_service
      WHERE cd.Id_combo = ?
      ORDER BY s.Id_services ASC
      `,
      [comboId]
    );

    return res.status(200).json({
      ...comboRows[0],
      services: serviceRows,
    });
  } catch (error) {
    console.error("Loi lay chi tiet combo:", error);
    return res.status(500).json({
      error: "Loi server khi lay chi tiet combo",
      message: error.message,
    });
  }
});

/**
 * POST: create combo + combo_detail
 */
router.post("/", requireAdminAuth, upload.single("Image"), async (req, res) => {
  let connection;

  try {
    const Name = String(req.body.Name || "").trim();
    const Price = toNumber(req.body.Price, NaN);
    const Duration_time = toNumber(req.body.Duration_time, NaN);
    const Status = toNumber(req.body.Status, NaN);
    const services = parseServices(req.body.services);
    const uploadedImage = toImagePath(req.file);
    const imageUrl = uploadedImage || String(req.body.Image_URL || "").trim() || null;

    if (!Name || !Number.isFinite(Price) || !Number.isFinite(Duration_time) || !Number.isFinite(Status)) {
      return res.status(400).json({ error: "Thieu thong tin combo" });
    }

    if (!services.length) {
      return res.status(400).json({ error: "Combo phai co it nhat 1 dich vu" });
    }

    if (!imageUrl) {
      return res.status(400).json({ error: "Combo bat buoc phai co anh" });
    }

    connection = await database.getConnection();
    await connection.beginTransaction();
    const validatedServiceIds = await validateComboServices(connection, services);
    const comboDescription = await buildComboDescriptionFromServices(connection, validatedServiceIds);

    const [result] = await connection.query(
      `
      INSERT INTO Combos (Name, Price, Duration_time, Status, Description, Image_URL)
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [Name, Price, Duration_time, Status, comboDescription, imageUrl]
    );

    const comboId = Number(result.insertId);
    const comboDetailValues = validatedServiceIds.map((serviceId) => [serviceId, comboId]);

    await connection.query(
      `
      INSERT INTO Combo_Detail (Id_services, Id_combo)
      VALUES ?
      `,
      [comboDetailValues]
    );

    await connection.commit();

    publishBookingContentChanged({
      type: "combo_created",
      comboId,
    });

    return res.status(201).json({
      message: "Tao combo thanh cong",
      Id_combo: comboId,
      Image_URL: imageUrl,
    });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Loi tao combo:", error);
    const status = Number.isInteger(error?.status) ? error.status : 500;
    return res.status(status).json({
      error: status === 400 ? error.message : "Loi server khi tao combo",
      message: error.message,
    });
  } finally {
    if (connection) connection.release();
  }
});

/**
 * PATCH: update combo status
 */
router.patch("/:id/status", requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { Status } = req.body;

    if (Status === undefined) {
      return res.status(400).json({ error: "Thieu trang thai Status" });
    }

    const [result] = await database.query(
      "UPDATE Combos SET Status = ? WHERE Id_combo = ?",
      [Number(Status), Number(id)]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Khong tim thay combo" });
    }

    publishBookingContentChanged({
      type: "combo_status_changed",
      comboId: Number(id),
      status: Number(Status),
    });

    return res.status(200).json({
      message: "Cap nhat trang thai combo thanh cong",
    });
  } catch (error) {
    console.error("Loi cap nhat trang thai combo:", error);
    return res.status(500).json({
      error: "Loi server khi cap nhat trang thai combo",
      message: error.message,
    });
  }
});

/**
 * PUT: update combo + combo_detail
 */
router.put("/:id", requireAdminAuth, upload.single("Image"), async (req, res) => {
  let connection;

  try {
    const comboId = Number(req.params.id);
    const Name = String(req.body.Name || "").trim();
    const Price = toNumber(req.body.Price, NaN);
    const Duration_time = toNumber(req.body.Duration_time, NaN);
    const Status = toNumber(req.body.Status, NaN);
    const services = parseServices(req.body.services);
    const uploadedImage = toImagePath(req.file);

    if (!Number.isFinite(comboId)) {
      return res.status(400).json({ error: "Id combo khong hop le" });
    }

    if (!Name || !Number.isFinite(Price) || !Number.isFinite(Duration_time) || !Number.isFinite(Status)) {
      return res.status(400).json({ error: "Thieu thong tin combo" });
    }

    if (!services.length) {
      return res.status(400).json({ error: "Combo phai co it nhat 1 dich vu" });
    }

    connection = await database.getConnection();
    await connection.beginTransaction();

    const [existingRows] = await connection.query(
      "SELECT Image_URL FROM Combos WHERE Id_combo = ? LIMIT 1",
      [comboId]
    );

    if (!existingRows.length) {
      await connection.rollback();
      return res.status(404).json({ error: "Khong tim thay combo" });
    }

    const currentImage = existingRows[0].Image_URL || null;
    const formImageUrl = String(req.body.Image_URL || "").trim() || null;
    const imageUrlToSave = uploadedImage || formImageUrl || currentImage;
    if (!imageUrlToSave) {
      await connection.rollback();
      return res.status(400).json({ error: "Combo bat buoc phai co anh" });
    }

    const validatedServiceIds = await validateComboServices(connection, services);
    const comboDescription = await buildComboDescriptionFromServices(connection, validatedServiceIds);

    const [updateResult] = await connection.query(
      `
      UPDATE Combos
      SET Name = ?, Price = ?, Duration_time = ?, Status = ?, Description = ?, Image_URL = ?
      WHERE Id_combo = ?
      `,
      [Name, Price, Duration_time, Status, comboDescription, imageUrlToSave, comboId]
    );

    if (updateResult.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ error: "Khong tim thay combo" });
    }

    await connection.query("DELETE FROM Combo_Detail WHERE Id_combo = ?", [comboId]);

    const comboDetailValues = validatedServiceIds.map((serviceId) => [serviceId, comboId]);
    await connection.query(
      `
      INSERT INTO Combo_Detail (Id_services, Id_combo)
      VALUES ?
      `,
      [comboDetailValues]
    );

    await connection.commit();

    publishBookingContentChanged({
      type: "combo_updated",
      comboId,
    });

    return res.status(200).json({
      message: "Cap nhat combo thanh cong",
      Image_URL: imageUrlToSave,
    });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Loi cap nhat combo:", error);
    const status = Number.isInteger(error?.status) ? error.status : 500;
    return res.status(status).json({
      error: status === 400 ? error.message : "Loi server khi cap nhat combo",
      message: error.message,
    });
  } finally {
    if (connection) connection.release();
  }
});

export default router;