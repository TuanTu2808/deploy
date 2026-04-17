import express from "express";
import database from "../database.js";

const router = express.Router();

const normalizeText = (value) => String(value ?? "").trim();
const toInt = (value, fallback = 0) => {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

router.get("/categories", async (_req, res) => {
  try {
    const [rows] = await database.query(
      `
        SELECT
          Id_category_news,
          Name_category_news
        FROM category_news
        WHERE Status = 1
        ORDER BY Id_category_news DESC
      `
    );
    return res.json(rows);
  } catch (error) {
    console.error("Loi lay danh sach loai tin:", error);
    return res.status(500).json({ message: "Loi server." });
  }
});

router.get("/", async (req, res) => {
  try {
    const page = Math.max(1, toInt(req.query.page, 1));
    const limit = Math.min(50, Math.max(1, toInt(req.query.limit, 9)));
    const offset = (page - 1) * limit;

    const search = normalizeText(req.query.search);
    const categoryId = toInt(req.query.categoryId, 0);

    const where = ["n.Status = 1", "c.Status = 1"];
    const params = [];

    if (categoryId > 0) {
      where.push("n.Id_category_news = ?");
      params.push(categoryId);
    }

    if (search) {
      where.push("(n.Title LIKE ? OR n.Content LIKE ?)");
      params.push(`%${search}%`, `%${search}%`);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const [rows] = await database.query(
      `
        SELECT
          n.Id_news,
          n.Title,
          n.Slug,
          n.Content,
          n.Thumbnail,
          n.Status,
          n.Id_category_news,
          c.Name_category_news
        FROM news n
        JOIN category_news c ON c.Id_category_news = n.Id_category_news
        ${whereSql}
        ORDER BY n.Id_news DESC
        LIMIT ? OFFSET ?
      `,
      [...params, limit, offset]
    );

    const [countRows] = await database.query(
      `
        SELECT COUNT(*) AS total
        FROM news n
        JOIN category_news c ON c.Id_category_news = n.Id_category_news
        ${whereSql}
      `,
      params
    );

    return res.json({
      items: rows,
      pagination: {
        page,
        limit,
        total: Number(countRows[0]?.total || 0),
      },
    });
  } catch (error) {
    console.error("Loi lay danh sach tin tuc:", error);
    return res.status(500).json({ message: "Loi server." });
  }
});

router.get("/:slug", async (req, res) => {
  try {
    const slug = normalizeText(req.params.slug);
    if (!slug) {
      return res.status(400).json({ message: "Slug khong hop le." });
    }

    const [rows] = await database.query(
      `
        SELECT
          n.Id_news,
          n.Title,
          n.Slug,
          n.Content,
          n.Thumbnail,
          n.Status,
          n.Id_category_news,
          c.Name_category_news
        FROM news n
        JOIN category_news c ON c.Id_category_news = n.Id_category_news
        WHERE n.Slug = ? AND n.Status = 1 AND c.Status = 1
        LIMIT 1
      `,
      [slug]
    );

    const item = rows[0] || null;
    if (!item) {
      return res.status(404).json({ message: "Khong tim thay bai viet." });
    }

    const [relatedRows] = await database.query(
      `
        SELECT
          n.Id_news,
          n.Title,
          n.Slug,
          n.Thumbnail,
          n.Id_category_news
        FROM news n
        JOIN category_news c ON c.Id_category_news = n.Id_category_news
        WHERE
          n.Status = 1
          AND c.Status = 1
          AND n.Id_news <> ?
          AND n.Id_category_news = ?
        ORDER BY n.Id_news DESC
        LIMIT 5
      `,
      [item.Id_news, item.Id_category_news]
    );

    return res.json({
      item,
      related: relatedRows,
    });
  } catch (error) {
    console.error("Loi lay chi tiet tin tuc:", error);
    return res.status(500).json({ message: "Loi server." });
  }
});

export default router;
