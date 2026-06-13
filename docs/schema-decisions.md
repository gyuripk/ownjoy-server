# Schema Design Decisions

## Decisions Made and Why

---

### 1. Primary Key — `source_id` vs `SERIAL id`

**Decision: `source_id TEXT PRIMARY KEY` for most safety tables, `SERIAL id` for tables with no natural unique key**

For safety tables with a government-assigned management number (CCTV `MNG_NO`, etc.):
- Nothing FK-references safety tables — they are standalone
- All real queries use the GIST spatial index on `location`, not the PK
- `source_id` is the ETL upsert key — it being the PK makes ETL logic clean
- Confirmed unique by inspecting API data (sequential government-assigned IDs)

**Exception: `safety.smart_street_lights` uses `SERIAL PRIMARY KEY`**

The smart street lights API (스마트가로등) has no management number — none of its 25 fields is a unique identifier. Options considered:

| Option | Problem |
|---|---|
| `latitude \|\| ',' \|\| longitude` as synthetic key | Coordinate may shift slightly between updates → duplicate row instead of update |
| Composite unique constraint | Address fields are nullable, not reliable |
| `SERIAL PRIMARY KEY` + truncate-reload | ✅ Simple and reliable |

Since this table has only 12,714 records (visible in `totalCount` of API response), truncate + reload completes in under a second. The upsert pattern is not worth the complexity.

**ETL logic for smart_street_lights:**
```sql
TRUNCATE TABLE safety.smart_street_lights;
INSERT INTO safety.smart_street_lights (...) VALUES (...); -- all 12,714 rows
```

**Rule: use truncate + reload when:**
- The API has no unique management number
- Total record count is small enough to reload in seconds (under ~50,000 rows)

For platform tables (users, listings, messages):
- Other tables reference them constantly via FK
- INT is significantly faster for joins
- Internal IDs should not expose external system logic

---

### 2. Data Types

Rules applied across all tables:

| Rule | Example |
|---|---|
| If you won't do math on it → `TEXT` | Phone numbers, codes, IDs |
| Full date (YYYY-MM-DD) → `DATE` | `DAT_CRTR_YMD: "2026-06-30"` |
| Date + time → `TIMESTAMPTZ` | `DAT_UPDT_PNT: "2026-05-27 22:58:19"` |
| Count or measurable number → `INT` | `CAM_CNTOM: "3"` |
| Yes/No flags → `BOOLEAN` | `cctvYn: "Y"` |
| Lat/lng coordinates → `GEOMETRY(Point, 4326)` | `WGS84_LAT` + `WGS84_LOT` |
| Route path → `GEOMETRY(LineString, 4326)` | 안심귀갓길 SHP data |

Phone numbers, district codes, and management numbers all look numeric but are stored as TEXT — they are identifiers, not values you calculate with.

---

### 3. Institution Data — Normalization Decision

**Decision: `instt_code` only in safety tables + separate `safety.institutions` reference table**

**What was considered:**

**Option A — Reference table (chosen):**
```
safety.institutions
  instt_code PK
  instt_name

safety.cctv
  instt_code   ← code only, no name
```

**Option B — Name in every row:**
```
safety.cctv
  instt_code
  instt_name   ← duplicated across millions of rows
```

**Option C — Code only, no reference table:**
```
safety.cctv
  instt_code   ← no name anywhere
```

**Why Option A:**

The name is only ever needed for UI display — dropdown filters, chart labels. It is never needed inside analysis queries row by row.

Usage scenarios analyzed:

| Scenario | Name needed? | How |
|---|---|---|
| Click map spot → show popup | ❌ No | address, purpose, camera count only |
| Filter map by district | ❌ No | `WHERE instt_code = '...'` |
| Count infrastructure per district | ❌ No | `GROUP BY instt_code` |
| District filter dropdown in UI | ✅ Yes | Query institutions table **once** |
| Safety insight chart labels | ✅ Yes | Query institutions table **once** |

Name is needed **once** — to build UI components. Never inside per-row analysis.

**Industry standard context:**

Storing name in every row violates **3rd Normal Form (3NF)** — the relational database design standard. The rule: if `instt_name` is determined by `instt_code`, it belongs in a reference table, not duplicated across millions of rows.

**Update anomaly risk:** if an institution name changes, denormalized design requires updating millions of rows. Normalized design requires updating one row.

Denormalization is accepted in data warehouses (OLAP) and ETL staging tables where read speed matters more than integrity. But since ownjoy is a full relational platform (users, matching, chat), normalized design is the correct approach.

---

### 4. Spatial Indexes

Every table with a `location` column gets a GIST index:

```sql
CREATE INDEX ON safety.cctv USING GIST (location);
```

**Why GIST, not regular index:** GIST (Generalized Search Tree) is PostGIS's spatial index type. It enables fast bounding box queries — "give me all CCTVs within this viewport" — which is the core query pattern for every map feature.

Without GIST, a viewport query on 375,000 CCTV records would scan every row. With GIST, it returns in ~50ms.

---

### 5. No FK Constraints on Safety Tables

`safe_return_route_items.route_id` and `safe_return_route_services.route_id` reference `safe_return_routes.route_id` logically but not enforced by a database constraint.

**Why:** ETL loads data in batches. A hard FK constraint fails if child records are inserted before the parent route exists. The relationship is maintained by ETL load order, not the database.

---

### 6. Safety Tables Have No Relationships Between Each Other

CCTV, emergency bells, street lights, etc. are all independent government datasets from different APIs. There is no shared key between them.

Cross-table analysis (e.g., "all safety infrastructure in 종로구") is done by querying each table separately with the same `instt_code` filter, then combining results — not by joining tables to each other.

---

### 7. Address Columns — Korean Dual Address System

**Decision: store both columns separately, use PostGIS for geographic filtering**

Government datasets include two address types:

| Field | Korean | System | Contains 동? |
|---|---|---|---|
| `rdnmadr` | 소재지도로명주소 | Road name address | ❌ No |
| `lnmadr` | 소재지지번주소 | Lot number address | ✅ Yes |

Some records only have one type. Neither is guaranteed to be present.

**Schema:**
```sql
road_address  TEXT,   -- rdnmadr (도로명주소), nullable
lot_address   TEXT,   -- lnmadr (지번주소), nullable
```

**Why not merge into one column?**
- 도로명 and 지번 have different structures — mixed in one column, you can't tell which is which
- 도로명주소 doesn't include 동 in the string — 지번주소 does
- Future editing or parsing becomes ambiguous

**Why not convert everything to one format?**
- Government Juso API converts 지번 → 도로명, but rate-limited to ~1,000 req/min
- 1,841,235 street lights = hours of conversion API calls per monthly ETL run
- Not worth it

**For display:** `COALESCE(road_address, lot_address)` — show whichever is available. Users don't care which format it is in the popup.

**For geographic filtering — never use address strings:**

| Analysis goal | Correct method |
|---|---|
| Filter by 구 (district) | `WHERE region_code = '11680'` |
| Filter by 동 (neighborhood) | PostGIS spatial join with 행정동 boundary polygons |
| Find infra near a point | `ST_DWithin(location, point, radius)` |
| Safety score for an area | PostGIS bbox or `ST_Within` query |

Load 행정동 경계 shapefiles (free from NGII) into a reference table once. All geographic filtering goes through geometry, never through address string parsing.

---

## Final Safety Schema Structure

```
safety.institutions          ← reference table (code → name)
  instt_code PK
  instt_name

safety.cctv                  ← 375,000 records nationwide
safety.street_lights         ← 1,841,235 records
safety.emergency_bells       ← 88,843 records
safety.security_lights
safety.womens_shelters
safety.safe_delivery_boxes
safety.cpted_points          ← coordinates need conversion (EPSG:5174 → 4326)

safety.safe_return_routes    ← LineString geometry from SHP file
safety.safe_return_route_items    → route_id links to safe_return_routes
safety.safe_return_route_services → route_id links to safe_return_routes
```

All safety tables:
- Use `source_id TEXT PRIMARY KEY` (government-assigned unique ID)
- Have `instt_code TEXT` referencing `safety.institutions`
- Have `location GEOMETRY(Point, 4326)` with a GIST index
- Have `refreshed_at TIMESTAMPTZ` to track ETL update time
