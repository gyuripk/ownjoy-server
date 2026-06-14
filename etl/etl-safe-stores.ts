import "dotenv/config";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const API_URL =
  "https://api.data.go.kr/openapi/tn_pubr_public_female_safety_prtchouse_api";
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
    name: item.storNm || null,
    road_address: item.rdnmadr || null,
    lot_address: item.lnmadr || null,
    phone: item.phoneNumber || null,
    police_station: item.cmptncPolcsttnNm || null,
    is_operating: item.useYn === "Y",
    created_date: item.referenceDate || null,
    longitude: parseFloat(item.longitude),
    latitude: parseFloat(item.latitude),
  };
}

async function insertRecord(item: ReturnType<typeof transform>) {
  await pool.query(
    `INSERT INTO safety.safe_stores (
      region_code, name, road_address, lot_address,
      phone, police_station, is_operating, created_date,
      location, refreshed_at
    ) VALUES (
      $1, $2, $3, $4,
      $5, $6, $7, $8,
      ST_SetSRID(ST_MakePoint($9, $10), 4326), now()
    )`,
    [
      item.region_code,
      item.name,
      item.road_address,
      item.lot_address,
      item.phone,
      item.police_station,
      item.is_operating,
      item.created_date,
      item.longitude,
      item.latitude,
    ],
  );
}

async function main() {
  console.log("Starting ETL for safe_stores...");
  await pool.query("TRUNCATE TABLE safety.safe_stores RESTART IDENTITY"); // delete all rows & reset id counter

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
