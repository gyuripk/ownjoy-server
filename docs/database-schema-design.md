# Database Schema Design

## Key Considerations

### 1. Coordinate Systems

Most APIs return WGS84 (standard lat/lng) — but two do not:

| API                                                 | Coordinate System     | Status                                              |
| --------------------------------------------------- | --------------------- | --------------------------------------------------- |
| CCTV, Street Lights, Emergency Bell, Shelters, etc. | WGS84                 | ✅ Ready to use                                     |
| **CPTED**                                           | Korean TM (EPSG:5174) | ❌ `GEOM: "POINT(14135850 4511541)"` — must convert |
| **안심귀갓길 경로**                                 | SHP file              | Different format entirely                           |

CPTED coordinates must be converted to WGS84 during ETL using PostGIS `ST_Transform()`.

---

### 2. Geometry Types — Points vs Lines

Every API produces point data except one:

| API                                       | Geometry Type | Reason                                      |
| ----------------------------------------- | ------------- | ------------------------------------------- |
| CCTV, Emergency Bell, Street Lights, etc. | `Point`       | Single installation location                |
| **안심귀갓길 경로**                       | `LineString`  | A route — a path connecting multiple points |

The route JSON API only returns stats (bell count, CCTV count per segment) — **no path geometry**. The actual path comes from the SHP file only.

---

### 3. SHP File Pipeline

SHP (Shapefile) is a GIS format for geographic shapes. It cannot be fetched via API — it must be downloaded as a file.

```
Download .shp file (manual, periodic)
    ↓
Convert to GeoJSON using ogr2ogr
    ↓
Insert into PostgreSQL as LineString geometry
```

This is a one-time manual step, separate from the monthly ETL pipeline.

---

### 4. Store Only What the Map Needs

Each API returns 20–30 fields. Keep only what's needed:

| Column           | Purpose                                                       |
| ---------------- | ------------------------------------------------------------- |
| `location`       | Geometry — for map display and bbox queries                   |
| `address`        | Shown in map popups                                           |
| `name`           | Identifies the marker                                         |
| Meaningful flags | `has_cctv`, `is_operating`, `police_linked`, etc.             |
| `source_id`      | Original API unique ID — used for ETL upserts (no duplicates) |
| `refreshed_at`   | Timestamp of last ETL update                                  |

---

### 5. Schema Structure

All tables live under a dedicated `safety` schema:

```
safety.cctv
safety.street_lights
safety.emergency_bells
safety.security_lights
safety.womens_shelters
safety.safe_delivery_boxes
safety.cpted_points
safety.safe_return_routes     ← LineString geometry, loaded from SHP
```

Every table needs a **GIST spatial index** on the `location` column for fast viewport (bbox) queries:

```sql
CREATE INDEX ON safety.cctv USING GIST (location);
```

---

## SQL Schema

```sql
CREATE SCHEMA IF NOT EXISTS safety;

-- CCTV
CREATE TABLE safety.cctv (
    id              SERIAL PRIMARY KEY,
    address         TEXT,
    purpose         TEXT,        -- 생활방범, 교통단속, etc.
    camera_count    INT,
    installed_at    TEXT,
    source_id       TEXT UNIQUE, -- MNG_NO
    location        GEOMETRY(Point, 4326),
    refreshed_at    TIMESTAMPTZ
);
CREATE INDEX ON safety.cctv USING GIST (location);

-- Smart Street Lights (스마트가로등)
CREATE TABLE safety.street_lights (
    id                  SERIAL PRIMARY KEY,
    address             TEXT,
    has_cctv            BOOLEAN,
    has_wifi            BOOLEAN,
    has_emergency_call  BOOLEAN,
    installed_year      TEXT,
    institution         TEXT,
    source_id           TEXT UNIQUE,
    location            GEOMETRY(Point, 4326),
    refreshed_at        TIMESTAMPTZ
);
CREATE INDEX ON safety.street_lights USING GIST (location);

-- Safe Haven Convenience Store or Safety Guardian House for Women(여성안심지킴이집)
CREATE TABLE safety.safe_stores (
    id              SERIAL PRIMARY KEY,
    name            TEXT,        -- storNm
    address         TEXT,
    phone           TEXT,
    police_station  TEXT,        -- cmptncPolcsttnNm
    is_operating    BOOLEAN,     -- useYn
    source_id       TEXT UNIQUE,
    location        GEOMETRY(Point, 4326),
    refreshed_at    TIMESTAMPTZ
);
CREATE INDEX ON safety.safe_stores USING GIST (location);

-- Safe Delivery Boxes (전국안심택배함)
CREATE TABLE safety.safe_delivery_boxes (
    id              SERIAL PRIMARY KEY,
    name            TEXT,        -- fcltyNm
    address         TEXT,
    weekday_open    TEXT,
    weekday_close   TEXT,
    institution     TEXT,
    source_id       TEXT UNIQUE,
    location        GEOMETRY(Point, 4326),
    refreshed_at    TIMESTAMPTZ
);
CREATE INDEX ON safety.safe_delivery_boxes USING GIST (location);

-- Security Lights (보안등)
CREATE TABLE safety.security_lights (
    id              SERIAL PRIMARY KEY,
    name            TEXT,        -- lmpLcNm
    address         TEXT,
    count           INT,         -- installationCo
    install_type    TEXT,        -- installationType
    institution     TEXT,
    source_id       TEXT UNIQUE,
    location        GEOMETRY(Point, 4326),
    refreshed_at    TIMESTAMPTZ
);
CREATE INDEX ON safety.security_lights USING GIST (location);

-- Emergency Bells (안전비상벨)
CREATE TABLE safety.emergency_bells (
    id              SERIAL PRIMARY KEY,
    address         TEXT,        -- LCTN_ROAD_NM_ADDR
    install_place   TEXT,        -- INSTL_PSTN
    purpose         TEXT,        -- INSTL_PRPS
    police_linked   BOOLEAN,     -- POLC_LINK_EN
    source_id       TEXT UNIQUE, -- MNG_NO
    location        GEOMETRY(Point, 4326),
    refreshed_at    TIMESTAMPTZ
);
CREATE INDEX ON safety.emergency_bells USING GIST (location);

-- CPTED Points (범죄예방환경설계)
-- ⚠️ Raw coordinates are Korean TM (EPSG:5174) — must convert during ETL
-- ST_Transform(ST_SetSRID(ST_MakePoint(XMAP_CRTS, YMAP_CRTS), 5174), 4326)
CREATE TABLE safety.cpted_points (
    id              SERIAL PRIMARY KEY,
    police_station  TEXT,        -- POLSTN_NM
    address         TEXT,        -- LOTNO_ADDR
    design_target   TEXT,        -- CRIM_PRVN_ENVRN_DESIGN_DENG_TRGT
    progress        TEXT,        -- PRGRS_SITU
    source_id       TEXT UNIQUE, -- NTN_BRNCH_NO
    location        GEOMETRY(Point, 4326),
    refreshed_at    TIMESTAMPTZ
);
CREATE INDEX ON safety.cpted_points USING GIST (location);

-- Police Facilities (치안시설 — 경찰서, 지구대, 파출소, 치안센터)
-- Source: data.go.kr (3 APIs: 경찰청_전국 경찰서/지구대파출소/치안센터 주소 현황)
-- Chosen over SafeMap IF_0036: cleaner addresses → fewer geocoding failures (safety-critical)
-- ⚠️ No coordinates in any source — geocoded via Kakao API during ETL (delta-sync)
-- source_id: station_{경찰서명칭} | substation_{시도청}_{관서명}_{구분} | security_center_{경찰서}_{치안센터명}
CREATE TABLE safety.police_facilities (
    source_id       TEXT PRIMARY KEY,
    name            TEXT,               -- 경찰서명칭 / 관서명+구분 / 치안센터명
    facility_type   TEXT,               -- 경찰서 / 지구대 / 파출소 / 치안센터
    road_address    TEXT,               -- geocoding input; shown in popup
    police_agency   TEXT,               -- 시도경찰청 / 시도청
    police_station  TEXT,               -- parent 경찰서 (지구대/파출소/치안센터 only)
    location        GEOMETRY(Point, 4326),
    refreshed_at    TIMESTAMPTZ
);
CREATE INDEX ON safety.police_facilities USING GIST (location);

-- Seoul Safe Return Routes (서울시 안심귀갓길 경로)
-- ⚠️ Geometry comes from SHP file, not JSON API
-- JSON API only returns stats (bell_count, cctv_count, etc.) — no path geometry
-- Pipeline: Download SHP → ogr2ogr → insert as LineString
CREATE TABLE safety.safe_return_routes (
    id              SERIAL PRIMARY KEY,
    route_id        TEXT UNIQUE, -- ASG_ID
    route_name      TEXT,        -- ASG_NM
    district        TEXT,        -- SGG_NM
    neighborhood    TEXT,        -- EMD_NM
    bell_count      INT,
    cctv_count      INT,
    lamp_count      INT,
    location        GEOMETRY(LineString, 4326),
    refreshed_at    TIMESTAMPTZ
);
CREATE INDEX ON safety.safe_return_routes USING GIST (location);
```

```sql
-- Safe Return Route Items (안심귀갓길 안전시설물)
-- Facilities physically ON the route: CCTV, bells, signs
-- POINT_WKT: "POINT (126.968 37.579)" — already WGS84
CREATE TABLE safety.safe_return_route_items (
    id              SERIAL PRIMARY KEY,
    facility_id     TEXT UNIQUE,     -- FACI_ID
    route_id        TEXT,            -- ASG_ID → references safe_return_routes.route_id
    facility_code   TEXT,            -- FACI_CODE (301=CCTV, etc.)
    name            TEXT,            -- INST_NM
    count           INT,             -- INSTL_CNT
    location        GEOMETRY(Point, 4326), -- parsed from POINT_WKT
    refreshed_at    TIMESTAMPTZ
);
CREATE INDEX ON safety.safe_return_route_items USING GIST (location);
CREATE INDEX ON safety.safe_return_route_items (route_id);

-- Safe Return Route Services (안심귀갓길 서비스)
-- Services NEAR the route: shelters, police stations, convenience stores
CREATE TABLE safety.safe_return_route_services (
    id              SERIAL PRIMARY KEY,
    service_id      TEXT UNIQUE,     -- SERVICE_ID
    route_id        TEXT,            -- ASG_ID → references safe_return_routes.route_id
    service_code    TEXT,            -- SISUL_CODE (402=police station, etc.)
    name            TEXT,            -- INST_NM
    phone           TEXT,            -- INST_TELNO
    address         TEXT,            -- DE_LOC
    hours           TEXT,            -- WORK_DATE
    location        GEOMETRY(Point, 4326),
    refreshed_at    TIMESTAMPTZ
);
CREATE INDEX ON safety.safe_return_route_services USING GIST (location);
CREATE INDEX ON safety.safe_return_route_services (route_id);
```

---

## Table Relationships

```
Independent point data (no relationships between them):

  safety.cctv
  safety.street_lights
  safety.womens_shelters
  safety.safe_delivery_boxes
  safety.security_lights
  safety.emergency_bells
  safety.cpted_points
  safety.police_facilities

안심귀갓길 group (linked by ASG_ID):

  safe_return_routes          ← LineString — the route path (from SHP)
      │  route_id (ASG_ID)
      │
      ├── safe_return_route_items    ← Points ON the route (CCTV, bells, signs)
      │       route_id = ASG_ID
      │
      └── safe_return_route_services ← Points NEAR the route (shelters, police)
              route_id = ASG_ID
```

**Why no FK constraint?** ETL loads data in batches. A hard `FOREIGN KEY` constraint would fail if route items are inserted before the parent route exists. The relationship is enforced logically (same `ASG_ID` value), not by the database.

---

## Viewport Query Pattern

All map queries filter by bounding box — only return data visible in the current map view:

```sql
SELECT name, address, ST_AsGeoJSON(location) AS geojson
FROM safety.emergency_bells
WHERE ST_Within(
    location,
    ST_MakeEnvelope(126.8, 37.4, 127.1, 37.7, 4326)  -- bbox from frontend
);
```

---

## ETL Notes

| Table                 | Source                                                                 | Frequency         | Special handling                            |
| --------------------- | ---------------------------------------------------------------------- | ----------------- | ------------------------------------------- |
| `cctv`                | apis.data.go.kr/1741000/cctv_info                                      | Monthly           | None                                        |
| `street_lights`       | api.data.go.kr/openapi/tn_pubr_public_smart_streetlight_api            | Monthly           | None                                        |
| `womens_shelters`     | api.data.go.kr/openapi/tn_pubr_public_female_safety_prtchouse_api      | Monthly           | None                                        |
| `safe_delivery_boxes` | api.data.go.kr/openapi/tn_pubr_public_female_safety_hdrycstdyplace_api | Monthly           | None                                        |
| `security_lights`     | api.data.go.kr/openapi/tn_pubr_public_scrty_lmp_api                    | Monthly           | None                                        |
| `emergency_bells`     | apis.data.go.kr/1741000/emergency_call_box_info                        | Monthly           | None                                        |
| `cpted_points`        | safetydata.go.kr/V2/api/DSSP-IF-00090                                  | Monthly           | **Coordinate conversion EPSG:5174 → 4326**  |
| `safe_return_routes`  | SHP file download                                                      | Manual / periodic | **ogr2ogr conversion, LineString geometry** |
| `police_facilities`   | data.go.kr (경찰청 경찰서/지구대파출소/치안센터 3 APIs)                | Annually          | **No coordinates — Kakao geocoding per type; delta-sync by source_id** |
