import express from "express";
import database from "../database.js";
import { requireAdminAuth } from "../middleware/auth.js";
import { publishBookingContentChanged } from "../utils/realtime.js";

const router = express.Router();

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

/**
 * GET: Lấy tất cả combo
 */
router.get("/", async (_req, res) => {
  try {
    const [rows] = await database.query(
      "SELECT * FROM Combos ORDER BY Id_combo DESC"
    );
    return res.status(200).json(rows);
  } catch (error) {
    console.error("Lỗi GET combo:", error);
    return res.status(500).json({
      error: "Lỗi server khi lấy danh sách combo",
      message: error.message,
    });
  }
});

/**
 * GET: Catalog combo cho Booking (public)
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
        COUNT(DISTINCT s.Id_services) AS service_count,
        GROUP_CONCAT(DISTINCT s.Id_category_service ORDER BY s.Id_category_service) AS category_ids,
        GROUP_CONCAT(DISTINCT cs.Name ORDER BY cs.Id_category_service SEPARATOR '||') AS category_names,
        GROUP_CONCAT(DISTINCT s.Name ORDER BY s.Id_services SEPARATOR '||') AS service_names,
        (
          SELECT i.Image_URL
          FROM Combo_Detail cd_image
          JOIN Image_Services i ON i.Id_services = cd_image.Id_services
          WHERE cd_image.Id_combo = c.Id_combo
          ORDER BY i.Id_image_service ASC
          LIMIT 1
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
        ) AS description
      FROM Combos c
      LEFT JOIN Combo_Detail cd ON cd.Id_combo = c.Id_combo
      LEFT JOIN Services s ON s.Id_services = cd.Id_services AND s.Status = 1
      LEFT JOIN Categories_service cs ON cs.Id_category_service = s.Id_category_service
      WHERE c.Status = 1
      GROUP BY c.Id_combo, c.Name, c.Price, c.Duration_time, c.Status
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
      Description: row.description || null,
      Image_URL: row.image_url || null,
      service_count: Number(row.service_count || 0),
      service_names: splitCsvStrings(row.service_names),
      category_ids: splitCsvNumbers(row.category_ids),
      category_names: splitCsvStrings(row.category_names),
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

router.get("/:id", requireAdminAuth, async (req, res) => {
  try {
    const comboId = Number(req.params.id);
    if (!Number.isFinite(comboId)) {
      return res.status(400).json({ error: "Id combo không hợp lệ" });
    }

    const [comboRows] = await database.query(
      `
      SELECT Id_combo, Name, Price, Duration_time, Status
      FROM Combos
      WHERE Id_combo = ?
      LIMIT 1
      `,
      [comboId]
    );

    if (!comboRows.length) {
      return res.status(404).json({ error: "Không tìm thấy combo" });
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
    console.error("Lỗi lấy chi tiết combo:", error);
    return res.status(500).json({
      error: "Lỗi server khi lấy chi tiết combo",
      message: error.message,
    });
  }
});

/**
 * POST: Tạo combo + combo_detail (transaction)
 */
router.post("/", requireAdminAuth, async (req, res) => {
  let connection;

  try {
    const { Name, Price, Duration_time, Status, services } = req.body;

    if (!Name || Price == null || Duration_time == null || Status == null) {
      return res.status(400).json({ error: "Thiếu thông tin combo" });
    }

    if (!services || !Array.isArray(services) || services.length === 0) {
      return res.status(400).json({ error: "Combo phải có ít nhất 1 dịch vụ" });
    }

    connection = await database.getConnection();
    await connection.beginTransaction();

    const [result] = await connection.query(
      `
      INSERT INTO Combos (Name, Price, Duration_time, Status)
      VALUES (?, ?, ?, ?)
      `,
      [Name, Price, Duration_time, Status]
    );

    const comboId = result.insertId;
    const comboDetailValues = services.map((serviceId) => [serviceId, comboId]);

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
      message: "Tạo combo thành công",
      Id_combo: comboId,
    });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Lỗi tạo combo:", error);
    return res.status(500).json({
      error: "Lỗi server khi tạo combo",
      message: error.message,
    });
  } finally {
    if (connection) connection.release();
  }
});

/**
 * PATCH: Đổi trạng thái combo
 */
router.patch("/:id/status", requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { Status } = req.body;

    if (Status === undefined) {
      return res.status(400).json({ error: "Thiếu trạng thái Status" });
    }

    const [result] = await database.query(
      "UPDATE Combos SET Status = ? WHERE Id_combo = ?",
      [Status, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Không tìm thấy combo" });
    }

    publishBookingContentChanged({
      type: "combo_status_changed",
      comboId: Number(id),
      status: Number(Status),
    });

    return res.status(200).json({
      message: "Cập nhật trạng thái combo thành công",
    });
  } catch (error) {
    console.error("Lỗi cập nhật trạng thái combo:", error);
    return res.status(500).json({
      error: "Lỗi server khi cập nhật trạng thái combo",
      message: error.message,
    });
  }
});

/**
 * PUT: Cập nhật combo + combo_detail (transaction)
 */
router.put("/:id", requireAdminAuth, async (req, res) => {
  let connection;

  try {
    const comboId = Number(req.params.id);
    const { Name, Price, Duration_time, Status, services } = req.body;

    if (!Number.isFinite(comboId)) {
      return res.status(400).json({ error: "Id combo không hợp lệ" });
    }

    if (!Name || Price == null || Duration_time == null || Status == null) {
      return res.status(400).json({ error: "Thiếu thông tin combo" });
    }

    if (!services || !Array.isArray(services) || services.length === 0) {
      return res.status(400).json({ error: "Combo phải có ít nhất 1 dịch vụ" });
    }

    connection = await database.getConnection();
    await connection.beginTransaction();

    const [updateResult] = await connection.query(
      `
      UPDATE Combos
      SET Name = ?, Price = ?, Duration_time = ?, Status = ?
      WHERE Id_combo = ?
      `,
      [Name, Price, Duration_time, Status, comboId]
    );

    if (updateResult.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ error: "Không tìm thấy combo" });
    }

    await connection.query("DELETE FROM Combo_Detail WHERE Id_combo = ?", [
      comboId,
    ]);

    const comboDetailValues = services.map((serviceId) => [serviceId, comboId]);

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
      message: "Cập nhật combo thành công",
    });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Lỗi cập nhật combo:", error);
    return res.status(500).json({
      error: "Lỗi server khi cập nhật combo",
      message: error.message,
    });
  } finally {
    if (connection) connection.release();
  }
});

export default router;

