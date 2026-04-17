import express from "express";
import database from "../database.js";

const router = express.Router();

const normalizeText = (value) => String(value ?? "").trim();
const toStatus = (value, fallback = 1) => {
  if (value === undefined || value === null || value === "") return fallback;
  const parsed = Number.parseInt(String(value), 10);
  return parsed === 0 ? 0 : 1;
};

router.get("/", async (_req, res) => {
  try {
    const [rows] = await database.query(
      `
        SELECT
          c.Id_category_news,
          c.Name_category_news,
          c.Status,
          COUNT(n.Id_news) AS Total_news
        FROM category_news c
        LEFT JOIN news n ON n.Id_category_news = c.Id_category_news
        GROUP BY c.Id_category_news, c.Name_category_news, c.Status
        ORDER BY c.Id_category_news DESC
      `
    );

    return res.json(rows);
  } catch (error) {
    console.error("Loi lay danh sach loai tin admin:", error);
    return res.status(500).json({ message: "Loi server." });
  }
});

router.post("/", async (req, res) => {
  try {
    const name = normalizeText(req.body?.Name_category_news);
    const status = toStatus(req.body?.Status, 1);

    if (!name) {
      return res.status(400).json({ message: "Ten loai tin khong duoc de trong." });
    }

    const [existsRows] = await database.query(
      `
        SELECT Id_category_news
        FROM category_news
        WHERE LOWER(Name_category_news) = LOWER(?)
        LIMIT 1
      `,
      [name]
    );

    if (existsRows.length) {
      return res.status(409).json({ message: "Loai tin da ton tai." });
    }

    const [result] = await database.query(
      `
        INSERT INTO category_news (Name_category_news, Status)
        VALUES (?, ?)
      `,
      [name, status]
    );

    return res.status(201).json({
      message: "Them loai tin thanh cong.",
      item: {
        Id_category_news: result.insertId,
        Name_category_news: name,
        Status: status,
        Total_news: 0,
      },
    });
  } catch (error) {
    console.error("Loi tao loai tin:", error);
    return res.status(500).json({ message: "Loi server." });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const id = Number.parseInt(req.params.id, 10);
    const name = normalizeText(req.body?.Name_category_news);
    const status = toStatus(req.body?.Status, 1);

    if (!id) {
      return res.status(400).json({ message: "Id loai tin khong hop le." });
    }
    if (!name) {
      return res.status(400).json({ message: "Ten loai tin khong duoc de trong." });
    }

    const [existsRows] = await database.query(
      `
        SELECT Id_category_news
        FROM category_news
        WHERE LOWER(Name_category_news) = LOWER(?) AND Id_category_news <> ?
        LIMIT 1
      `,
      [name, id]
    );
    if (existsRows.length) {
      return res.status(409).json({ message: "Ten loai tin da ton tai." });
    }

    const [result] = await database.query(
      `
        UPDATE category_news
        SET Name_category_news = ?, Status = ?
        WHERE Id_category_news = ?
      `,
      [name, status, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Khong tim thay loai tin." });
    }

    return res.json({ message: "Cap nhat loai tin thanh cong." });
  } catch (error) {
    console.error("Loi cap nhat loai tin:", error);
    return res.status(500).json({ message: "Loi server." });
  }
});

router.patch("/:id/status", async (req, res) => {
  try {
    const id = Number.parseInt(req.params.id, 10);
    if (!id) {
      return res.status(400).json({ message: "Id loai tin khong hop le." });
    }

    const [rows] = await database.query(
      "SELECT Status FROM category_news WHERE Id_category_news = ? LIMIT 1",
      [id]
    );
    if (!rows.length) {
      return res.status(404).json({ message: "Khong tim thay loai tin." });
    }

    const nextStatus =
      req.body?.Status === undefined
        ? Number(rows[0].Status) === 1
          ? 0
          : 1
        : toStatus(req.body.Status, Number(rows[0].Status));

    await database.query(
      "UPDATE category_news SET Status = ? WHERE Id_category_news = ?",
      [nextStatus, id]
    );

    return res.json({
      message: nextStatus === 1 ? "Loai tin da duoc hien." : "Loai tin da duoc an.",
      Status: nextStatus,
    });
  } catch (error) {
    console.error("Loi doi trang thai loai tin:", error);
    return res.status(500).json({ message: "Loi server." });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const id = Number.parseInt(req.params.id, 10);
    if (!id) {
      return res.status(400).json({ message: "Id loai tin khong hop le." });
    }

    const [usedRows] = await database.query(
      "SELECT COUNT(*) AS total FROM news WHERE Id_category_news = ?",
      [id]
    );
    if (Number(usedRows[0]?.total || 0) > 0) {
      return res.status(409).json({
        message: "Loai tin dang co bai viet, khong the xoa.",
      });
    }

    const [result] = await database.query(
      "DELETE FROM category_news WHERE Id_category_news = ?",
      [id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Khong tim thay loai tin." });
    }

    return res.json({ message: "Xoa loai tin thanh cong." });
  } catch (error) {
    console.error("Loi xoa loai tin:", error);
    return res.status(500).json({ message: "Loi server." });
  }
});

export default router;
