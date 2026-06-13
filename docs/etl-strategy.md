# ETL Strategy

## Core Question: ETL vs Direct API Calls

Two approaches to getting government data onto the map:

| | Direct API Calls | ETL into Database |
|---|---|---|
| When data is fetched | Every user request | Once a month |
| Speed | 2–5 seconds (government APIs) | ~50ms (PostGIS query) |
| Filtering | Download all Korea, filter manually | PostGIS bbox — only what's on screen |
| Rate limits | Hit by every user simultaneously | Only hit during ETL (off-hours) |
| Reliability | App breaks if API goes down | Your data, fully under your control |
| Scalability | Gets worse with more users | Same speed regardless of user count |

**ETL wins for this use case.** Safety data changes monthly at most — no reason to hit a slow government API on every map interaction.

---

## Verified API Limitations (checked against actual API specs)

We originally assumed government APIs had no bbox filtering. We verified this by inspecting the actual CCTV API parameter list.

### CCTV API — actual parameters

| Parameter | Description |
|---|---|
| `serviceKey` | Auth key |
| `pageNo` | Page number |
| `numOfRows` | Records per page **(max: 100)** |
| `cond[OPN_ATMY_GRP_CD::EQ]` | Filter by 개방자치단체코드 (district code) |
| `cond[LCTN_ROAD_NM_ADDR::LIKE]` | Filter by address string |
| `cond[DAT_UPDT_PNT::GTE/LT]` | Filter by update timestamp |
| `cond[DAT_CRTR_YMD::GTE/LT]` | Filter by reference date |

**No bbox filtering exists.** The only geographic filter is by administrative code (`OPN_ATMY_GRP_CD`) — district level only, not by lat/lon bounds.

### What this means for direct API calls

```
375,000 total CCTVs
÷ 100 records per call (max)
= 3,750 API calls to download all of Korea
```

Even filtering by 구 (district), a single 구 can have thousands of CCTVs across multiple pages. Each page is a separate API call. This is not feasible on every user map interaction.

**Direct API calls are not viable for CCTV or any large dataset.**

---

## Decision Per Dataset

| Dataset | Records | API geographic filter | Decision |
|---|---|---|---|
| CCTV | 375,000 | 구 code only, max 100/call | **ETL required** |
| Emergency bells | 88,843 | 구 code only | **ETL required** |
| Security lights | 1,841,235 | 구 code only | **ETL required** |
| Smart street lights | 12,714 | 구 code only | Direct API by 구 workable for MVP |
| Safe stores | 2,838 | 구 code only | Load all once, filter in browser |
| Women's delivery boxes | 816 | 구 code only | Load all once, filter in browser |

For small datasets (under ~5,000 records), loading everything once and filtering in the browser is acceptable. For large datasets, ETL into PostGIS is the only practical approach.

---

## Why Direct Calls Would Fail

```
User opens map in Seoul
    ↓
App calls data.go.kr for CCTVs in viewport
    ↓
data.go.kr returns 375,000 records (entire Korea)
    ↓
App filters to Seoul on the server
    ↓
Repeat for every user, every map pan, every zoom
```

Problems:
- No bbox filtering on government APIs — they return entire nationwide datasets
- Korean public APIs regularly take 2–5 seconds per response
- Multiple users hit rate limits simultaneously
- If data.go.kr goes down, the map goes blank

---

## Why ETL Works

```
Once a month (2am KST, no users active):
    EventBridge → ETL Lambda → data.go.kr → PostgreSQL

User opens map in Seoul:
    Express → PostGIS bbox query → returns in ~50ms
    Only CCTVs visible in current viewport
```

Data is fetched once, stored permanently, served instantly to every user.

---

## The Scale of the Problem

| Dataset | Total Records | Served per Viewport |
|---|---|---|
| CCTV | 375,000 | ~200–300 |
| Security lights | 1,841,235 | ~500–1,000 |
| Emergency bells | 88,843 | ~50–100 |
| Women's shelters | 2,838 | ~20–50 |
| Safe delivery boxes | 816 | ~10–20 |

Without PostGIS: download millions of records per request, filter in code.
With ETL + PostGIS: fetch only what's visible on screen, in ~50ms.

---

## Exception — WMS Tiles Are Called Directly

SafeMap WMS tiles (crime heatmaps, CPTED zones, safety zones) are not ETL'd. They are called directly via the tile proxy. This is intentional:

- Tiles are pre-rendered PNG images, not raw data — cannot be stored in a database
- CloudFront caches each tile for 30 days — most requests never reach SafeMap
- A different tile exists for every bbox/zoom combination — impossible to pre-fetch all

```
Raw data APIs  →  ETL into PostgreSQL    (queried on demand via PostGIS)
WMS tile APIs  →  Proxy + CloudFront     (cached image tiles)
```

---

## ETL Pipeline Design

### Schedule
- Runs 1st of every month at 2am KST (EventBridge cron)
- Off-peak hours — no impact on users
- Monthly is sufficient — government datasets update monthly at most

### Process per Dataset

```
1. Read API key from Secrets Manager
2. Fetch all pages from data.go.kr API (paginated, 1000 records/page)
3. Transform:
   - Normalize field names
   - Convert coordinates if needed (CPTED: EPSG:5174 → WGS84)
   - Parse booleans (Y/N → true/false)
   - Build PostGIS geometry from lat/lng
4. Upsert into PostgreSQL (INSERT ... ON CONFLICT DO UPDATE)
   - source_id ensures no duplicates
   - existing rows are updated, not replaced
5. Log row counts to CloudWatch
```

### Upsert Pattern (no data loss)

```sql
INSERT INTO safety.emergency_bells
    (source_id, address, install_place, police_linked, location, refreshed_at)
VALUES
    ($1, $2, $3, $4, ST_SetSRID(ST_MakePoint($lng, $lat), 4326), now())
ON CONFLICT (source_id)
DO UPDATE SET
    address       = EXCLUDED.address,
    install_place = EXCLUDED.install_place,
    police_linked = EXCLUDED.police_linked,
    location      = EXCLUDED.location,
    refreshed_at  = EXCLUDED.refreshed_at;
```

Upsert means:
- New records are inserted
- Existing records are updated
- Nothing is deleted (preserves history)
- Safe to re-run without duplicates

### Coordinate Conversion (CPTED only)

CPTED data uses Korean TM (EPSG:5174), not WGS84:
```
Raw: GEOM = "POINT(14135850 4511541)"
```

Convert during ETL using PostGIS:
```sql
ST_Transform(ST_SetSRID(ST_MakePoint(x, y), 5174), 4326)
```

### SHP File (안심귀갓길 경로 only)

The safe return route path geometry is not available via API — only via SHP file download. This is handled separately, not by the monthly ETL:

```
Download SHP file manually (when Seoul updates it)
    ↓
ogr2ogr -f GeoJSON output.geojson input.shp
    ↓
Load GeoJSON into PostgreSQL as LineString geometry
```

---

## On Failure

If ETL fails mid-run:
- Existing data in the database is untouched (upsert, not truncate-reload)
- CloudWatch alarm sends an email alert
- Old data remains on the map until the next successful run
- Users see slightly stale data — not a blank map

---

## Summary

| Concern | Solution |
|---|---|
| Slow government APIs | Fetch once/month, serve from PostGIS |
| Nationwide data, local queries | PostGIS bbox filtering |
| Duplicate records on re-run | Upsert on source_id |
| Wrong coordinate system (CPTED) | ST_Transform during ETL |
| Route geometry not in API (안심귀갓길) | Manual SHP → ogr2ogr → PostgreSQL |
| ETL failure | CloudWatch alert, old data stays live |
| API key security | Read from Secrets Manager at runtime |
