# ETL Pipeline Reference

## What is ETL?

ETL stands for **Extract, Transform, Load** — the three steps to move data from an external source into your database.

Every script in `/etl/` follows the same three-function structure:

| Phase | Function | What it does |
|---|---|---|
| **Extract** | `fetchPage()` | Calls the government API, returns raw JSON one page at a time |
| **Transform** | `transform()` | Converts raw API fields into typed, English-named DB columns |
| **Load** | `insertRecord()` / `upsertRecord()` | Writes the transformed record into PostgreSQL |

---

## The 5 Pipelines

| Script | Dataset | Total records | Page size | Loading strategy |
|---|---|---|---|---|
| `etl-cctv.ts` | CCTV cameras | ~375,000 | 100 (API max) | Upsert |
| `etl-emergency-bells.ts` | Emergency bells | ~88,843 | 100 (API max) | Upsert |
| `etl-safe-delivery-boxes.ts` | Safe delivery boxes | ~816 | 1,000 | Truncate + Insert |
| `etl-safe-stores.ts` | Women's safe stores | ~2,838 | 1,000 | Truncate + Insert |
| `etl-smart-street-lights.ts` | Smart street lights | ~12,714 | 1,000 | Truncate + Insert |
| `etl-police-facilities.ts` _(planned)_ | Police & security facilities | ~3,064 | 1,000 | Upsert + Kakao geocoding |

---

## Loading Strategies

### Upsert — CCTV, Emergency Bells

Used when the API provides a stable unique ID (`source_id` / `MNG_NO`) per record.

```sql
INSERT INTO safety.cctv (source_id, ...)
VALUES (...)
ON CONFLICT (source_id) DO UPDATE SET
  road_address = EXCLUDED.road_address,
  refreshed_at = now()
```

- New records are inserted
- Existing records (same `source_id`) are updated
- Nothing is deleted — old data stays until overwritten
- **Idempotent**: safe to re-run. Running it twice gives the same result as running it once.
- **Safest for automation**: if the pipeline crashes halfway, data already loaded stays in the DB.

### Truncate + Insert — Delivery Boxes, Safe Stores, Smart Street Lights

Used when records have no reliable unique ID from the API.

```ts
await pool.query("TRUNCATE TABLE safety.safe_delivery_boxes RESTART IDENTITY")
// then insert all records fresh
```

- Wipes the entire table first, then reloads everything
- Also idempotent — re-running gives a clean full reload
- **Risk**: if the pipeline crashes after TRUNCATE but before all records are inserted, the table is empty until the next successful run. For these small datasets (under 15,000 records), this risk is acceptable.

---

## Pagination Pattern

Government APIs do not return all records at once. Every script fetches page 1 first to find out how many total pages exist, then loops:

```ts
const firstPage = await fetchPage(1)
const totalCount = parseInt(firstPage.totalCount)
const totalPages = Math.ceil(totalCount / 1000)

for (let page = 1; page <= totalPages; page++) {
  const body = await fetchPage(page)
  for (const item of body.items) {
    await insertRecord(transform(item))
  }
  console.log(`Page ${page}/${totalPages} done`)
}
```

CCTV and Emergency Bells use `numOfRows=100` because the CCTV API has a hard maximum of 100 per page. The other three APIs allow up to 1,000.

---

## Coordinate Transformation

All API records arrive with raw latitude/longitude as strings:

```
WGS84_LOT: "126.977"   ← longitude
WGS84_LAT: "37.566"    ← latitude
```

**Transform step** — convert strings to numbers:
```ts
longitude: parseFloat(item.WGS84_LOT)
latitude: parseFloat(item.WGS84_LAT)
```

**Load step** — convert numbers to a PostGIS geometry point:
```sql
ST_SetSRID(ST_MakePoint($longitude, $latitude), 4326)
```

`ST_MakePoint` combines two floats into one geometry value. `4326` is the SRID (coordinate reference system ID) for WGS84 — the same system used by GPS. This geometry column is what makes `ST_Intersects` viewport queries work on the API side.

---

## Data Transformations in transform()

Beyond coordinates, the transform function handles three types of conversion:

**Korean all-caps field names → readable English**
```ts
source_id:    item.MNG_NO               // 관리번호 (management number)
road_address: item.LCTN_ROAD_NM_ADDR
purpose:      item.INSTL_PRPS_SE_NM
```

**String "Y" / "N" → boolean**
```ts
police_linked:  item.POLC_LINK_EN === "Y"
is_working:     item.LAST_CHCK_RSLT_SE === "Y"
is_operating:   item.useYn === "Y"
has_cctv:       item.cctvYn === "Y"
```

**Inconsistent date formats → normalized string**
```ts
// Some API responses return 6-digit dates ("250625"), others return full ("2025-06-25")
created_date: item.referenceDate?.length === 8
  ? `20${item.referenceDate}`
  : item.referenceDate
```

---

## Retry Logic

Only `etl-cctv.ts` has retry logic. CCTV has the most pages (~3,750), making it the most likely to hit a transient API failure mid-run:

```ts
async function fetchPage(page: number, retries = 3): Promise<any> {
  const res = await fetch(url)
  const data = await res.json()
  if (!data.response?.body) {
    if (retries > 0) {
      await new Promise(r => setTimeout(r, 2000)) // wait 2 seconds
      return fetchPage(page, retries - 1)          // try again (up to 3 times)
    }
    throw new Error(`Failed to fetch page ${page}`)
  }
  return data.response.body
}
```

The other four scripts do not have retry logic. For monthly automation, they rely on the job being re-triggered manually if a failure occurs.

---

## try/finally — Why It Matters for Automation

All five scripts wrap `main()` logic in `try/finally`:

```ts
async function main() {
  try {
    // all ETL logic
  } finally {
    await pool.end()  // always runs, even if an error is thrown
  }
}
```

Without `finally`, if an unhandled error is thrown mid-pipeline, `pool.end()` is never called. The Node.js process holds the open database connection and hangs instead of exiting. In automated monthly runs (Lambda or cron), a hanging process means the job never completes and the next run may also fail due to too many open connections.

---

## How to Run Manually

```bash
# from ownjoy-server root
npx ts-node etl/etl-cctv.ts
npx ts-node etl/etl-emergency-bells.ts
npx ts-node etl/etl-safe-delivery-boxes.ts
npx ts-node etl/etl-safe-stores.ts
npx ts-node etl/etl-smart-street-lights.ts
```

Requires `.env` with:
```
DATABASE_URL=postgresql://...
PUB_DATA_KEY=...
```

---

## Known Limitations

| Issue | Affected scripts | Risk level |
|---|---|---|
| No retry logic | emergency-bells, safe-delivery-boxes, safe-stores, smart-street-lights | Low — small datasets, fewer pages |
| Truncate-first means empty table on crash | safe-delivery-boxes, safe-stores, smart-street-lights | Low — small datasets, short run time |
| Sequential record inserts (no batching) | All 5 | Low — acceptable for monthly runs, slow for CCTV (~375k records) |
