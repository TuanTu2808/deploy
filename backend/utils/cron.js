import database from "../database.js";

const toMinutes = (timeStr) => {
  if (!timeStr) return 0;
  if (typeof timeStr === 'number') return timeStr;
  const StringTime = String(timeStr);
  if (!StringTime.includes(':')) return Number(StringTime) || 0;
  const parts = StringTime.split(':');
  const h = Number(parts[0]) || 0;
  const m = Number(parts[1]) || 0;
  return h * 60 + m;
};

export const startAutoCancelCron = () => {
  // Chạy định kỳ mỗi phút
  setInterval(async () => {
    let connection;
    try {
      connection = await database.getConnection();
      
      const [bookings] = await connection.query(`
        SELECT Id_booking, Id_stylist, Booking_date, Start_time
        FROM Bookings
        WHERE Status IN ('pending', 'confirmed')
      `);

      if (bookings.length === 0) {
        connection.release();
        return;
      }

      const now = new Date().getTime();

      for (const booking of bookings) {
        let startTimeMs = 0;
        if (booking.Start_time instanceof Date) {
          startTimeMs = booking.Start_time.getTime();
        } else {
          const startTimeStr = String(booking.Start_time || "");
          if (startTimeStr) {
            startTimeMs = startTimeStr.includes("T")
              ? new Date(startTimeStr).getTime()
              : new Date(startTimeStr.replace(" ", "T") + "+07:00").getTime();
          }
        }

        // Quá hạn 15 phút (15 * 60 * 1000 ms)
        if (startTimeMs > 0 && (now - startTimeMs) > 15 * 60 * 1000) {
          await connection.beginTransaction();
          try {
            // 1. Đổi trạng thái thành cancelled
            await connection.query(
              `UPDATE Bookings SET Status = 'cancelled', Description_cancel = 'Hệ thống tự động huỷ do quá 15 phút khách không đến' WHERE Id_booking = ?`,
              [booking.Id_booking]
            );

            // 2. Trả lại slot (nếu có stylist)
            if (booking.Id_stylist) {
              const [details] = await connection.query(
                "SELECT Duration_time FROM Booking_detail WHERE Id_booking = ?",
                [booking.Id_booking]
              );
              const totalDurationMin = details.reduce((sum, item) => sum + toMinutes(item.Duration_time), 0);

              const [shiftRows] = await connection.query(
                "SELECT Id_work_shifts FROM Work_shifts WHERE Id_user = ? AND Shift_date = ?",
                [booking.Id_stylist, booking.Booking_date]
              );

              if (shiftRows.length > 0) {
                let timeOnly = "";
                if (booking.Start_time instanceof Date) {
                  timeOnly = booking.Start_time.toTimeString().split(" ")[0];
                } else {
                  const parts = String(booking.Start_time).split(" ");
                  timeOnly = parts.length > 1 ? parts[1] : parts[0];
                  if (timeOnly.length === 5) timeOnly += ":00";
                }

                const numSlotsToUpdate = Math.max(1, Math.ceil(totalDurationMin / 30));
                const [allSlots] = await connection.query(
                  "SELECT Id_work_shifts_hour, Hours, Status FROM Work_shifts_hours WHERE Id_work_shifts = ? ORDER BY Hours ASC",
                  [shiftRows[0].Id_work_shifts]
                );
                
                const startIndex = allSlots.findIndex(s => String(s.Hours).substring(0, 5) === timeOnly.substring(0, 5));
                if (startIndex !== -1) {
                  const slotsToUpdate = allSlots.slice(startIndex, startIndex + numSlotsToUpdate);
                  const slotIds = slotsToUpdate.map(s => s.Id_work_shifts_hour);
                  if (slotIds.length > 0) {
                    await connection.query(
                      "UPDATE Work_shifts_hours SET Status = 1 WHERE Id_work_shifts_hour IN (?)",
                      [slotIds]
                    );
                  }
                }
              }
            }

            await connection.commit();
            console.log(`[CRON] Đã tự động huỷ lịch hẹn #${booking.Id_booking} do quá 15 phút.`);
          } catch (innerErr) {
            await connection.rollback();
            console.error(`[CRON] Lỗi khi huỷ lịch #${booking.Id_booking}:`, innerErr);
          }
        }
      }
    } catch (error) {
      console.error("[CRON] Lỗi khi chạy cron tự động huỷ:", error);
    } finally {
      if (connection) connection.release();
    }
  }, 60 * 1000); // Mỗi 60 giây
};
