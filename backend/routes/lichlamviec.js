import express from "express";
import database from "../database.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const { userId, date } = req.query;

    if (!userId || !date) {
      return res.status(400).json({
        message: "Thiếu userId hoặc date",
      });
    }

    const query = `
      SELECT 
        ws.Id_work_shifts,
        ws.Shift_date,
        ws.Start_time,
        ws.End_time,
        wsh.Id_work_shifts_hour,
        wsh.Hours,
        wsh.Status
      FROM Work_shifts ws
      LEFT JOIN Work_shifts_hours wsh 
        ON ws.Id_work_shifts = wsh.Id_work_shifts
      WHERE ws.Id_user = ?
        AND ws.Shift_date = ?
      ORDER BY wsh.Hours ASC
    `;

    const [rows] = await database.query(query, [userId, date]);

    if (rows.length === 0) {
      return res.json(null);
    }

    // Lấy thông tin ca làm việc (chỉ 1)
    const shift = {
      Id_work_shifts: rows[0].Id_work_shifts,
      Shift_date: rows[0].Shift_date,
      Start_time: rows[0].Start_time,
      End_time: rows[0].End_time,
    };

    // Lấy danh sách giờ (lọc null)
    const hours = rows
      .filter((r) => r.Id_work_shifts_hour !== null)
      .map((r) => ({
        Id_work_shifts_hour: r.Id_work_shifts_hour,
        Hours: r.Hours,
        Status: r.Status,
      }));

    res.json({
      shift,
      hours,
    });
  } catch (error) {
    console.error("WORKSHIFT ERROR:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;