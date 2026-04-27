import express from "express";
import database from "../database.js";

const router = express.Router();

const DASHBOARD_VIEWS = new Set(["products", "services"]);
const DASHBOARD_GRANULARITIES = new Set(["day", "month", "year"]);
const ACTIVE_STATUSES = ["pending"];

const pad = (value) => String(value).padStart(2, "0");

const toDateString = (date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const parseFlexibleDate = (raw) => {
  const source = String(raw ?? "").trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(source)) return new Date(`${source}T00:00:00`);
  if (/^\d{4}-\d{2}$/.test(source)) return new Date(`${source}-01T00:00:00`);
  if (/^\d{4}$/.test(source)) return new Date(`${source}-01-01T00:00:00`);
  return new Date();
};

const addDays = (date, amount) => {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
};

const addMonths = (date, amount) => {
  const next = new Date(date);
  next.setMonth(next.getMonth() + amount);
  return next;
};

const addYears = (date, amount) => {
  const next = new Date(date);
  next.setFullYear(next.getFullYear() + amount);
  return next;
};

const startOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1);
const startOfYear = (date) => new Date(date.getFullYear(), 0, 1);

const buildDashboardRange = (granularity, rawDate) => {
  const parsed = parseFlexibleDate(rawDate);

  if (granularity === "day") {
    const anchor = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
    const start = addDays(anchor, -6);
    const end = addDays(anchor, 1);
    const previousStart = addDays(start, -7);
    const previousEnd = start;

    return {
      start,
      end,
      previousStart,
      previousEnd,
      selectedValue: toDateString(anchor),
      rangeLabel: `7 ngày kết thúc ${pad(anchor.getDate())}/${pad(anchor.getMonth() + 1)}/${anchor.getFullYear()}`,
      comparisonLabel: "7 ngày trước",
    };
  }

  if (granularity === "year") {
    const anchor = startOfYear(parsed);
    const start = anchor;
    const end = addYears(start, 1);
    const previousStart = addYears(start, -1);
    const previousEnd = start;

    return {
      start,
      end,
      previousStart,
      previousEnd,
      selectedValue: String(anchor.getFullYear()),
      rangeLabel: `Năm ${anchor.getFullYear()}`,
      comparisonLabel: `Năm ${anchor.getFullYear() - 1}`,
    };
  }

  const anchor = startOfMonth(parsed);
  const start = anchor;
  const end = addMonths(start, 1);
  const previousStart = addMonths(start, -1);
  const previousEnd = start;

  return {
    start,
    end,
    previousStart,
    previousEnd,
    selectedValue: `${anchor.getFullYear()}-${pad(anchor.getMonth() + 1)}`,
    rangeLabel: `Tháng ${pad(anchor.getMonth() + 1)}/${anchor.getFullYear()}`,
    comparisonLabel:
      previousStart.getFullYear() === anchor.getFullYear()
        ? `Tháng ${pad(previousStart.getMonth() + 1)}`
        : `Tháng ${pad(previousStart.getMonth() + 1)}/${previousStart.getFullYear()}`,
  };
};

const buildBuckets = (granularity, start, end) => {
  const buckets = [];

  if (granularity === "day") {
    for (let cursor = new Date(start); cursor < end; cursor = addDays(cursor, 1)) {
      buckets.push({
        key: toDateString(cursor),
        label: `${pad(cursor.getDate())}/${pad(cursor.getMonth() + 1)}`,
      });
    }
    return buckets;
  }

  if (granularity === "year") {
    for (let month = 0; month < 12; month += 1) {
      const current = new Date(start.getFullYear(), month, 1);
      buckets.push({
        key: `${current.getFullYear()}-${pad(current.getMonth() + 1)}`,
        label: `T${current.getMonth() + 1}`,
      });
    }
    return buckets;
  }

  for (let cursor = new Date(start); cursor < end; cursor = addDays(cursor, 1)) {
    buckets.push({
      key: toDateString(cursor),
      label: pad(cursor.getDate()),
    });
  }
  return buckets;
};

const getBucketExpression = (dateColumn, granularity) => {
  if (granularity === "year") {
    return `DATE_FORMAT(${dateColumn}, '%Y-%m')`;
  }
  return `DATE_FORMAT(${dateColumn}, '%Y-%m-%d')`;
};

const getDashboardConfig = (view, storeId) => {
  if (view === "services") {
    const storeCond = storeId ? ` AND b.Id_store = ${Number(storeId)}` : "";
    return {
      summaryQuery: `
        SELECT
          COALESCE(SUM(CASE WHEN b.Status <> 'cancelled' THEN b.Total_price ELSE 0 END), 0) AS revenue,
          COALESCE(SUM(CASE WHEN b.Status <> 'cancelled' THEN 1 ELSE 0 END), 0) AS transactions,
          COALESCE(SUM(CASE WHEN b.Status IN ('pending', 'confirmed', 'processing') THEN 1 ELSE 0 END), 0) AS pending,
          COALESCE(SUM(CASE WHEN b.Status = 'completed' THEN 1 ELSE 0 END), 0) AS completed,
          COALESCE(SUM(CASE WHEN b.Status = 'cancelled' THEN 1 ELSE 0 END), 0) AS cancelled
        FROM Bookings b
        WHERE b.Booking_date >= ? AND b.Booking_date < ?${storeCond}
      `,
      previousRevenueQuery: `
        SELECT COALESCE(SUM(CASE WHEN b.Status <> 'cancelled' THEN b.Total_price ELSE 0 END), 0) AS revenue
        FROM Bookings b
        WHERE b.Booking_date >= ? AND b.Booking_date < ?${storeCond}
      `,
      unitsQuery: `
        SELECT COALESCE(COUNT(bd.Id_Booking_detail), 0) AS units
        FROM Booking_detail bd
        INNER JOIN Bookings b ON b.Id_booking = bd.Id_booking
        WHERE b.Status <> 'cancelled' AND b.Booking_date >= ? AND b.Booking_date < ?${storeCond}
      `,
      chartQuery: (granularity) => `
        SELECT
          ${getBucketExpression("b.Booking_date", granularity)} AS bucket_key,
          COALESCE(SUM(b.Total_price), 0) AS revenue
        FROM Bookings b
        WHERE b.Status <> 'cancelled' AND b.Booking_date >= ? AND b.Booking_date < ?${storeCond}
        GROUP BY bucket_key
        ORDER BY bucket_key ASC
      `,
      rankingQuery: `
        SELECT
          COALESCE(CONCAT('service-', sv.Id_services), CONCAT('combo-', cb.Id_combo)) AS id,
          COALESCE(sv.Name, cb.Name) AS name,
          COALESCE(cs.Name, 'Combo') AS category,
          COUNT(*) AS quantity,
          COALESCE(SUM(bd.Price_at_booking), 0) AS revenue
        FROM Booking_detail bd
        INNER JOIN Bookings b ON b.Id_booking = bd.Id_booking
        LEFT JOIN Services sv ON sv.Id_services = bd.Id_services
        LEFT JOIN Categories_service cs ON cs.Id_category_service = sv.Id_category_service
        LEFT JOIN Combos cb ON cb.Id_combo = bd.Id_combo
        WHERE b.Status <> 'cancelled' AND b.Booking_date >= ? AND b.Booking_date < ?${storeCond}
        GROUP BY id, name, category
        ORDER BY quantity DESC, revenue DESC, name ASC
        LIMIT 6
      `,
    };
  }

  return {
    summaryQuery: `
      SELECT
        COALESCE(SUM(CASE WHEN o.Status <> 'cancelled' THEN o.Final_amount ELSE 0 END), 0) AS revenue,
        COALESCE(SUM(CASE WHEN o.Status <> 'cancelled' THEN 1 ELSE 0 END), 0) AS transactions,
        COALESCE(SUM(CASE WHEN o.Status IN ('pending', 'confirmed', 'processing') THEN 1 ELSE 0 END), 0) AS pending,
        COALESCE(SUM(CASE WHEN o.Status = 'completed' THEN 1 ELSE 0 END), 0) AS completed,
        COALESCE(SUM(CASE WHEN o.Status = 'cancelled' THEN 1 ELSE 0 END), 0) AS cancelled
      FROM Orders o
      WHERE o.Created_order >= ? AND o.Created_order < ?
    `,
    previousRevenueQuery: `
      SELECT COALESCE(SUM(CASE WHEN o.Status <> 'cancelled' THEN o.Final_amount ELSE 0 END), 0) AS revenue
      FROM Orders o
      WHERE o.Created_order >= ? AND o.Created_order < ?
    `,
    unitsQuery: `
      SELECT COALESCE(SUM(od.Quantity), 0) AS units
      FROM Order_detail od
      INNER JOIN Orders o ON o.Id_order = od.Id_order
      WHERE o.Status <> 'cancelled' AND o.Created_order >= ? AND o.Created_order < ?
    `,
    chartQuery: (granularity) => `
      SELECT
        ${getBucketExpression("o.Created_order", granularity)} AS bucket_key,
        COALESCE(SUM(o.Final_amount), 0) AS revenue
      FROM Orders o
      WHERE o.Status <> 'cancelled' AND o.Created_order >= ? AND o.Created_order < ?
      GROUP BY bucket_key
      ORDER BY bucket_key ASC
    `,
    rankingQuery: `
      SELECT
        p.Id_product AS id,
        p.Name_product AS name,
        cp.Name_category AS category,
        COALESCE(SUM(od.Quantity), 0) AS quantity,
        COALESCE(SUM(od.Quantity * od.Price), 0) AS revenue,
        p.Quantity AS stock
      FROM Order_detail od
      INNER JOIN Orders o ON o.Id_order = od.Id_order
      INNER JOIN Products p ON p.Id_product = od.Id_product
      LEFT JOIN Categories_product cp ON cp.Id_category_products = p.Id_category_product
      WHERE o.Status <> 'cancelled' AND o.Created_order >= ? AND o.Created_order < ?
      GROUP BY p.Id_product, p.Name_product, cp.Name_category, p.Quantity
      ORDER BY quantity DESC, revenue DESC, name ASC
      LIMIT 6
    `,
  };
};

const calcChangePct = (current, previous) => {
  const safeCurrent = Number(current || 0);
  const safePrevious = Number(previous || 0);

  if (safePrevious === 0) {
    if (safeCurrent === 0) return 0;
    return null;
  }

  return ((safeCurrent - safePrevious) / safePrevious) * 100;
};

const getLowStockItems = async () => {
  const [rows] = await database.query(
    `
      SELECT
        p.Id_product AS id,
        p.Name_product AS name,
        p.Quantity AS quantity,
        cp.Name_category AS category
      FROM Products p
      LEFT JOIN Categories_product cp ON cp.Id_category_products = p.Id_category_product
      WHERE p.Status = 1 AND p.Quantity <= 15
      ORDER BY p.Quantity ASC, p.Id_product ASC
      LIMIT 6
    `
  );

  return rows.map((row) => ({
    id: Number(row.id),
    name: row.name,
    quantity: Number(row.quantity || 0),
    category: row.category || "",
  }));
};

const getPromotionStats = async () => {
  const [rows] = await database.query(
    `
      SELECT
        COUNT(*) AS total_active,
        COALESCE(
          SUM(
            CASE
              WHEN COALESCE(p.Sale_Price, 0) > 0 AND COALESCE(p.Sale_Price, 0) < COALESCE(p.Price, 0) THEN 1
              ELSE 0
            END
          ),
          0
        ) AS on_sale,
        COALESCE(
          SUM(
            CASE
              WHEN COALESCE(p.Sale_Price, 0) <= 0 OR COALESCE(p.Sale_Price, 0) >= COALESCE(p.Price, 0) THEN 1
              ELSE 0
            END
          ),
          0
        ) AS regular_price
      FROM Products p
      WHERE p.Status = 1
    `
  );

  const row = rows[0] || {};
  const totalActive = Number(row.total_active || 0);
  const onSale = Number(row.on_sale || 0);
  const regularPrice = Number(row.regular_price || Math.max(totalActive - onSale, 0));

  return {
    totalActive,
    onSale,
    regularPrice,
    percentage: totalActive > 0 ? (onSale / totalActive) * 100 : 0,
  };
};

const getBookingsNeedingAttention = async (storeId) => {
  const storeCond = storeId ? ` AND b.Id_store = ${Number(storeId)}` : "";
  const [rows] = await database.query(
    `
      SELECT
        b.Id_booking AS id,
        b.Booking_date AS booking_date,
        b.Start_time AS start_time,
        b.Status AS status,
        u.Name_user AS customer_name,
        s.Name_store AS store_name,
        GROUP_CONCAT(COALESCE(sv.Name, cb.Name) ORDER BY bd.Id_Booking_detail ASC SEPARATOR ' • ') AS services_preview
      FROM Bookings b
      LEFT JOIN Users u ON u.Id_user = b.Id_user
      LEFT JOIN Stores s ON s.Id_store = b.Id_store
      LEFT JOIN Booking_detail bd ON bd.Id_booking = b.Id_booking
      LEFT JOIN Services sv ON sv.Id_services = bd.Id_services
      LEFT JOIN Combos cb ON cb.Id_combo = bd.Id_combo
      WHERE b.Status IN (?) ${storeCond}
      GROUP BY b.Id_booking, b.Booking_date, b.Start_time, b.Status, u.Name_user, s.Name_store
      ORDER BY b.Booking_date ASC, b.Start_time ASC, b.Id_booking ASC
      LIMIT 6
    `,
    [ACTIVE_STATUSES]
  );

  return rows.map((row) => ({
    id: Number(row.id),
    bookingDate: row.booking_date,
    startTime: row.start_time,
    status: row.status,
    customerName: row.customer_name || "",
    storeName: row.store_name || "",
    servicesPreview: row.services_preview || "",
  }));
};

router.get("/", async (req, res) => {
  try {
    const requestedView = String(req.query.view ?? "products").trim().toLowerCase();
    const requestedGranularity = String(req.query.granularity ?? "month").trim().toLowerCase();

    const view = DASHBOARD_VIEWS.has(requestedView) ? requestedView : "products";
    const granularity = DASHBOARD_GRANULARITIES.has(requestedGranularity)
      ? requestedGranularity
      : "month";

    const range = buildDashboardRange(granularity, req.query.date);
    const config = getDashboardConfig(view, req.query.storeId);
    const rangeParams = [toDateString(range.start), toDateString(range.end)];
    const previousRangeParams = [toDateString(range.previousStart), toDateString(range.previousEnd)];

    const [summaryRows] = await database.query(config.summaryQuery, rangeParams);
    const [previousRows] = await database.query(config.previousRevenueQuery, previousRangeParams);
    const [unitRows] = await database.query(config.unitsQuery, rangeParams);
    const [chartRows] = await database.query(config.chartQuery(granularity), rangeParams);
    const [rankingRows] = await database.query(config.rankingQuery, rangeParams);
    const [lowStockItems, bookingsNeedingAttention, promotionStats] = await Promise.all([
      getLowStockItems(),
      getBookingsNeedingAttention(req.query.storeId),
      view === "products" ? getPromotionStats() : Promise.resolve(null),
    ]);

    const summary = summaryRows[0] || {};
    const previousRevenue = Number(previousRows[0]?.revenue || 0);
    const revenue = Number(summary.revenue || 0);
    const transactions = Number(summary.transactions || 0);
    const units = Number(unitRows[0]?.units || 0);
    const pending = Number(summary.pending || 0);
    const completed = Number(summary.completed || 0);
    const cancelled = Number(summary.cancelled || 0);
    const averageValue = transactions > 0 ? revenue / transactions : 0;
    const changePct = calcChangePct(revenue, previousRevenue);

    const bucketMap = new Map(
      chartRows.map((row) => [String(row.bucket_key), Number(row.revenue || 0)])
    );
    const chartBuckets = buildBuckets(granularity, range.start, range.end);

    return res.json({
      filters: {
        view,
        granularity,
        date: range.selectedValue,
        rangeLabel: range.rangeLabel,
        comparisonLabel: range.comparisonLabel,
        updatedAt: new Date().toISOString(),
      },
      summary: {
        revenue,
        previousRevenue,
        changePct,
        transactions,
        units,
        pending,
        completed,
        cancelled,
        averageValue,
      },
      chart: {
        labels: chartBuckets.map((bucket) => bucket.label),
        values: chartBuckets.map((bucket) => Number(bucketMap.get(bucket.key) || 0)),
      },
      ranking: rankingRows.map((row) => ({
        id: row.id,
        name: row.name || "",
        category: row.category || "",
        quantity: Number(row.quantity || 0),
        revenue: Number(row.revenue || 0),
        stock: row.stock !== undefined ? Number(row.stock || 0) : null,
      })),
      promotion: promotionStats,
      lowStock: lowStockItems,
      bookings: bookingsNeedingAttention,
    });
  } catch (error) {
    console.error("Loi lay tong hop dashboard admin:", error);
    return res.status(500).json({ message: "Khong the tai du lieu dashboard." });
  }
});

export default router;
