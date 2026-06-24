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
| Police facilities | 3,064 | None | **ETL required** — no coordinates in API; geocode during ETL |

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

### Why CCTV and Emergency Bells Reload Everything

CCTV (375,000 records) and emergency bells (88,843 records) re-fetch and re-upsert the full dataset every run. This seems wasteful but is the correct approach for these two datasets.

**No reliable change signal.** The APIs provide `DAT_UPDT_PNT` (last updated timestamp) which could theoretically be used to filter only recently changed records. But even if you fetch only updated records, you still cannot detect deletions — a removed CCTV simply disappears from the API response with no signal. The only way to know something was deleted is to compare the full API response against the full DB contents.

**No geocoding cost.** Coordinates come directly from the API as `WGS84_LAT`/`WGS84_LOT`. Re-upserting 375,000 records is just DB writes — cheap. A delta comparison would add complexity for no meaningful benefit.

**Police facilities are different** because geocoding costs money (Kakao API call per record). Re-geocoding all 3,064 addresses every annual run wastes quota. So the delta comparison — load existing records into a Map, skip unchanged ones — is worth the added complexity to avoid unnecessary Kakao calls.

| Dataset | Records | Geocoding needed | Strategy |
|---|---|---|---|
| CCTV | 375,000 | No — coordinates in API | Full reload every run |
| Emergency bells | 88,843 | No — coordinates in API | Full reload every run |
| Police facilities | 3,064 | Yes — Kakao API per record | Delta sync — only geocode new/changed |

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

## 치안시설 — Source Selection & Geocoding Strategy

### Candidate sources considered

| Source | Coverage | Address quality | Coordinates | Update method |
|---|---|---|---|---|
| SafeMap API `IF_0036` | All 5 types — 경찰서, 지구대, 파출소, 치안센터, 안심부스 (3,064) | Typos, malformed | Often `"0"` (unreliable) | API → automatable |
| **data.go.kr — 경찰서** | Police stations (259) | Clean | None | API → automatable |
| **data.go.kr — 지구대/파출소** | Substations (2,047) | Clean | None | API → automatable |
| **data.go.kr — 치안센터** | Security centers (669) | Clean | None | API → automatable |
| geomarket.kr SHP | 지구대/파출소 only | N/A | Yes (geometry) | Manual download |

**Decision: data.go.kr (3 APIs).**

SafeMap was initially considered because it covers all 5 facility types in one API call. However, SafeMap address data contains typos (e.g., `경남상남도`, `보길동로 보길로 1-1`) and malformed strings that cause geocoding failures. Since coordinates come from geocoding the address, address quality is critical — wrong address = wrong map pin, which is unacceptable for a safety app.

data.go.kr addresses are clean and standardized (경찰청 official records). Testing confirmed: 2,973 records geocoded with only 2 failures, both due to typos in the source data itself (unfixable). 안심부스 is excluded — data.go.kr doesn't cover it, but the count is negligible.

### Geocoding strategy per facility type

No source provides coordinates. All coordinates are resolved via Kakao Local Search API during ETL.

Each facility type uses a different strategy based on how reliably its name and address can be found:

| Facility | 1차 | 2차 fallback |
|---|---|---|
| 경찰서 | `search/keyword.json` with 경찰서명칭 | `search/address.json` with 경찰서주소 |
| 지구대/파출소 | `search/address.json` with 주소 | `search/keyword.json` with 관서명+구분 + 시/구 |
| 치안센터 | `search/address.json` with 주소 | `search/keyword.json` with 치안센터명 |

**경찰서** — 경찰서명칭 (`충주경찰서`, `서울중부경찰서`) is a unique proper noun nationwide. Keyword search is more reliable than address search because the `경찰서주소` field omits the province and requires inference from the `시도경찰청` field.

**지구대/파출소** — Address search first because `관서명` alone (`을지`, `중앙`) is ambiguous nationwide. The keyword fallback appends 시/구 prefix (`당현지구대 서울특별시 노원구`) to disambiguate.

**치안센터** — Address search first. 치안센터명 (`충4치안센터`) is specific enough for keyword fallback without location context.

### Juso API (행정안전부 addrCoordApi) — not used

Juso coordinate API provides better coverage for official government addresses, but blocks requests from overseas IPs (행정안전부 공간정보 보안관리 규정). ETL runs on AWS Lambda outside Korea — Juso is not viable.

### Geocoding results (2025 run)

| Facility | Total | 1차 success | 2차 success | Failed |
|---|---|---|---|---|
| 경찰서 | 259 | ~247 | ~10 | 2 |
| 지구대/파출소 | 2,047 | 1,995 | 50 | 2 |
| 치안센터 | 669 | 618 | 51 | 0 |
| **Total** | **2,975** | | | **2 (0.07%)** |

The 2 failures are source data typos (`경남상남도`, `경산남도`) — unfixable at the ETL level.

### Delta-sync — only geocode what changed

On annual re-runs, most records are unchanged. Geocoding costs Kakao API quota, so we skip unchanged records:

```
1. Load existing records from DB keyed by source_id
2. For each API record:
     NEW:       source_id not in DB → geocode → insert
     CHANGED:   road_address differs → re-geocode → update
     UNCHANGED: skip (no geocoding, no write)
3. Log run counts
```

### source_id format

source_id is constructed from stable identifying fields (not sequential 연번):

| Facility | source_id format | Example |
|---|---|---|
| 경찰서 | `station_{경찰서명칭}` | `station_충주경찰서` |
| 지구대/파출소 | `substation_{시도청}_{관서명}_{구분}` | `substation_서울청_당현_지구대` |
| 치안센터 | `security_center_{경찰서}_{치안센터명}` | `security_center_서울중부_충4치안센터` |

### Update cadence

Source data updates annually. Run this ETL **once a year**. Trigger manually after major administrative redistricting.

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
