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

// GET /api/safety/delivery-boxes
router.get("/delivery-boxes", async (req: Request, res: Response) => {
  // accept bbox from req
  const { bbox } = req.query;

  if (!bbox) {
    res.status(400).json({ error: "bbox query parameter is required" });
    return;
  }

  // parse bbox
  const [west, south, east, north] = (bbox as string)
    .split(",")
    .map((item) => Number(item));

  // query db
  const result = await pool.query(
    `SELECT
      id,
      name,
      road_address,
      weekday_open,
      weekday_close,
      saturday_open,
      saturday_close,
      holiday_open,
      holiday_close,
      late_fee,
      free_hours,
      support_phone,
      ST_AsGeoJSON(location)::json AS geometry
    FROM safety.safe_delivery_boxes
    WHERE ST_Intersects(
      location,
      ST_MakeEnvelope($1, $2, $3, $4, 4326)
    )`,
    [west, south, east, north],
  );

  res.json({
    type: "FeatureCollection",
    features: result.rows.map((row) => ({
      type: "Feature",
      geometry: row.geometry,
      properties: {
        id: row.id,
        name: row.name,
        road_address: row.road_address,
        weekday_open: row.weekday_open,
        weekday_close: row.weekday_close,
        saturday_open: row.saturday_open,
        saturday_close: row.saturday_close,
        holiday_open: row.holiday_open,
        holiday_close: row.holiday_close,
        late_fee: row.late_fee,
        free_hours: row.free_hours,
        support_phone: row.support_phone,
      },
    })),
  });
});

// GET /api/safety/emergency-bells
router.get("/emergency-bells", async (req: Request, res: Response) => {
  // get request
  // get bbox from query
  const { bbox } = req.query;

  if (!bbox) {
    res.status(400).json({ error: "bbox query parameter is required!" });
    return;
  }

  // parse bbox
  const [west, south, east, north] = (bbox as string).split(",").map(Number);

  // send query to DB
  // get data from db
  const result = await pool.query(
    `SELECT
      source_id,
      install_place_type,
      install_location,
      link_method,
      police_linked,
      security_linked,
      office_linked,
      is_working,
      road_address,
      ST_AsGeoJSON(location)::json AS geometry
    FROM safety.emergency_bells
    WHERE ST_Intersects(
      location,
      ST_MakeEnvelope($1, $2, $3, $4, 4326)
    )`,
    [west, south, east, north],
  );
  // only bbox area data
  // build response
  res.json({
    type: "FeatureCollection",
    features: result.rows.map((row) => ({
      type: "Feature",
      geometry: row.geometry,
      properties: {
        source_id: row.source_id,
        install_place_type: row.install_place_type,
        install_location: row.install_location,
        link_method: row.link_method,
        police_linked: row.police_linked,
        security_linked: row.security_linked,
        office_linked: row.office_linked,
        is_working: row.is_working,
        road_address: row.road_address,
      },
    })),
  });
});

// GET /api/safety/safe-stores
router.get("/safe-stores", async (req: Request, res: Response) => {
  const { bbox } = req.query;

  if (!bbox) {
    res.status(400).json({ error: "bbox query parameter is required" });
    return;
  }

  const [west, south, east, north] = (bbox as string).split(",").map(Number);

  const result = await pool.query(
    `SELECT
      id,
      name,
      road_address,
      phone,
      police_station,
      is_operating,
      ST_AsGeoJSON(location)::json AS geometry
    FROM safety.safe_stores
    WHERE ST_Intersects(
      location,
      ST_MakeEnvelope($1, $2, $3, $4, 4326)
    )`,
    [west, south, east, north],
  );

  res.json({
    type: "FeatureCollection",
    features: result.rows.map((row) => ({
      type: "Feature",
      geometry: row.geometry,
      properties: {
        id: row.id,
        name: row.name,
        road_address: row.road_address,
        phone: row.phone,
        police_station: row.police_station,
        is_operating: row.is_operating,
      },
    })),
  });
});

// GET /api/safety/cctv
router.get("/cctv", async (req: Request, res: Response) => {
  const { bbox } = req.query;

  if (!bbox) {
    res.status(400).json({ error: "bbox query parameter is required" });
    return;
  }

  const [west, south, east, north] = (bbox as string).split(",").map(Number);

  const result = await pool.query(
    `SELECT
      source_id,
      road_address,
      lot_address,
      purpose,
      camera_count,
      ST_AsGeoJSON(location)::json AS geometry
    FROM safety.cctv
    WHERE ST_Intersects(
      location,
      ST_MakeEnvelope($1, $2, $3, $4, 4326)
    )`,
    [west, south, east, north],
  );

  res.json({
    type: "FeatureCollection",
    features: result.rows.map((row) => ({
      type: "Feature",
      geometry: row.geometry,
      properties: {
        source_id: row.source_id,
        road_address: row.road_address,
        lot_address: row.lot_address,
        purpose: row.purpose,
        camera_count: row.camera_count,
      },
    })),
  });
});

// GET /api/safety/smart-street-lights
router.get("/smart-street-lights", async (req: Request, res: Response) => {
  const { bbox } = req.query;

  if (!bbox) {
    res.status(400).json({ error: "bbox query parameter is required" });
    return;
  }

  const [west, south, east, north] = (bbox as string).split(",").map(Number);

  const result = await pool.query(
    `SELECT
      id,
      lamp_type,
      road_address,
      always_on,
      has_cctv,
      has_wifi,
      has_emergency_call,
      ST_AsGeoJSON(location)::json AS geometry
    FROM safety.smart_street_lights
    WHERE ST_Intersects(
      location,
      ST_MakeEnvelope($1, $2, $3, $4, 4326)
    )`,
    [west, south, east, north],
  );

  res.json({
    type: "FeatureCollection",
    features: result.rows.map((row) => ({
      type: "Feature",
      geometry: row.geometry,
      properties: {
        id: row.id,
        lamp_type: row.lamp_type,
        road_address: row.road_address,
        always_on: row.always_on,
        has_cctv: row.has_cctv,
        has_wifi: row.has_wifi,
        has_emergency_call: row.has_emergency_call,
      },
    })),
  });
});

// GET api/safety/police-facilities
router.get("/police-facilities", async (req: Request, res: Response) => {
  // get bbox param from req
  const { bbox } = req.query;

  if (!bbox) return res.status(400).json({ error: "bbox required" });

  // store as seperate variables
  const [west, south, east, north] = (bbox as string).split(",").map(Number);

  // send query using bbox value and get data from db
  const result = await pool.query(
    `SELECT
      source_id,
      name,
      facility_type,
      road_address,
      police_agency,
      police_station,
      ST_AsGeoJSON(location)::json AS geometry
    FROM safety.police_facilities
    WHERE ST_Intersects(
      location,
      ST_MakeEnvelope($1,$2,$3,$4,4326)
    )`,
    [west, south, east, north],
  );

  // build HTTP response with result as GeoJSON format
  res.json({
    // josn - body
    type: "FeatureCollection",
    features: result.rows.map((r) => ({
      type: "Feature",
      geometry: r.geometry,
      properties: {
        source_id: r.source_id,
        name: r.name,
        facility_type: r.facility_type,
        road_address: r.road_address,
        police_agency: r.police_agency,
        police_station: r.police_station,
      },
    })),
  });
});

export default router;
