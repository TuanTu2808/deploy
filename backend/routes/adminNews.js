import express from "express";
import database from "../database.js";

const router = express.Router();

const normalizeText = (value) => String(value ?? "").trim();
const toStatus = (value, fallback = 1) => {
  if (value === undefined || value === null || value === "") return fallback;
  const parsed = Number.parseInt(String(value), 10);
  return parsed === 0 ? 0 : 1;
};

const toInt = (value, fallback = 0) => {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const slugify = (value) => {
  const raw = normalizeText(value).toLowerCase();
  if (!raw) return "";
  return raw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
};

const ensureUniqueSlug = async (baseSlug, excludeId = 0) => {
  let slug = baseSlug || `news-${Date.now()}`;
  let attempt = 1;

  while (attempt <= 1000) {
    const [rows] = await database.query(
      `
        SELECT Id_news
        FROM news
        WHERE Slug = ? AND Id_news <> ?
        LIMIT 1
      `,
      [slug, excludeId]
    );

    if (!rows.length) return slug;
    attempt += 1;
    slug = `${baseSlug}-${attempt}`;
  }

  return `${baseSlug}-${Date.now()}`;
};

const mapNewsRow = (row) => ({
  Id_news: row.Id_news,
  Title: row.Title,
  Slug: row.Slug,
  Content: row.Content,
  Thumbnail: row.Thumbnail,
  Status: row.Status,
  Id_category_news: row.Id_category_news,
  Name_category_news: row.Name_category_news,
});

router.get("/", async (req, res) => {
  try {
    const search = normalizeText(req.query.search);
    const categoryId = toInt(req.query.categoryId, 0);
    const status = req.query.status !== undefined ? toStatus(req.query.status, 1) : null;

    const where = [];
    const params = [];

    if (search) {
      where.push("(n.Title LIKE ? OR n.Content LIKE ?)");
      params.push(`%${search}%`, `%${search}%`);
    }

    if (categoryId > 0) {
      where.push("n.Id_category_news = ?");
      params.push(categoryId);
    }

    if (status !== null) {
      where.push("n.Status = ?");
      params.push(status);
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
      `,
      params
    );

    return res.json(rows.map(mapNewsRow));
  } catch (error) {
    console.error("Loi lay danh sach tin tuc admin:", error);
    return res.status(500).json({ message: "Loi server." });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = toInt(req.params.id, 0);
    if (!id) {
      return res.status(400).json({ message: "Id bai viet khong hop le." });
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
        WHERE n.Id_news = ?
        LIMIT 1
      `,
      [id]
    );

    const item = rows[0] ? mapNewsRow(rows[0]) : null;
    if (!item) {
      return res.status(404).json({ message: "Khong tim thay bai viet." });
    }

    return res.json(item);
  } catch (error) {
    console.error("Loi lay chi tiet tin tuc admin:", error);
    return res.status(500).json({ message: "Loi server." });
  }
});

router.post("/", async (req, res) => {
  try {
    const title = normalizeText(req.body?.Title);
    const content = normalizeText(req.body?.Content);
    const thumbnail = normalizeText(req.body?.Thumbnail);
    const categoryId = toInt(req.body?.Id_category_news, 0);
    const status = toStatus(req.body?.Status, 1);

    if (!title || !content || !thumbnail || !categoryId) {
      return res.status(400).json({ message: "Thieu thong tin bat buoc." });
    }

    const [categoryRows] = await database.query(
      "SELECT Id_category_news FROM category_news WHERE Id_category_news = ? LIMIT 1",
      [categoryId]
    );
    if (!categoryRows.length) {
      return res.status(404).json({ message: "Loai tin khong ton tai." });
    }

    const requestedSlug = slugify(req.body?.Slug || title);
    const baseSlug = requestedSlug || `news-${Date.now()}`;
    const uniqueSlug = await ensureUniqueSlug(baseSlug, 0);

    const [result] = await database.query(
      `
        INSERT INTO news (Title, Slug, Content, Thumbnail, Status, Id_category_news)
        VALUES (?, ?, ?, ?, ?, ?)
      `,
      [title, uniqueSlug, content, thumbnail, status, categoryId]
    );

    return res.status(201).json({
      message: "Tao bai viet thanh cong.",
      item: {
        Id_news: result.insertId,
        Title: title,
        Slug: uniqueSlug,
        Content: content,
        Thumbnail: thumbnail,
        Status: status,
        Id_category_news: categoryId,
      },
    });
  } catch (error) {
    console.error("Loi tao tin tuc:", error);
    return res.status(500).json({ message: "Loi server." });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const id = toInt(req.params.id, 0);
    if (!id) {
      return res.status(400).json({ message: "Id bai viet khong hop le." });
    }

    const [currentRows] = await database.query(
      "SELECT * FROM news WHERE Id_news = ? LIMIT 1",
      [id]
    );
    const current = currentRows[0] || null;
    if (!current) {
      return res.status(404).json({ message: "Khong tim thay bai viet." });
    }

    const title = normalizeText(req.body?.Title) || current.Title;
    const content = normalizeText(req.body?.Content) || current.Content;
    const thumbnail = normalizeText(req.body?.Thumbnail) || current.Thumbnail;
    const categoryId = toInt(req.body?.Id_category_news, current.Id_category_news);
    const status = toStatus(req.body?.Status, current.Status);

    if (!title || !content || !thumbnail || !categoryId) {
      return res.status(400).json({ message: "Thieu thong tin bat buoc." });
    }

    const [categoryRows] = await database.query(
      "SELECT Id_category_news FROM category_news WHERE Id_category_news = ? LIMIT 1",
      [categoryId]
    );
    if (!categoryRows.length) {
      return res.status(404).json({ message: "Loai tin khong ton tai." });
    }

    const requestedSlug = slugify(req.body?.Slug || title);
    const baseSlug = requestedSlug || current.Slug;
    const uniqueSlug = await ensureUniqueSlug(baseSlug, id);

    await database.query(
      `
        UPDATE news
        SET
          Title = ?,
          Slug = ?,
          Content = ?,
          Thumbnail = ?,
          Status = ?,
          Id_category_news = ?
        WHERE Id_news = ?
      `,
      [title, uniqueSlug, content, thumbnail, status, categoryId, id]
    );

    return res.json({ message: "Cap nhat bai viet thanh cong." });
  } catch (error) {
    console.error("Loi cap nhat tin tuc:", error);
    return res.status(500).json({ message: "Loi server." });
  }
});

router.patch("/:id/status", async (req, res) => {
  try {
    const id = toInt(req.params.id, 0);
    if (!id) {
      return res.status(400).json({ message: "Id bai viet khong hop le." });
    }

    const [rows] = await database.query(
      "SELECT Status FROM news WHERE Id_news = ? LIMIT 1",
      [id]
    );
    if (!rows.length) {
      return res.status(404).json({ message: "Khong tim thay bai viet." });
    }

    const nextStatus =
      req.body?.Status === undefined
        ? Number(rows[0].Status) === 1
          ? 0
          : 1
        : toStatus(req.body.Status, Number(rows[0].Status));

    await database.query("UPDATE news SET Status = ? WHERE Id_news = ?", [
      nextStatus,
      id,
    ]);

    return res.json({
      message: nextStatus === 1 ? "Da hien bai viet." : "Da an bai viet.",
      Status: nextStatus,
    });
  } catch (error) {
    console.error("Loi doi trang thai tin tuc:", error);
    return res.status(500).json({ message: "Loi server." });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const id = toInt(req.params.id, 0);
    if (!id) {
      return res.status(400).json({ message: "Id bai viet khong hop le." });
    }

    const [result] = await database.query("DELETE FROM news WHERE Id_news = ?", [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Khong tim thay bai viet." });
    }

    return res.json({ message: "Xoa bai viet thanh cong." });
  } catch (error) {
    console.error("Loi xoa tin tuc:", error);
    return res.status(500).json({ message: "Loi server." });
  }
});

export default router;
