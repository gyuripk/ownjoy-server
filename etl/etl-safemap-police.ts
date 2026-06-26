import "dotenv/config";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const SAFEMAP_KEY = process.env.SAFEMAP_KEY;
const KAKAO_KEY = process.env.KAKAO_API_KEY;

const BASE_URL = "https://www.safemap.go.kr/openapi2/IF_0036";

type Facility = {
  source_id: string;
  name: string | null;
  facility_type: string | null;
  road_address: string | null;
  phone: string | null;
  police_agency: string | null;
  police_station: string | null;
};

async function fetchPage(page: number): Promise<any> {
  const params = new URLSearchParams({
    serviceKey: SAFEMAP_KEY!,
    pageNo: String(page),
    numOfRows: "1000",
  });
  const res = await fetch(`${BASE_URL}?${params}`);
  const data = await res.json();
  if (data.header?.resultCode !== "00") {
    throw new Error(`API error p${page}: ${JSON.stringify(data.header)}`);
  }
  return data.body;
}

async function fetchAll(): Promise<any[]> {
  const first = await fetchPage(1);
  const totalPages = Math.ceil(first.totalCount / 1000);
  const items = first.items.item ?? [];
  for (let page = 2; page <= totalPages; page++) {
    const body = await fetchPage(page);
    items.push(...(body.items.item ?? []));
  }
  return items;
}

function parsePhone(telno: string | null): string | null {
  if (!telno || telno.trim() === "" || telno.trim() === "-") return null;
  return telno.trim();
}

function transform(item: any): Facility {
  return {
    source_id: `safemap_${item.objt_id}`,
    name: item.fclty_nm?.trim() || null,
    facility_type: item.fclty_ty?.trim() || null,
    road_address: item.rn_adres?.trim() || null,
    phone: parsePhone(item.telno),
    police_agency: item.police?.trim() || null,
    police_station: item.polcsttn?.trim() || null,
  };
}

async function kakaoFetch(url: string): Promise<any> {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { Authorization: `KakaoAK ${KAKAO_KEY}` },
      });
      return await res.json();
    } catch (err: any) {
      if (attempt === 3) throw err;
      console.warn(`  [retry ${attempt}] ${err.code ?? err.message}`);
      await new Promise((r) => setTimeout(r, 500 * attempt));
    }
  }
}

async function kakaoKeywordRaw(query: string): Promise<any[]> {
  const params = new URLSearchParams({ query });
  const data = await kakaoFetch(
    `https://dapi.kakao.com/v2/local/search/keyword.json?${params}`,
  );
  return data.documents ?? [];
}

function toCoords(doc: any): { lat: number; lng: number } {
  return { lng: parseFloat(doc.x), lat: parseFloat(doc.y) };
}

async function kakaoAddress(
  query: string,
): Promise<{ lat: number; lng: number } | null> {
  const params = new URLSearchParams({ query });
  const data = await kakaoFetch(
    `https://dapi.kakao.com/v2/local/search/address.json?${params}`,
  );
  if (!data.documents?.length) return null;
  return toCoords(data.documents[0]);
}

async function geocode(
  item: Facility,
): Promise<{ lat: number; lng: number } | null> {
  await new Promise((r) => setTimeout(r, 300));

  if (item.name && item.road_address) {
    const parts = item.road_address.split(/\s+/);
    const prefix1 = parts.slice(0, 1).join(" ");
    const docs = await kakaoKeywordRaw(`${item.name} ${prefix1}`);

    if (docs.length > 0) {
      const ambiguous = docs.filter((d) => d.place_name === item.name).length > 1;
      if (!ambiguous) return toCoords(docs[0]);

      // multiple results with same name — refine with 2 parts
      console.log(`  [2차 2-part] ${item.name}: ambiguous, refining`);
      const prefix2 = parts.slice(0, 2).join(" ");
      const docs2 = await kakaoKeywordRaw(`${item.name} ${prefix2}`);
      if (docs2.length > 0) return toCoords(docs2[0]);

      // 2-part returned nothing — use first result from 1-part search
      return toCoords(docs[0]);
    }

    console.log(`  [3차 address] ${item.name}: ${item.road_address}`);
  }

  // fallback: address API
  if (item.road_address) {
    return kakaoAddress(item.road_address);
  }

  return null;
}

async function upsertRecord(item: Facility, coords: { lat: number; lng: number }) {
  await pool.query(
    `INSERT INTO safety.police_facilities (
      source_id, name, facility_type, road_address,
      phone, police_agency, police_station, location, refreshed_at
    ) VALUES (
      $1, $2, $3, $4,
      $5, $6, $7, ST_SetSRID(ST_MakePoint($8, $9), 4326), now()
    )
    ON CONFLICT (source_id) DO UPDATE SET
      name           = EXCLUDED.name,
      facility_type  = EXCLUDED.facility_type,
      road_address   = EXCLUDED.road_address,
      phone   = EXCLUDED.phone,
      police_agency  = EXCLUDED.police_agency,
      police_station = EXCLUDED.police_station,
      location       = EXCLUDED.location,
      refreshed_at   = now()`,
    [
      item.source_id,
      item.name,
      item.facility_type,
      item.road_address,
      item.phone,
      item.police_agency,
      item.police_station,
      coords.lng,
      coords.lat,
    ],
  );
}

async function main() {
  console.log("Starting ETL for safemap police facilities...");

  try {
    const { rows: existing } = await pool.query<{
      source_id: string;
      road_address: string | null;
    }>("SELECT source_id, road_address FROM safety.police_facilities");
    const existingMap = new Map(existing.map((r) => [r.source_id, r.road_address]));
    console.log(`Existing records in DB: ${existingMap.size}`);

    console.log("Fetching all records from safemap API...");
    const rawItems = await fetchAll();
    console.log(`  ${rawItems.length} records fetched`);

    const withPhone = rawItems.filter((r) => parsePhone(r.telno));
    console.log(`  ${withPhone.length} / ${rawItems.length} have phone numbers`);

    const counts = { new: 0, updated: 0, skipped: 0, geocodeFailed: 0 };

    for (const raw of rawItems) {
      const item = transform(raw);
      const existingAddress = existingMap.get(item.source_id);
      const isNew = existingAddress === undefined;
      const isChanged = !isNew && existingAddress !== item.road_address;

      if (!isNew && !isChanged) {
        counts.skipped++;
        continue;
      }

      const coords = await geocode(item);
      if (!coords) {
        console.warn(`Geocode failed: ${item.name ?? item.road_address}`);
        counts.geocodeFailed++;
        continue;
      }

      await upsertRecord(item, coords);
      if (isNew) counts.new++;
      else counts.updated++;
    }

    console.log(
      `ETL complete — new: ${counts.new}, updated: ${counts.updated}, skipped: ${counts.skipped}, geocodeFailed: ${counts.geocodeFailed}`,
    );
  } finally {
    await pool.end();
  }
}

main();
