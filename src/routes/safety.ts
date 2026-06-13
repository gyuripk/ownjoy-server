import { Router, Request, Response } from "express";
import pool from "../db"; //database connection

const router = Router();

// GET /api/safety/routes
router.get("/routes", async (req: Request, res: Response) => {
  const { bbox } = req.query; //?bbox=126.8,37.4,127.1,37.7

  if (!bbox) {
    res.status(400).json({ error: "bbox query parameter is required" });
    return;
  }

  const [west, south, east, north] = (bbox as string).split(",").map(Number); //"126.8,37.4,127.1,37.7"

  //Sends a SQL query to PostgreSQL and waits for the result
  const result = await pool.query(
    `SELECT
      route_id,
      route_name,
      district,
      neighborhood,
      bell_count,
      cctv_count,
      lamp_count,
      length_m,
      ST_AsGeoJSON(location)::json AS geometry
    FROM safety.safe_return_routes
    WHERE ST_Intersects(
      location,
      ST_MakeEnvelope($1, $2, $3, $4, 4326)
    )`,
    [west, south, east, north],
  );

  //Builds a GeoJSON FeatureCollection
  res.json({
    type: "FeatureCollection",
    features: result.rows.map((row) => ({
      type: "Feature",
      geometry: row.geometry,
      properties: {
        route_id: row.route_id,
        route_name: row.route_name,
        district: row.district,
        neighborhood: row.neighborhood,
        bell_count: row.bell_count,
        cctv_count: row.cctv_count,
        lamp_count: row.lamp_count,
        length_m: row.length_m,
      },
    })),
  });
});

export default router;
