import express from "express";
import database from "../database.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
const { store, role, date } = req.query;

    let query = `
      SELECT DISTINCT
        u.Id_user,
        u.Name_user,
        u.Email,
        u.Phone,
        u.Pass_word,
        u.Address,
        u.role,
        u.Image,
        u.Id_store,
        s.Name_store
      FROM Users u
      LEFT JOIN Stores s ON u.Id_store = s.Id_store
      INNER JOIN Work_shifts ws ON ws.Id_user = u.Id_user
      WHERE u.role = 'stylist'
    `;

    const params = [];
    if (role) {
      query += ` AND u.role = '${role}'`;
    }

    // ✅ filter theo store
    if (store) {
      query += ` AND u.Id_store = ?`;
      params.push(Number(store));
    }

    // ✅ filter theo date (QUAN TRỌNG: đặt sau WHERE)
    if (date) {
      query += ` AND ws.Shift_date = ?`;
      params.push(date);
    }

    console.log("SQL:", query);
    console.log("PARAMS:", params);

    const [rows] = await database.query(query, params);

    res.json(rows);
  } catch (error) {
    console.error("THOCAT ERROR:", error); // 👈 QUAN TRỌNG
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
});
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT 
        u.Id_user,
        u.Name_user,
        u.Email,
        u.Phone,
        u.Pass_word,
        u.Address,
        u.role,
        u.Image,
        u.Id_store,
        s.Name_store
      FROM Users u
      LEFT JOIN Stores s ON u.Id_store = s.Id_store
      WHERE u.Id_user = ?
    `;

    const [rows] = await database.query(query, [Number(id)]);
    const stylist = rows[0] || null;

    if (!stylist) {
      return res.json(null);
    }

    // Get ratings for "cắt", "uốn", "nhuộm"
    const [ratingRows] = await database.query(`
      SELECT 
        AVG(br.Rating) as avgRating, 
        COUNT(br.Rating) as reviewCount,
        
        AVG(CASE WHEN LOWER(sv.Name) LIKE '%cắt%' OR LOWER(cb.Name) LIKE '%cắt%' THEN br.Rating ELSE NULL END) as avgCut,
        COUNT(CASE WHEN LOWER(sv.Name) LIKE '%cắt%' OR LOWER(cb.Name) LIKE '%cắt%' THEN br.Rating ELSE NULL END) as countCut,
        
        AVG(CASE WHEN LOWER(sv.Name) LIKE '%uốn%' OR LOWER(cb.Name) LIKE '%uốn%' THEN br.Rating ELSE NULL END) as avgPerm,
        COUNT(CASE WHEN LOWER(sv.Name) LIKE '%uốn%' OR LOWER(cb.Name) LIKE '%uốn%' THEN br.Rating ELSE NULL END) as countPerm,
        
        AVG(CASE WHEN LOWER(sv.Name) LIKE '%nhuộm%' OR LOWER(cb.Name) LIKE '%nhuộm%' THEN br.Rating ELSE NULL END) as avgDye,
        COUNT(CASE WHEN LOWER(sv.Name) LIKE '%nhuộm%' OR LOWER(cb.Name) LIKE '%nhuộm%' THEN br.Rating ELSE NULL END) as countDye

      FROM booking_rating br
      JOIN Booking_detail bd ON br.Id_booking_detail = bd.Id_Booking_detail
      JOIN Bookings b ON bd.Id_booking = b.Id_booking
      LEFT JOIN Services sv ON bd.Id_services = sv.Id_services
      LEFT JOIN Combos cb ON bd.Id_combo = cb.Id_combo
      WHERE b.Id_stylist = ? 
        AND (
          LOWER(sv.Name) LIKE '%cắt%' OR LOWER(sv.Name) LIKE '%uốn%' OR LOWER(sv.Name) LIKE '%nhuộm%' OR
          LOWER(cb.Name) LIKE '%cắt%' OR LOWER(cb.Name) LIKE '%uốn%' OR LOWER(cb.Name) LIKE '%nhuộm%'
        )
    `, [Number(id)]);

    // Get images
    const [imageRows] = await database.query(`
      SELECT bri.Image
      FROM booking_result_images bri
      JOIN Bookings b ON bri.Id_booking = b.Id_booking
      WHERE b.Id_stylist = ?
      ORDER BY bri.Id_booking DESC
      LIMIT 12
    `, [Number(id)]);

    res.json({
      ...stylist,
      avgRating: Number(ratingRows[0]?.avgRating || 0),
      reviewCount: Number(ratingRows[0]?.reviewCount || 0),
      ratingDetails: {
        cut: {
          avg: Number(ratingRows[0]?.avgCut || 0),
          count: Number(ratingRows[0]?.countCut || 0)
        },
        perm: {
          avg: Number(ratingRows[0]?.avgPerm || 0),
          count: Number(ratingRows[0]?.countPerm || 0)
        },
        dye: {
          avg: Number(ratingRows[0]?.avgDye || 0),
          count: Number(ratingRows[0]?.countDye || 0)
        }
      },
      resultImages: imageRows.map(r => r.Image)
    });
  } catch (error) {
    console.error("THOCAT ERROR:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
});

export default router;