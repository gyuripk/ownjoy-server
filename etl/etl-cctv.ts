import "dotenv/config";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const API_URL = "https://apis.data.go.kr/1741000/cctv_info/info";
const API_KEY = process.env.PUB_DATA_KEY;

async function fetchPage(page: number, retries = 3): Promise<any> {
  const url = `${API_URL}?serviceKey=${API_KEY}&pageNo=${page}&numOfRows=100`;
  const res = await fetch(url);
  const data = await res.json();
  if (!data.response?.body) {
    console.error(`Page ${page} bad response:`, JSON.stringify(data));
    if (retries > 0) {
      await new Promise((r) => setTimeout(r, 2000));
      return fetchPage(page, retries - 1);
    }
    throw new Error(`Failed to fetch page ${page}`);
  }
  return data.response.body;
}

function transform(item: any) {
  return {
    source_id: item.MNG_NO,
    region_code: item.OPN_ATMY_GRP_CD || null,
    road_address: item.LCTN_ROAD_NM_ADDR || null,
    lot_address: item.LCTN_LOTNO_ADDR || null,
    purpose: item.INSTL_PRPS_SE_NM || null,
    camera_count: parseInt(item.CAM_CNTOM) || null,
    created_date: item.DAT_CRTR_YMD || null,
    longitude: parseFloat(item.WGS84_LOT),
    latitude: parseFloat(item.WGS84_LAT),
  };
}

async function upsertRecord(item: ReturnType<typeof transform>) {
  await pool.query(
    `INSERT INTO safety.cctv (
      source_id, region_code, road_address, lot_address,
      purpose, camera_count, created_date, location, refreshed_at
    ) VALUES (
      $1, $2, $3, $4,
      $5, $6, $7, ST_SetSRID(ST_MakePoint($8, $9), 4326), now()
    )
    ON CONFLICT (source_id) DO UPDATE SET
      region_code = EXCLUDED.region_code,
      road_address = EXCLUDED.road_address,
      lot_address = EXCLUDED.lot_address,
      purpose = EXCLUDED.purpose,
      camera_count = EXCLUDED.camera_count,
      created_date = EXCLUDED.created_date,
      location = EXCLUDED.location,
      refreshed_at = now()`,
    [
      item.source_id,
      item.region_code,
      item.road_address,
      item.lot_address,
      item.purpose,
      item.camera_count,
      item.created_date,
      item.longitude,
      item.latitude,
    ],
  );
}

async function main() {
  console.log("Starting ETL for cctv...");

  try {
    const firstPage = await fetchPage(1);
    const totalCount = parseInt(firstPage.totalCount);
    const totalPages = Math.ceil(totalCount / 100);
    console.log(`Total records: ${totalCount}, Total pages: ${totalPages}`);

    for (let page = 1; page <= totalPages; page++) {
      const body = page === 1 ? firstPage : await fetchPage(page);
      const items = body.items.item;
      for (const item of items) {
        await upsertRecord(transform(item));
      }
      if (page % 100 === 0) console.log(`Page ${page}/${totalPages} done`);
    }

    console.log("ETL complete.");
  } finally {
    await pool.end();
  }
}

main();
