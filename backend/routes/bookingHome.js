import express from "express";
import database from "../database.js";

const router = express.Router();

const HAIR_CATEGORY_IDS = new Set([1, 2, 3]);
const RELAX_CATEGORY_IDS = new Set([4, 5]);
const HAIR_COMBO_IDS = new Set([5, 6, 7, 11]);
const RELAX_COMBO_IDS = new Set([8, 9, 10]);

const splitCsvNumbers = (value) =>
  String(value || "")
    .split(",")
    .map((item) => Number(item.trim()))
    .filter((item) => Number.isFinite(item));

const splitCsvStrings = (value) =>
  String(value || "")
    .split("||")
    .map((item) => item.trim())
    .filter(Boolean);

const pickSection = (comboId, hairScore, relaxScore, categoryIds) => {
  if (HAIR_COMBO_IDS.has(comboId)) return "hair";
  if (RELAX_COMBO_IDS.has(comboId)) return "relax";

  if (hairScore === 0 && relaxScore === 0) {
    const hasHairCategory = categoryIds.some((id) => HAIR_CATEGORY_IDS.has(id));
    const hasRelaxCategory = categoryIds.some((id) =>
      RELAX_CATEGORY_IDS.has(id)
    );

    if (hasHairCategory && !hasRelaxCategory) return "hair";
    if (hasRelaxCategory && !hasHairCategory) return "relax";
    if (hasHairCategory && hasRelaxCategory) return "hair";

    return null;
  }

  return hairScore >= relaxScore ? "hair" : "relax";
};

router.get("/services", async (_req, res) => {
  try {
    const [rows] = await database.query(
      `
      SELECT
        c.Id_combo,
        c.Name,
        c.Price,
        c.Duration_time,
        c.Status,
        c.Image_URL,
        COALESCE(SUM(CASE WHEN s.Id_category_service IN (1, 2, 3) THEN 1 ELSE 0 END), 0) AS hair_score,
        COALESCE(SUM(CASE WHEN s.Id_category_service IN (4, 5) THEN 1 ELSE 0 END), 0) AS relax_score,
        GROUP_CONCAT(DISTINCT s.Id_category_service ORDER BY s.Id_category_service) AS category_ids,
        GROUP_CONCAT(DISTINCT cs.Name ORDER BY cs.Id_category_service SEPARATOR '||') AS category_names,
        COALESCE(
          c.Image_URL,
          (
            SELECT i.Image_URL
            FROM Combo_Detail cd_image
            JOIN Image_Services i ON i.Id_services = cd_image.Id_services
            WHERE cd_image.Id_combo = c.Id_combo
            ORDER BY i.Id_image_service ASC
            LIMIT 1
          )
        ) AS image_url,
        (
          SELECT s_desc.Description
          FROM Combo_Detail cd_desc
          JOIN Services s_desc ON s_desc.Id_services = cd_desc.Id_services
          WHERE cd_desc.Id_combo = c.Id_combo
            AND s_desc.Status = 1
            AND s_desc.Description IS NOT NULL
            AND TRIM(s_desc.Description) <> ''
          ORDER BY s_desc.Id_services ASC
          LIMIT 1
        ) AS description
      FROM Combos c
      LEFT JOIN Combo_Detail cd ON cd.Id_combo = c.Id_combo
      LEFT JOIN Services s ON s.Id_services = cd.Id_services AND s.Status = 1
      LEFT JOIN Categories_service cs ON cs.Id_category_service = s.Id_category_service
      WHERE c.Status = 1
      GROUP BY c.Id_combo, c.Name, c.Price, c.Duration_time, c.Status, c.Image_URL
      ORDER BY c.Id_combo DESC
      `
    );

    const combos = rows
      .map((row) => {
        const categoryIds = splitCsvNumbers(row.category_ids);
        const categoryNames = splitCsvStrings(row.category_names);
        const hairScore = Number(row.hair_score || 0);
        const relaxScore = Number(row.relax_score || 0);
        const comboId = Number(row.Id_combo);
        const section = pickSection(
          comboId,
          hairScore,
          relaxScore,
          categoryIds
        );

        if (!section) return null;

        return {
          Id_combo: comboId,
          Name: row.Name,
          Price: Number(row.Price || 0),
          Duration_time: Number(row.Duration_time || 0),
          Description: row.description || null,
          Image_URL: row.image_url || null,
          category_ids: categoryIds,
          category_names: categoryNames,
          section,
          hair_score: hairScore,
          relax_score: relaxScore,
        };
      })
      .filter(Boolean);

    const hair = combos.filter((combo) => combo.section === "hair");
    const relax = combos.filter((combo) => combo.section === "relax");

    return res.status(200).json({
      generated_at: new Date().toISOString(),
      sections: {
        hair: {
          key: "hair",
          title: "Dịch vụ tóc",
          combos: hair,
        },
        relax: {
          key: "relax",
          title: "Thư giãn & chăm sóc da",
          combos: relax,
        },
      },
    });
  } catch (error) {
    console.error("Lỗi lấy dữ liệu dịch vụ cho trang chủ Booking:", error);
    return res.status(500).json({
      message: "Không thể lấy dữ liệu dịch vụ trang chủ",
    });
  }
});

export default router;