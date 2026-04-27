import express from "express";
import database from "../database.js";
import { requireAdminAuth } from "../middleware/auth.js";
import { publishBookingContentChanged } from "../utils/realtime.js";

const router = express.Router();

/**
 * =========================
 * GET: Lấy danh sách dịch vụ
 * =========================
 */
router.get("/", async (req, res) => {
  try {
    const { status } = req.query;

    let query = `
      SELECT 
        s.Id_services,
        s.Name,
        s.Price,
        s.Description,
        s.Duration_time,
        s.Sale_Price,
        s.Status,
        s.Id_category_service AS Id_category,
        c.Name AS category_name,
        (
          SELECT Image_URL
          FROM Image_Services i
          WHERE i.Id_services = s.Id_services
          ORDER BY i.Id_image_service ASC
          LIMIT 1
        ) AS Image_URL
      FROM Services s
      LEFT JOIN Categories_service c
        ON s.Id_category_service = c.Id_category_service
    `;

    const params = [];
    if (status !== undefined) {
      query += " WHERE s.Status = ?";
      params.push(Number(status));
    }

    query += " ORDER BY s.Id_services DESC";

    const [rows] = await database.query(query, params);
    return res.json(rows);
  } catch (error) {
    console.error("Lỗi lấy danh sách services:", error);
    return res.status(500).json({ message: "Lỗi server" });
  }
});

/**
 * GET: Lấy chi tiết 1 dịch vụ
 */
router.get("/:id", async (req, res) => {
  try {
    const serviceId = Number(req.params.id);
    if (Number.isNaN(serviceId)) {
      return res.status(400).json({ message: "Id dịch vụ không hợp lệ" });
    }

    const [rows] = await database.query(
      `
      SELECT 
        s.Id_services,
        s.Name,
        s.Price,
        s.Description,
        s.Duration_time,
        s.Sale_Price,
        s.Status,
        s.Id_category_service AS Id_category,
        c.Name AS category_name
      FROM Services s
      LEFT JOIN Categories_service c
        ON s.Id_category_service = c.Id_category_service
      WHERE s.Id_services = ?
      LIMIT 1
      `,
      [serviceId]
    );

    if (!rows.length) {
      return res.status(404).json({ message: "Không tìm thấy dịch vụ" });
    }

    return res.json(rows[0]);
  } catch (error) {
    console.error("Lỗi lấy chi tiết service:", error);
    return res.status(500).json({ message: "Lỗi server" });
  }
});

/**
 * =========================
 * POST: Tạo dịch vụ mới
 * =========================
 * POST /api/dichvu
 */
router.post("/", requireAdminAuth, async (req, res) => {
  try {
    const {
      Name,
      Id_category,
      Price,
      Sale_Price,
      Duration_time,
      Status,
      Description,
    } = req.body;

    if (!Name || !Id_category || !Price || !Duration_time) {
      return res.status(400).json({ message: "Thiếu dữ liệu bắt buộc" });
    }

    const [result] = await database.query(
      `
      INSERT INTO Services
      (Name, Id_category_service, Price, Sale_Price, Duration_time, Status, Description)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [
        Name,
        Number(Id_category),
        Number(Price),
        Number(Sale_Price ?? 0),
        Number(Duration_time),
        Number(Status ?? 1),
        Description ?? null,
      ]
    );

    const serviceId = Number(result.insertId);

    publishBookingContentChanged({
      type: "service_created",
      serviceId,
    });

    return res.json({
      message: "Tạo dịch vụ thành công",
      Id_services: serviceId,
    });
  } catch (error) {
    console.error("Lỗi tạo service:", error);
    return res.status(500).json({ message: "Lỗi server" });
  }
});

/**
 * PUT: Cập nhật full dịch vụ
 */
router.put("/:id", requireAdminAuth, async (req, res) => {
  try {
    const serviceId = Number(req.params.id);
    if (Number.isNaN(serviceId)) {
      return res.status(400).json({ message: "Id dịch vụ không hợp lệ" });
    }

    const {
      Name,
      Id_category,
      Price,
      Sale_Price,
      Duration_time,
      Status,
      Description,
    } = req.body;

    if (!Name || !Id_category || !Price || !Duration_time) {
      return res.status(400).json({ message: "Thiếu thông tin bắt buộc" });
    }

    const [result] = await database.query(
      `
      UPDATE Services
      SET
        Name = ?,
        Id_category_service = ?,
        Price = ?,
        Sale_Price = ?,
        Duration_time = ?,
        Status = ?,
        Description = ?
      WHERE Id_services = ?
      `,
      [
        Name,
        Number(Id_category),
        Number(Price),
        Number(Sale_Price ?? 0),
        Number(Duration_time),
        Number(Status ?? 1),
        Description ?? null,
        serviceId,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Không tìm thấy dịch vụ" });
    }

    // Business: nếu tắt service => tắt luôn combo chứa service đó.
    if (Number(Status) === 0) {
      const [comboRows] = await database.query(
        `
        SELECT DISTINCT Id_combo
        FROM Combo_detail
        WHERE Id_services = ?
        `,
        [serviceId]
      );

      if (comboRows.length > 0) {
        const comboIds = comboRows.map((row) => row.Id_combo);
        await database.query(
          `
          UPDATE Combos
          SET Status = 0
          WHERE Id_combo IN (?)
          `,
          [comboIds]
        );
      }
    }

    publishBookingContentChanged({
      type: "service_updated",
      serviceId,
      status: Number(Status ?? 1),
    });

    return res.json({ message: "Cập nhật dịch vụ thành công" });
  } catch (error) {
    console.error("Lỗi update dịch vụ:", error);
    return res.status(500).json({ message: "Lỗi server" });
  }
});

/**
 * PATCH: Đổi trạng thái dịch vụ
 */
router.patch("/:id/status", requireAdminAuth, async (req, res) => {
  try {
    const serviceId = Number(req.params.id);
    const { Status } = req.body;

    if (Number.isNaN(serviceId)) {
      return res.status(400).json({ message: "Id dịch vụ không hợp lệ" });
    }

    if (Status !== 0 && Status !== 1) {
      return res.status(400).json({ message: "Status phải là 0 hoặc 1" });
    }

    const [result] = await database.query(
      `
      UPDATE Services
      SET Status = ?
      WHERE Id_services = ?
      `,
      [Number(Status), serviceId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Không tìm thấy dịch vụ" });
    }

    // Business: nếu tắt service => tắt luôn combo chứa service đó.
    if (Number(Status) === 0) {
      const [comboRows] = await database.query(
        `
        SELECT DISTINCT Id_combo
        FROM Combo_detail
        WHERE Id_services = ?
        `,
        [serviceId]
      );

      if (comboRows.length > 0) {
        const comboIds = comboRows.map((row) => row.Id_combo);
        await database.query(
          `
          UPDATE Combos
          SET Status = 0
          WHERE Id_combo IN (?)
          `,
          [comboIds]
        );
      }
    }

    publishBookingContentChanged({
      type: "service_status_changed",
      serviceId,
      status: Number(Status),
    });

    return res.json({
      message:
        Number(Status) === 0
          ? "Đã ngưng hoạt động dịch vụ (soft delete)"
          : "Đã kích hoạt lại dịch vụ",
    });
  } catch (error) {
    console.error("Lỗi đổi status service:", error);
    return res.status(500).json({ message: "Lỗi server" });
  }
});

export default router;

