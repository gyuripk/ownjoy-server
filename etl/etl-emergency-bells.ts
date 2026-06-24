import "dotenv/config";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Extract - get data with API
// define URL
const API_URL = "https://apis.data.go.kr/1741000/emergency_call_box_info/info";
const API_KEY = process.env.PUB_DATA_KEY;

// fetch data
async function fetchPage(page: number) {
  const url = `${API_URL}?serviceKey=${API_KEY}&pageNo=${page}&numOfRows=100`;
  const res = await fetch(url);
  const data = await res.json();
  return data.response.body;
}

// Transform - transform data
function transform(item: any) {
  return {
    source_id: item.MNG_NO,
    region_code: item.OPN_ATMY_GRP_CD || null,
    road_address: item.LCTN_ROAD_NM_ADDR || null,
    lot_address: item.LCTN_LOTNO_ADDR || null,
    install_place_type: item.INSTL_PLC_TYPE || null,
    install_location: item.INSTL_PSTN || null,
    link_method: item.LINK_MTH || null,
    police_linked: item.POLC_LINK_EN === "Y", // comparison
    security_linked: item.SECCO_LINK_EN === "Y",
    office_linked: item.MNGOFC_LINK_EN === "Y",
    is_working: item.LAST_CHCK_RSLT_SE === "Y",
    last_checked_date: item.LAST_CHCK_YMD || null,
    created_date: item.DAT_CRTR_YMD || null,
    longitude: parseFloat(item.WGS84_LOT),
    latitude: parseFloat(item.WGS84_LAT),
  };
}

// Load data into DB
async function insertRecord(item: ReturnType<typeof transform>) {
  // send query
  await pool.query(
    `INSERT INTO safety.emergency_bells (
      source_id, region_code, road_address, lot_address,
      install_place_type, install_location, link_method,
      police_linked, security_linked, office_linked,
      is_working, last_checked_date, created_date,
      location, refreshed_at
    ) VALUES (
      $1, $2, $3, $4,
      $5, $6, $7,
      $8, $9, $10,
      $11, $12, $13,
      ST_SetSRID(ST_MakePoint($14, $15), 4326), now()
    )
    ON CONFLICT (source_id) DO UPDATE SET
      region_code = EXCLUDED.region_code,
      road_address = EXCLUDED.road_address,
      lot_address = EXCLUDED.lot_address,
      install_place_type = EXCLUDED.install_place_type,
      install_location = EXCLUDED.install_location,
      link_method = EXCLUDED.link_method,
      police_linked = EXCLUDED.police_linked,
      security_linked = EXCLUDED.security_linked,
      office_linked = EXCLUDED.office_linked,
      is_working = EXCLUDED.is_working,
      last_checked_date = EXCLUDED.last_checked_date,
      created_date = EXCLUDED.created_date,
      location = EXCLUDED.location,
      refreshed_at = now()`,
    [
      item.source_id,
      item.region_code,
      item.road_address,
      item.lot_address,
      item.install_place_type,
      item.install_location,
      item.link_method,
      item.police_linked,
      item.security_linked,
      item.office_linked,
      item.is_working,
      item.last_checked_date,
      item.created_date,
      item.longitude,
      item.latitude,
    ],
  );
}

// main
async function main() {
  console.log("Starting ETL for emergency_bell...");

  try {
    const firstPage = await fetchPage(1);
    const totalCount = parseInt(firstPage.totalCount);
    const totalPages = Math.ceil(totalCount / 100);
    console.log(`Total records: ${totalCount}, Total pages: ${totalPages}`);

    for (let page = 1; page <= totalPages; page++) {
      const body = page === 1 ? firstPage : await fetchPage(page);
      const items = body.items.item;
      for (const item of items) {
        await insertRecord(transform(item));
      }
      console.log(`Page ${page}/${totalPages} done`);
    }

    console.log("ETL completed");
  } finally {
    await pool.end();
  }
}

// execute function
main();
