import "dotenv/config";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const DATAGO_KEY = process.env.PUB_DATA_KEY;
const KAKAO_KEY = process.env.KAKAO_API_KEY;

const STATION_URL =
  "https://api.odcloud.kr/api/15124966/v1/uddi:345a2432-5fee-4c49-a353-80b62496a43b";
const SUBSTATION_URL =
  "https://api.odcloud.kr/api/15077036/v1/uddi:6b371c66-09a5-4efd-8445-bfd53672542e";
const SECURITY_CENTER_URL =
  "https://api.odcloud.kr/api/15076962/v1/uddi:496cadf8-cb37-478a-81b4-efbbe881c819";

type Facility = {
  source_id: string;
  name: string | null;
  facility_type: string | null;
  road_address: string | null;
  police_agency: string | null;
  police_station: string | null;
};

type Geocoder = (item: Facility) => Promise<{ lat: number; lng: number } | null>;

async function fetchPage(baseUrl: string, page: number): Promise<any> {
  const params = new URLSearchParams({
    page: String(page),
    perPage: "1000",
    serviceKey: DATAGO_KEY!,
  });
  const res = await fetch(`${baseUrl}?${params}`);
  const data = await res.json();
  if (!data.data) throw new Error(`Bad response p${page}: ${JSON.stringify(data)}`);
  return data;
}

async function fetchAll(baseUrl: string): Promise<any[]> {
  const first = await fetchPage(baseUrl, 1);
  const totalPages = Math.ceil(first.totalCount / 1000);
  const results = [...first.data];
  for (let page = 2; page <= totalPages; page++) {
    const body = await fetchPage(baseUrl, page);
    results.push(...body.data);
  }
  return results;
}

function transformStation(item: any): Facility {
  return {
    source_id: `station_${item["경찰서명칭"]}`,
    name: item["경찰서명칭"] || null,
    facility_type: "경찰서",
    road_address: (item["경찰서주소"] ?? "").trim() || null,
    police_agency: (item["시도경찰청"] ?? "").trim() || null,
    police_station: null,
  };
}

function cleanAddress(addr: string): string {
  return addr.replace(/번지$/, "").replace(/\s+/g, " ").trim();
}

function transformSubstation(item: any): Facility {
  const 관서명 = (item["관서명"] ?? "").trim();
  const 구분 = (item["구분"] ?? "").trim();
  return {
    source_id: `substation_${item["시도청"]}_${관서명}_${구분}`,
    name: 관서명 && 구분 ? `${관서명}${구분}` : 관서명 || null,
    facility_type: 구분 || null,
    road_address: item["주소"] ? cleanAddress(item["주소"]) : null,
    police_agency: item["시도청"] || null,
    police_station: item["경찰서"] || null,
  };
}

function transformSecurityCenter(item: any): Facility {
  return {
    source_id: `security_center_${item["경찰서"]}_${item["치안센터명"]}`,
    name: item["치안센터명"] || null,
    facility_type: "치안센터",
    road_address: item["주소"] ? cleanAddress(item["주소"]) : null,
    police_agency: item["시도청"] || null,
    police_station: item["경찰서"] || null,
  };
}

async function kakaoAddress(query: string): Promise<{ lat: number; lng: number } | null> {
  const params = new URLSearchParams({ query });
  const res = await fetch(
    `https://dapi.kakao.com/v2/local/search/address.json?${params}`,
    { headers: { Authorization: `KakaoAK ${KAKAO_KEY}` } },
  );
  const data = await res.json();
  if (!data.documents?.length) return null;
  return {
    lng: parseFloat(data.documents[0].x),
    lat: parseFloat(data.documents[0].y),
  };
}

async function kakaoKeyword(query: string): Promise<{ lat: number; lng: number } | null> {
  const params = new URLSearchParams({ query });
  const res = await fetch(
    `https://dapi.kakao.com/v2/local/search/keyword.json?${params}`,
    { headers: { Authorization: `KakaoAK ${KAKAO_KEY}` } },
  );
  const data = await res.json();
  if (!data.documents?.length) return null;
  return {
    lng: parseFloat(data.documents[0].x),
    lat: parseFloat(data.documents[0].y),
  };
}

// 경찰서: keyword(경찰서명칭) first → address fallback
const geocodeStation: Geocoder = async (item) => {
  await new Promise((r) => setTimeout(r, 100));
  if (item.name) {
    const r1 = await kakaoKeyword(item.name);
    if (r1) return r1;
    console.log(`  [2차 address] ${item.name}: ${item.road_address}`);
  }
  if (!item.road_address) return null;
  return kakaoAddress(item.road_address.replace(/\s+/g, " ").trim());
};

// 지구대/파출소: address → keyword(관서명+구분 + 시/구)
const geocodeSubstation: Geocoder = async (item) => {
  if (!item.road_address) return null;
  await new Promise((r) => setTimeout(r, 100));

  const r1 = await kakaoAddress(item.road_address.replace(/\s+/g, " ").trim());
  if (r1) return r1;

  if (item.name) {
    const prefix = item.road_address.split(/\s+/).slice(0, 2).join(" ");
    const query = `${item.name} ${prefix}`;
    console.log(`  [2차 keyword] ${query}`);
    return kakaoKeyword(query);
  }

  return null;
};

// 치안센터: address → keyword(치안센터명)
const geocodeSecurityCenter: Geocoder = async (item) => {
  if (!item.road_address) return null;
  await new Promise((r) => setTimeout(r, 100));

  const r1 = await kakaoAddress(item.road_address.replace(/\s+/g, " ").trim());
  if (r1) return r1;

  if (item.name) {
    console.log(`  [2차 keyword] ${item.name}`);
    return kakaoKeyword(item.name);
  }

  return null;
};

async function upsertRecord(item: Facility, coords: { lat: number; lng: number }) {
  await pool.query(
    `INSERT INTO safety.police_facilities (
      source_id, name, facility_type, road_address,
      police_agency, police_station, location, refreshed_at
    ) VALUES (
      $1, $2, $3, $4,
      $5, $6, ST_SetSRID(ST_MakePoint($7, $8), 4326), now()
    )
    ON CONFLICT (source_id) DO UPDATE SET
      name           = EXCLUDED.name,
      facility_type  = EXCLUDED.facility_type,
      road_address   = EXCLUDED.road_address,
      police_agency  = EXCLUDED.police_agency,
      police_station = EXCLUDED.police_station,
      location       = EXCLUDED.location,
      refreshed_at   = now()`,
    [
      item.source_id,
      item.name,
      item.facility_type,
      item.road_address,
      item.police_agency,
      item.police_station,
      coords.lng,
      coords.lat,
    ],
  );
}

async function processDataset(
  facilities: Facility[],
  existingMap: Map<string, string | null>,
  counts: { new: number; updated: number; skipped: number; geocodeFailed: number },
  label: string,
  geocoder: Geocoder,
) {
  for (const item of facilities) {
    const existingAddress = existingMap.get(item.source_id);
    const isNew = existingAddress === undefined;
    const isChanged = !isNew && existingAddress !== item.road_address;

    if (!isNew && !isChanged) {
      counts.skipped++;
      continue;
    }

    const coords = await geocoder(item);
    if (!coords) {
      console.warn(`[${label}] Geocode failed: ${item.name ?? item.road_address}`);
      counts.geocodeFailed++;
      continue;
    }

    await upsertRecord(item, coords);
    if (isNew) counts.new++;
    else counts.updated++;
  }
}

async function main() {
  console.log("Starting ETL for police_facilities...");

  try {
    const { rows: existing } = await pool.query<{
      source_id: string;
      road_address: string | null;
    }>("SELECT source_id, road_address FROM safety.police_facilities");
    const existingMap = new Map(existing.map((r) => [r.source_id, r.road_address]));
    console.log(`Existing records in DB: ${existingMap.size}`);

    const counts = { new: 0, updated: 0, skipped: 0, geocodeFailed: 0 };

    console.log("Fetching 경찰서...");
    const stations = (await fetchAll(STATION_URL)).map(transformStation);
    console.log(`  ${stations.length} records`);
    await processDataset(stations, existingMap, counts, "경찰서", geocodeStation);

    console.log("Fetching 지구대/파출소...");
    const substations = (await fetchAll(SUBSTATION_URL)).map(transformSubstation);
    console.log(`  ${substations.length} records`);
    await processDataset(substations, existingMap, counts, "지구대/파출소", geocodeSubstation);

    console.log("Fetching 치안센터...");
    const centers = (await fetchAll(SECURITY_CENTER_URL)).map(transformSecurityCenter);
    console.log(`  ${centers.length} records`);
    await processDataset(centers, existingMap, counts, "치안센터", geocodeSecurityCenter);

    console.log(
      `ETL complete — new: ${counts.new}, updated: ${counts.updated}, skipped: ${counts.skipped}, geocodeFailed: ${counts.geocodeFailed}`,
    );
  } finally {
    await pool.end();
  }
}

main();
