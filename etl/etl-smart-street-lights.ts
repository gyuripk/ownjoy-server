import "dotenv/config";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const API_URL =
  "https://api.data.go.kr/openapi/tn_pubr_public_smart_streetlight_api";
const API_KEY = process.env.PUB_DATA_KEY;

async function fetchPage(pageNo: number) {
  const url = `${API_URL}?serviceKey=${API_KEY}&type=json&numOfRows=1000&pageNo=${pageNo}`;
  const res = await fetch(url);
  const data = await res.json();
  return data.response.body;
}

function transform(item: any) {
  return {
    region_code: item.insttCode || null,
    lamp_type: item.streetLampType || null,
    road_address: item.rdnmadr || null,
    lot_address: item.lnmadr || null,
    always_on: item.lghtUsgsttYn === "Y",
    has_cctv: item.cctvYn === "Y",
    has_wifi: item.wifiYn === "Y",
    has_gps: item.gpsYn === "Y",
    has_beacon: item.beaconYn === "Y",
    has_emergency_call: item.emrgncSttemntPosblYn === "Y",
    created_date: item.referenceDate || null,
    longitude: parseFloat(item.longitude),
    latitude: parseFloat(item.latitude),
  };
}

async function insertRecord(item: ReturnType<typeof transform>) {
  await pool.query(
    `INSERT INTO safety.smart_street_lights (
      region_code, lamp_type, road_address, lot_address,
      always_on, has_cctv, has_wifi, has_gps, has_beacon,
      has_emergency_call, created_date, location, refreshed_at
    ) VALUES (
      $1, $2, $3, $4,
      $5, $6, $7, $8, $9,
      $10, $11, ST_SetSRID(ST_MakePoint($12, $13), 4326), now()
    )`,
    [
      item.region_code,
      item.lamp_type,
      item.road_address,
      item.lot_address,
      item.always_on,
      item.has_cctv,
      item.has_wifi,
      item.has_gps,
      item.has_beacon,
      item.has_emergency_call,
      item.created_date,
      item.longitude,
      item.latitude,
    ],
  );
}

async function main() {
  console.log("Starting ETL for smart_street_lights...");
  await pool.query(
    "TRUNCATE TABLE safety.smart_street_lights RESTART IDENTITY",
  );

  const firstPage = await fetchPage(1);
  const totalCount = parseInt(firstPage.totalCount);
  const totalPages = Math.ceil(totalCount / 1000);
  console.log(`Total records: ${totalCount}, Total pages: ${totalPages}`);

  for (let page = 1; page <= totalPages; page++) {
    const body = await fetchPage(page);
    const items = body.items;
    for (const item of items) {
      await insertRecord(transform(item));
    }
    console.log(`Page ${page}/${totalPages} done`);
  }

  await pool.end();
  console.log("ETL complete.");
}

main();
