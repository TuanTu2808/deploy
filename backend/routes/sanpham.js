import express from "express";
import database from "../database.js";
import multer from "multer";
import path from "path";
import { requireAdminAuth } from "../middleware/auth.js";

const router = express.Router();

/* ================= MULTER CONFIG ================= */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join("public", "image", "sanpham"));
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file.originalname.replace(/\s/g, "_");
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

/**
 * =========================
 * GET: Lấy tất cả sản phẩm + ảnh đại diện
 * =========================
 */
router.get("/", async (req, res) => {
  try {
    const [rows] = await database.query(`
      SELECT 
        p.*,
        c.Name_category AS Category_Name,
        b.Name_brand AS Brand_Name,
        (SELECT Image_url 
         FROM Image_products 
         WHERE Id_product = p.Id_product 
         LIMIT 1) AS Thumbnail
      FROM Products p
      LEFT JOIN Categories_Product c 
        ON p.Id_category_product = c.Id_category_products
      LEFT JOIN Brands b 
        ON p.Id_brand = b.Id_brand
      ORDER BY p.Id_product DESC
    `);

    res.json(rows);
  } catch (error) {
    console.error("Lỗi GET sản phẩm:", error);
    res.status(500).json({ error: "Lỗi server" });
  }
});

router.get("/flash-sale", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;

    const [rows] = await database.query(
      `
      SELECT 
        p.*,
        (SELECT Image_url 
         FROM Image_products 
         WHERE Id_product = p.Id_product 
         LIMIT 1) AS Thumbnail
      FROM Products p
      WHERE p.Sale_Price IS NOT NULL
      ORDER BY RAND()
      LIMIT ?
      `,
      [limit],
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Lỗi server" });
  }
});

router.get("/category/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await database.query(
      `
      SELECT 
        p.Id_product,
        p.Name_product,
        p.Price,
        p.Sale_Price,
        p.Quantity,
        p.Size,
        c.Name_category AS Category_Name,
        (
          SELECT Image_url
          FROM Image_products
          WHERE Id_product = p.Id_product
          LIMIT 1
        ) AS Thumbnail
      FROM Products p
      LEFT JOIN categories_product c
      ON p.Id_category_product = c.Id_category_products
      WHERE p.Id_category_product = ?
          LIMIT 4

      `,
      [id],
    );

    res.json(rows);
  } catch (err) {
    console.error("CATEGORY ERROR:", err);
    res.status(500).json({ error: "Lỗi server" });
  }
});
/**
 * =========================
 * GET: Tìm kiếm sản phẩm theo tên
 * - Fuzzy: sai chính tả / thiếu dấu vẫn tìm được
 * - Chính xác: kết quả khớp đúng dấu xếp lên đầu
 * =========================
 */
router.get("/search", async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || typeof q !== "string") {
      return res.json([]);
    }

    const trimmed = q.trim();
    if (!trimmed) return res.json([]);

    const searchTerm = `%${trimmed}%`;
    const startTerm = `${trimmed}%`;
    const wordStart = `% ${trimmed}%`;

    const [rows] = await database.query(
      `
      SELECT 
        p.*,
        c.Name_category AS Category_Name,
        b.Name_brand AS Brand_Name,
        (SELECT Image_url 
         FROM Image_products 
         WHERE Id_product = p.Id_product 
         LIMIT 1) AS Thumbnail,
        (
          CASE 
            WHEN BINARY LOWER(p.Name_product) = BINARY LOWER(?) THEN 10000
            WHEN BINARY LOWER(p.Name_product) LIKE BINARY LOWER(?) THEN 8000
            WHEN BINARY LOWER(p.Name_product) LIKE BINARY LOWER(?) THEN 6000
            WHEN BINARY LOWER(p.Name_product) LIKE BINARY LOWER(?) THEN 4000
            WHEN p.Name_product LIKE ? THEN 2000
            WHEN BINARY LOWER(c.Name_category) LIKE BINARY LOWER(?) THEN 500
            WHEN c.Name_category LIKE ? THEN 200
            WHEN b.Name_brand LIKE ? THEN 100
            ELSE 1
          END
        ) AS relevance_score
      FROM Products p
      LEFT JOIN Categories_Product c 
        ON p.Id_category_product = c.Id_category_products
      LEFT JOIN Brands b 
        ON p.Id_brand = b.Id_brand
      WHERE (
        p.Name_product LIKE ?
        OR c.Name_category LIKE ?
        OR b.Name_brand LIKE ?
      )
      ORDER BY relevance_score DESC, p.Id_product DESC
    `,
      [
        trimmed,      // SCORE: exact name (binary)
        startTerm,    // SCORE: name starts with (binary)
        wordStart,    // SCORE: word boundary (binary)
        searchTerm,   // SCORE: name contains (binary)
        searchTerm,   // SCORE: name contains (fuzzy/collation)
        searchTerm,   // SCORE: category exact accent
        searchTerm,   // SCORE: category fuzzy
        searchTerm,   // SCORE: brand fuzzy
        searchTerm,   // WHERE: name (fuzzy)
        searchTerm,   // WHERE: category (fuzzy)
        searchTerm,   // WHERE: brand (fuzzy)
      ],
    );

    res.json(rows);
  } catch (error) {
    console.error("Lỗi tìm kiếm sản phẩm:", error);
    res.status(500).json({ error: "Lỗi server" });
  }
});

/**
 * =========================
 * GET: Lọc sản phẩm theo danh mục, thương hiệu, giá
 * =========================
 */
router.get("/filter", async (req, res) => {
  try {
    const { categories, brands, priceMin, priceMax } = req.query;

    let sqlQuery = `
      SELECT 
        p.*,
        c.Name_category AS Category_Name,
        b.Name_brand AS Brand_Name,
        (SELECT Image_url 
         FROM Image_products 
         WHERE Id_product = p.Id_product 
         LIMIT 1) AS Thumbnail
      FROM Products p
      LEFT JOIN Categories_Product c 
        ON p.Id_category_product = c.Id_category_products
      LEFT JOIN Brands b 
        ON p.Id_brand = b.Id_brand
      WHERE 1=1
    `;

    const params = [];

    // Category
    if (categories) {
      const categoryList = Array.isArray(categories)
        ? categories
        : [categories];
      const placeholders = categoryList.map(() => "?").join(",");
      sqlQuery += ` AND c.Name_category IN (${placeholders})`;
      params.push(...categoryList);
    }

    // Brand
    if (brands) {
      const brandList = Array.isArray(brands) ? brands : [brands];
      const placeholders = brandList.map(() => "?").join(",");
      sqlQuery += ` AND b.Name_brand IN (${placeholders})`;
      params.push(...brandList);
    }

    // Price filter (sửa chỗ này)
    if (priceMin) {
      const minPrice = parseInt(priceMin.replace(/\./g, ""), 10);
      sqlQuery += ` AND IFNULL(p.Sale_Price, p.Price) >= ?`;
      params.push(minPrice);
    }

    if (priceMax) {
      const maxPrice = parseInt(priceMax.replace(/\./g, ""), 10);
      sqlQuery += ` AND IFNULL(p.Sale_Price, p.Price) <= ?`;
      params.push(maxPrice);
    }

    sqlQuery += ` ORDER BY p.Id_product DESC`;

    const [rows] = await database.query(sqlQuery, params);

    res.json(rows);
  } catch (error) {
    console.error("Lỗi lọc sản phẩm:", error);
    res.status(500).json({ error: "Lỗi server" });
  }
});

/**
 * =========================
 * GET: Lấy chi tiết sản phẩm theo ID
 * =========================
 */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await database.query(
      `
      SELECT 
        p.*,
        c.Name_category AS Category_Name,
        b.Name_brand AS Brand_Name,
        (SELECT Image_url 
         FROM Image_products 
         WHERE Id_product = p.Id_product 
         LIMIT 1) AS Thumbnail
      FROM Products p
      LEFT JOIN Categories_Product c 
        ON p.Id_category_product = c.Id_category_products
      LEFT JOIN Brands b 
        ON p.Id_brand = b.Id_brand
      WHERE p.Id_product = ?
    `,
      [id],
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Sản phẩm không tồn tại" });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error("Lỗi GET chi tiết sản phẩm:", error);
    res.status(500).json({ error: "Lỗi server" });
  }
});

/**
 * =========================
 * POST: Tạo sản phẩm + upload nhiều ảnh
 * =========================
 */
router.post(
  "/",
  requireAdminAuth,
  upload.array("images", 10),
  async (req, res) => {
    const connection = await database.getConnection();

    try {
      await connection.beginTransaction();

      const {
        Name_product,
        Quantity,
        Size,
        Price,
        Sale_Price,
        Description,
        Status,
        Id_category_product,
        Id_brand,
        Usage_Instructions,
        Ingredients,
      } = req.body;

      // Validate
      if (
        !Name_product ||
        Quantity == null ||
        Price == null ||
        !Id_category_product ||
        !Id_brand
      ) {
        return res.status(400).json({
          error: "Thiếu thông tin sản phẩm",
        });
      }

      // 1. Insert sản phẩm
      const [productResult] = await connection.query(
        `INSERT INTO Products 
      (Name_product, Quantity, Size, Price, Sale_Price, Description, Status, 
       Id_category_product, Id_brand, Usage_Instructions, Ingredients)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          Name_product,
          Number(Quantity),
          Size || null,
          Number(Price),
          Sale_Price || null,
          Description || null,
          Status || 1,
          Number(Id_category_product),
          Number(Id_brand),
          Usage_Instructions || null,
          Ingredients || null,
        ],
      );

      const productId = productResult.insertId;

      // 2. Insert nhiều ảnh nếu có
      if (req.files && req.files.length > 0) {
        const imageValues = req.files.map((file) => [
          productId,
          `/image/sanpham/${file.filename}`, // URL public
        ]);

        await connection.query(
          `INSERT INTO Image_products (Id_product, Image_url)
         VALUES ?`,
          [imageValues],
        );
      }

      await connection.commit();

      res.status(201).json({
        message: "Tạo sản phẩm + ảnh thành công",
        Id_product: productId,
      });
    } catch (error) {
      await connection.rollback();
      console.error("Lỗi tạo sản phẩm:", error);
      res.status(500).json({
        error: "Lỗi server khi tạo sản phẩm",
      });
    } finally {
      connection.release();
    }
  },
);
router.patch("/:id/status", requireAdminAuth, async (req, res) => {
  const id = req.params.id;
  const { Status } = req.body;

  await database.query("UPDATE Products SET Status = ? WHERE Id_product = ?", [
    Status,
    id,
  ]);

  res.json({ message: "Cập nhật trạng thái thành công" });
});
router.put(
  "/:id",
  requireAdminAuth,
  upload.array("images", 10),
  async (req, res) => {
    const id = req.params.id;

    try {
      const {
        Name_product,
        Quantity,
        Size,
        Price,
        Sale_Price,
        Description,
        Usage_Instructions,
        Ingredients,
        Id_category_product,
        Id_brand,
      } = req.body;

      await database.query(
        `UPDATE Products SET
        Name_product=?,
        Quantity=?,
        Size=?,
        Price=?,
        Sale_Price=?,
        Description=?,
        Usage_Instructions=?,
        Ingredients=?,
        Id_category_product=?,
        Id_brand=?
        WHERE Id_product=?`,
        [
          Name_product,
          Quantity,
          Size,
          Price,
          Sale_Price,
          Description,
          Usage_Instructions,
          Ingredients,
          Id_category_product,
          Id_brand,
          id,
        ],
      );

      const files = req.files;

      if (files && files.length > 0) {
        // xoá ảnh cũ
        await database.query("DELETE FROM image_products WHERE Id_product=?", [
          id,
        ]);

        // thêm ảnh mới
        for (const file of files) {
          await database.query(
            "INSERT INTO image_products (Image_URL, Id_product) VALUES (?,?)",
            [`/image/sanpham/${file.filename}`, id],
          );
        }
      }

      res.json({ message: "Cập nhật sản phẩm thành công" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Lỗi server" });
    }
  },
);
/**
 * =========================
 * GET: Lấy danh sách danh mục
 * =========================
 */
router.get("/categories/list", async (req, res) => {
  try {
    const [rows] = await database.query(`
      SELECT 
        Id_category_products AS id,
        Name_category AS name
      FROM Categories_Product
      WHERE Is_active = 1
      ORDER BY Name_category ASC
    `);

    res.json(rows);
  } catch (error) {
    console.error("Lỗi lấy danh mục:", error);
    res.status(500).json({ error: "Lỗi server" });
  }
});

/**
 * =========================
 * GET: Lấy danh sách thương hiệu
 * =========================
 */
router.get("/brands/list", async (req, res) => {
  try {
    const [rows] = await database.query(`
      SELECT 
        Id_brand AS id,
        Name_brand AS name
      FROM Brands
      ORDER BY Name_brand ASC
    `);

    res.json(rows);
  } catch (error) {
    console.error("Lỗi lấy thương hiệu:", error);
    res.status(500).json({ error: "Lỗi server" });
  }
});

export default router;
