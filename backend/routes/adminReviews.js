import express from "express";
import database from "../database.js";

const router = express.Router();

const REVIEW_VIEWS = new Set(["services", "products"]);
const SERVICE_SOURCES = new Set(["all", "service", "stylist"]);
const REVIEW_SORTS = new Set(["attention", "newest", "oldest", "highest", "lowest"]);

const ENTITY_CONFIG = {
  service: { table: "booking_rating", idColumn: "Id_Booking_rating", view: "services", type: "service" },
  stylist: { table: "stylist_rating", idColumn: "Id_Stylist_rating", view: "services", type: "stylist" },
  product: { table: "product_comments", idColumn: "Id_product_comment", view: "products", type: "product" },
};

const normalizeText = (value) => String(value ?? "").trim();

const toPositiveInt = (value, fallback) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.floor(parsed);
};

const getServiceSourceQuery = () => `
  (
    SELECT
      'service' AS review_type,
      br.Id_Booking_rating AS review_id,
      COALESCE(br.Rating, 0) AS rating,
      '' AS comment,
      b.Created_booking AS created_at,
      u.Id_user AS customer_id,
      u.Name_user AS customer_name,
      u.Phone AS customer_phone,
      b.Id_booking AS booking_id,
      b.Booking_date AS booking_date,
      b.Status AS booking_status,
      COALESCE(s.Id_services, cb.Id_combo) AS subject_id,
      COALESCE(s.Name, cb.Name, 'Dịch vụ đã xóa') AS subject_name,
      CASE WHEN bd.Id_services IS NOT NULL THEN 'service' ELSE 'combo' END AS subject_type,
      COALESCE(cs.Name, 'Combo') AS category_name,
      st.Id_user AS stylist_id,
      st.Name_user AS stylist_name,
      store.Id_store AS store_id,
      store.Name_store AS store_name,
      '' AS related_services,
      '' AS brand_name
    FROM booking_rating br
    INNER JOIN booking_detail bd ON bd.Id_Booking_detail = br.Id_booking_detail
    INNER JOIN bookings b ON b.Id_booking = bd.Id_booking
    LEFT JOIN services s ON s.Id_services = bd.Id_services
    LEFT JOIN categories_service cs ON cs.Id_category_service = s.Id_category_service
    LEFT JOIN combos cb ON cb.Id_combo = bd.Id_combo
    LEFT JOIN users u ON u.Id_user = br.Id_user
    LEFT JOIN users st ON st.Id_user = b.Id_stylist
    LEFT JOIN stores store ON store.Id_store = b.Id_store

    UNION ALL

    SELECT
      'stylist' AS review_type,
      sr.Id_Stylist_rating AS review_id,
      COALESCE(sr.Rating, 0) AS rating,
      '' AS comment,
      b.Created_booking AS created_at,
      u.Id_user AS customer_id,
      u.Name_user AS customer_name,
      u.Phone AS customer_phone,
      b.Id_booking AS booking_id,
      b.Booking_date AS booking_date,
      b.Status AS booking_status,
      st.Id_user AS subject_id,
      COALESCE(st.Name_user, 'Stylist đã rời hệ thống') AS subject_name,
      'stylist' AS subject_type,
      'Stylist' AS category_name,
      st.Id_user AS stylist_id,
      st.Name_user AS stylist_name,
      store.Id_store AS store_id,
      store.Name_store AS store_name,
      COALESCE(
        GROUP_CONCAT(
          DISTINCT COALESCE(s.Name, cb.Name)
          ORDER BY COALESCE(s.Name, cb.Name) ASC
          SEPARATOR ' • '
        ),
        ''
      ) AS related_services,
      '' AS brand_name
    FROM stylist_rating sr
    INNER JOIN bookings b ON b.Id_booking = sr.Id_booking
    LEFT JOIN booking_detail bd ON bd.Id_booking = b.Id_booking
    LEFT JOIN services s ON s.Id_services = bd.Id_services
    LEFT JOIN combos cb ON cb.Id_combo = bd.Id_combo
    LEFT JOIN users u ON u.Id_user = sr.Id_user
    LEFT JOIN users st ON st.Id_user = b.Id_stylist
    LEFT JOIN stores store ON store.Id_store = b.Id_store
    GROUP BY
      sr.Id_Stylist_rating,
      sr.Rating,
      b.Created_booking,
      u.Id_user,
      u.Name_user,
      u.Phone,
      b.Id_booking,
      b.Booking_date,
      b.Status,
      st.Id_user,
      st.Name_user,
      store.Id_store,
      store.Name_store
  )
`;

const getProductSourceQuery = () => `
  (
    SELECT
      'product' AS review_type,
      pc.Id_product_comment AS review_id,
      0 AS rating,
      COALESCE(pc.Content, '') AS comment,
      pc.Created_at AS created_at,
      u.Id_user AS customer_id,
      u.Name_user AS customer_name,
      u.Phone AS customer_phone,
      NULL AS booking_id,
      NULL AS booking_date,
      '' AS booking_status,
      p.Id_product AS subject_id,
      COALESCE(p.Name_product, 'Sản phẩm đã xóa') AS subject_name,
      'product' AS subject_type,
      COALESCE(cp.Name_category, 'Chưa phân loại') AS category_name,
      NULL AS stylist_id,
      '' AS stylist_name,
      NULL AS store_id,
      '' AS store_name,
      '' AS related_services,
      COALESCE(br.Name_brand, '') AS brand_name
    FROM product_comments pc
    LEFT JOIN users u ON u.Id_user = pc.Id_user
    LEFT JOIN products p ON p.Id_product = pc.Id_product
    LEFT JOIN categories_product cp ON cp.Id_category_products = p.Id_category_product
    LEFT JOIN brands br ON br.Id_brand = p.Id_brand
  )
`;

const getSourceQueryByView = (view) =>
  view === "products" ? getProductSourceQuery() : getServiceSourceQuery();

const buildWhereClause = ({ view, source, search, rating }) => {
  const clauses = [];
  const params = [];

  if (view === "services" && source !== "all") {
    clauses.push("review_type = ?");
    params.push(source);
  }

  if (view === "services") {
    if (rating === "low") {
      clauses.push("rating BETWEEN 1 AND 2");
    } else if (/^[1-5]$/.test(rating)) {
      clauses.push("rating = ?");
      params.push(Number(rating));
    }
  }

  if (search) {
    clauses.push(`
      (
        subject_name LIKE ?
        OR customer_name LIKE ?
        OR customer_phone LIKE ?
        OR stylist_name LIKE ?
        OR store_name LIKE ?
        OR category_name LIKE ?
        OR comment LIKE ?
        OR related_services LIKE ?
        OR brand_name LIKE ?
      )
    `);
    const keyword = `%${search}%`;
    params.push(
      keyword,
      keyword,
      keyword,
      keyword,
      keyword,
      keyword,
      keyword,
      keyword,
      keyword
    );
  }

  return {
    whereSql: clauses.length ? `WHERE ${clauses.join(" AND ")}` : "",
    params,
  };
};

const buildSortClause = (sort, view) => {
  switch (sort) {
    case "oldest":
      return "ORDER BY created_at ASC, review_id ASC";
    case "highest":
      return view === "services"
        ? "ORDER BY rating DESC, created_at DESC, review_id DESC"
        : "ORDER BY created_at DESC, review_id DESC";
    case "lowest":
      return view === "services"
        ? "ORDER BY rating ASC, created_at DESC, review_id DESC"
        : "ORDER BY created_at DESC, review_id DESC";
    case "attention":
      return view === "services"
        ? "ORDER BY CASE WHEN rating BETWEEN 1 AND 2 THEN 0 ELSE 1 END ASC, created_at DESC, review_id DESC"
        : "ORDER BY created_at DESC, review_id DESC";
    default:
      return "ORDER BY created_at DESC, review_id DESC";
  }
};

const mapReviewRow = (row) => ({
  id: Number(row.review_id),
  entity: row.review_type,
  rating: Number(row.rating || 0),
  comment: row.comment || "",
  createdAt: row.created_at || null,
  customer: {
    id: row.customer_id ? Number(row.customer_id) : null,
    name: row.customer_name || "Khách chưa cập nhật tên",
    phone: row.customer_phone || "",
  },
  booking: row.booking_id
    ? {
        id: Number(row.booking_id),
        date: row.booking_date,
        status: row.booking_status || "",
      }
    : null,
  subject: {
    id: row.subject_id ? Number(row.subject_id) : null,
    name: row.subject_name || "",
    type: row.subject_type || row.review_type,
    category: row.category_name || "",
    brand: row.brand_name || "",
  },
  stylist: row.stylist_id ? { id: Number(row.stylist_id), name: row.stylist_name || "" } : null,
  store: row.store_id ? { id: Number(row.store_id), name: row.store_name || "" } : null,
  relatedServices: row.related_services || "",
});

const getReviewRecord = async (entity, id) => {
  const config = ENTITY_CONFIG[entity];
  if (!config) return null;

  const [rows] = await database.query(
    `
      SELECT *
      FROM ${getSourceQueryByView(config.view)} review_source
      WHERE review_type = ? AND review_id = ?
      LIMIT 1
    `,
    [config.type, id]
  );

  return rows[0] ? mapReviewRow(rows[0]) : null;
};

router.get("/", async (req, res) => {
  try {
    const requestedView = normalizeText(req.query.view).toLowerCase();
    const requestedSource = normalizeText(req.query.source).toLowerCase();
    const requestedSort = normalizeText(req.query.sort).toLowerCase();

    const view = REVIEW_VIEWS.has(requestedView) ? requestedView : "services";
    const source = view === "services" && SERVICE_SOURCES.has(requestedSource) ? requestedSource : "all";
    const sort = REVIEW_SORTS.has(requestedSort) ? requestedSort : "attention";
    const rating = normalizeText(req.query.rating).toLowerCase() || "all";
    const search = normalizeText(req.query.search);
    const page = toPositiveInt(req.query.page, 1);
    const limit = Math.min(toPositiveInt(req.query.limit, 12), 50);
    const offset = (page - 1) * limit;

    const sourceQuery = getSourceQueryByView(view);
    const { whereSql, params } = buildWhereClause({ view, source, search, rating });

    const [summaryRows] = await database.query(
      `
        SELECT
          COUNT(*) AS total,
          COALESCE(ROUND(AVG(NULLIF(rating, 0)), 1), 0) AS avg_rating,
          COALESCE(SUM(CASE WHEN rating BETWEEN 1 AND 2 THEN 1 ELSE 0 END), 0) AS low_rating_count,
          COALESCE(SUM(CASE WHEN rating > 0 THEN 1 ELSE 0 END), 0) AS rated_count,
          COALESCE(SUM(CASE WHEN COALESCE(TRIM(comment), '') <> '' THEN 1 ELSE 0 END), 0) AS commented_count,
          COALESCE(COUNT(DISTINCT subject_name), 0) AS subject_count,
          COALESCE(SUM(CASE WHEN review_type = 'service' THEN 1 ELSE 0 END), 0) AS service_count,
          COALESCE(SUM(CASE WHEN review_type = 'stylist' THEN 1 ELSE 0 END), 0) AS stylist_count,
          COALESCE(SUM(CASE WHEN review_type = 'product' THEN 1 ELSE 0 END), 0) AS product_count
        FROM ${sourceQuery} review_source
        ${whereSql}
      `,
      params
    );

    const [rows] = await database.query(
      `
        SELECT *
        FROM ${sourceQuery} review_source
        ${whereSql}
        ${buildSortClause(sort, view)}
        LIMIT ? OFFSET ?
      `,
      [...params, limit, offset]
    );

    const summary = summaryRows[0] || {};
    const totalItems = Number(summary.total || 0);
    const totalPages = totalItems > 0 ? Math.ceil(totalItems / limit) : 0;

    return res.json({
      filters: {
        view,
        source,
        rating,
        sort,
        search,
        page,
        limit,
      },
      summary: {
        total: totalItems,
        avgRating: Number(summary.avg_rating || 0),
        lowRatingCount: Number(summary.low_rating_count || 0),
        ratedCount: Number(summary.rated_count || 0),
        commentedCount: Number(summary.commented_count || 0),
        subjectCount: Number(summary.subject_count || 0),
        serviceCount: Number(summary.service_count || 0),
        stylistCount: Number(summary.stylist_count || 0),
        productCount: Number(summary.product_count || 0),
      },
      pagination: {
        page,
        limit,
        totalItems,
        totalPages,
      },
      data: rows.map(mapReviewRow),
    });
  } catch (error) {
    console.error("Loi lay danh sach danh gia admin:", error);
    return res.status(500).json({ message: "Khong the tai danh sach danh gia." });
  }
});

router.get("/:entity/:id", async (req, res) => {
  try {
    const entity = normalizeText(req.params.entity).toLowerCase();
    const id = Number(req.params.id);

    if (!ENTITY_CONFIG[entity] || !id) {
      return res.status(400).json({ message: "Loai danh gia hoac id khong hop le." });
    }

    const review = await getReviewRecord(entity, id);
    if (!review) {
      return res.status(404).json({ message: "Khong tim thay danh gia." });
    }

    return res.json(review);
  } catch (error) {
    console.error("Loi lay chi tiet danh gia admin:", error);
    return res.status(500).json({ message: "Khong the tai chi tiet danh gia." });
  }
});

router.delete("/:entity/:id", async (req, res) => {
  try {
    const entity = normalizeText(req.params.entity).toLowerCase();
    const id = Number(req.params.id);
    const config = ENTITY_CONFIG[entity];

    if (!config || !id) {
      return res.status(400).json({ message: "Loai danh gia hoac id khong hop le." });
    }

    const [result] = await database.query(
      `DELETE FROM ${config.table} WHERE ${config.idColumn} = ?`,
      [id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ message: "Khong tim thay danh gia can xoa." });
    }

    return res.json({ message: "Da xoa danh gia thanh cong." });
  } catch (error) {
    console.error("Loi xoa danh gia:", error);
    return res.status(500).json({ message: "Khong the xoa danh gia." });
  }
});

export default router;
