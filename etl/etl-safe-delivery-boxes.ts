import "dotenv/config";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// define the API URL
const API_URL =
  "https://api.data.go.kr/openapi/tn_pubr_public_female_safety_hdrycstdyplace_api";
const API_KEY = process.env.PUB_DATA_KEY!;

async function fetchPage(pageNo: number) {
  const url = `${API_URL}?serviceKey=${API_KEY}&type=json&numOfRows=1000&pageNo=${pageNo}`;
  const res = await fetch(url);
  const data = await res.json(); // coverts res to JS obj
  return data.response.body;
  console.log(JSON.stringify(data));
}

// transform function
function transform(item: any) {
  return {
    region_code: item.insttCode,
    name: item.fcltyNm,
    road_address: item.rdnmadr || null,
    lot_address: item.lnmadr || null,
    weekday_open: item.weekdayOperOpenHhmm || null,
    weekday_close: item.weekdayOperColseHhmm || null,
    saturday_open: item.satOperOperOpenHhmm || null,
    saturday_close: item.satOperCloseHhmm || null,
    holiday_open: item.holidayOperOpenHhmm || null,
    holiday_close: item.holidayCloseOpenHhmm || null,
    free_hours: item.freeUseTime ? parseInt(item.freeUseTime) : null,
    late_fee: item.arrs ? parseInt(item.arrs) : null,
    support_phone: item.cstmrCnterPhoneNumber || null,
    created_date: item.referenceDate
      ? item.referenceDate.length === 8
        ? `20${item.referenceDate}`
        : item.referenceDate
      : null, // "25-06-25" / "2025-06-25"
    longitude: parseFloat(item.longitude),
    latitude: parseFloat(item.latitude),
  };
}

// insert function
// inserts one transformed record into the database
async function insertRecord(item: ReturnType<typeof transform>) {
  await pool.query(
    `INSERT INTO safety.safe_delivery_boxes (
      region_code, name, road_address, lot_address,
      weekday_open, weekday_close, saturday_open, saturday_close,
      holiday_open, holiday_close, free_hours, late_fee,
      support_phone, created_date, location, refreshed_at
    ) VALUES (
      $1, $2, $3, $4,
      $5, $6, $7, $8,
      $9, $10, $11, $12,
      $13, $14, ST_SetSRID(ST_MakePoint($15, $16), 4326), now()
    )`,
    [
      item.region_code,
      item.name,
      item.road_address,
      item.lot_address,
      item.weekday_open,
      item.weekday_close,
      item.saturday_open,
      item.saturday_close,
      item.holiday_open,
      item.holiday_close,
      item.free_hours,
      item.late_fee,
      item.support_phone,
      item.created_date,
      item.longitude,
      item.latitude,
    ],
  );
}

async function main() {
  console.log("Starting ETL for safe_delivery_boxes...");

  const firstPage = await fetchPage(1);
  const totalCount = parseInt(firstPage.totalCount);
  const totalPages = Math.ceil(totalCount / 1000);

  console.log(`Total records: ${totalCount}, Total pages: ${totalPages}`);

  // loop to extract data for every page
  for (let page = 1; page <= totalPages; page++) {
    const body = await fetchPage(page);
    const items = body.items;

    // transform each item data
    for (const item of items) {
      const transformed = transform(item);
      await insertRecord(transformed);
    }

    console.log(`Page ${page}/${totalPages} done`);
  }

  await pool.end(); // closes the database connection
  console.log("ETL complete");
}

// execute script
main();
