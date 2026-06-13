# SHP File Loading — 안심귀갓길 경로

## Why SHP?

The 안심귀갓길 JSON API only returns stats per route segment:

```json
{
  "BELL_CNT": "4",
  "CCTV_CNT": "13",
  "LAMP_CNT": "14",
  "ASG_ID": "1111011000_04"
}
```

No geometry — no coordinates, no path. The actual route path (the line drawn on the map) only exists as a SHP file download from Seoul Open Data (서울 열린데이터광장).

Two data sources, linked by `ASG_ID`:

| Source | Contains | Loaded how |
|---|---|---|
| JSON API | Stats (bell count, CCTV count, etc.) | Monthly UPDATE query |
| SHP file | Route geometry (LineString path) | Manual, one-time |

---

## What Is a SHP File?

A SHP (Shapefile) is a GIS format for storing geographic shapes. It is always a zip containing multiple files that work together:

| File | Purpose |
|---|---|
| `.shp` | The actual geometry (coordinates of the path) |
| `.dbf` | Attribute data (bell count, district name, etc.) |
| `.prj` | Coordinate system declaration |
| `.shx` | Index linking .shp and .dbf |
| `.cpg` | Encoding declaration |

`shp2pgsql` reads all of them together to produce valid PostGIS data.

---

## Loading Flow

```
① Download SHP zip from Seoul Open Data (manual)
        ↓
② Rename file on Mac (avoid Korean filename issues)
   mv 안심귀갓길\ 경로\ 데이터_SHP.zip safe-route.zip
        ↓
③ Upload to EC2
   scp safe-route.zip ownjoy:~/
        ↓
④ Unzip on EC2
   unzip safe-route.zip -d ~/safe-route
        ↓
⑤ Rename files (Korean filenames garbled on Linux)
   cd ~/safe-route
   for f in *; do mv "$f" "safe-route.${f##*.}"; done
        ↓
⑥ Check coordinate system
   cat safe-route.prj
   → WGS84 (4326) — no conversion needed
        ↓
⑦ Load into staging table
   shp2pgsql -s 4326 -W EUC-KR safe-route.shp safety.routes_stage | sudo -u postgres psql ownjoy
        ↓
⑧ Transfer from staging → safety.safe_return_routes
   INSERT INTO ... SELECT ... FROM safety.routes_stage
        ↓
⑨ Drop staging table
   DROP TABLE safety.routes_stage
        ↓
⑩ Verify on geojson.io ✅
```

---

## Issues Encountered and How They Were Solved

### 1. Korean filenames garbled on Linux
SHP files had Korean filenames that showed as `╛╚╜╔▒═...` on EC2.

**Fix:** Renamed all files using a bash loop before loading:
```bash
for f in *; do mv "$f" "safe-route.${f##*.}"; done
```

### 2. Encoding error (EUC-KR)
```
Unable to convert field name to UTF-8
```
The .dbf attribute file used Korean encoding (EUC-KR), not UTF-8.

**Fix:** Specify encoding with `-W` flag:
```bash
shp2pgsql -s 4326 -W EUC-KR safe-route.shp ...
```

### 3. Table already exists
`shp2pgsql` tries to CREATE a new table by default, but `safety.safe_return_routes` already existed.

**Fix:** Load into a temporary staging table first (`safety.routes_stage`), then INSERT into the proper table with correct English column names.

### 4. Geometry type mismatch — MULTILINESTRING vs LineString
`shp2pgsql` reported `Postgis type: MULTILINESTRING`, but our table was created with `GEOMETRY(LineString, 4326)`.

**Why:** SHP "Arc" type can contain single or multiple line segments. `shp2pgsql` conservatively upcasts all arcs to MULTILINESTRING. Our routes each contain one LineString inside a MultiLineString wrapper — like one apple in a box.

**Fix:** Alter the column type to accept MULTILINESTRING:
```sql
ALTER TABLE safety.safe_return_routes
ALTER COLUMN location TYPE GEOMETRY(MultiLineString, 4326)
USING ST_Multi(location);
```

Visual result on the map is identical to LineString.

### 5. length_m cast error
`길이` field contains decimal values like "211.25" (meters), not whole numbers.

**Fix:** Changed `length_m` column from `INT` to `NUMERIC(10,2)`.

---

## Staging Table — Why?

`shp2pgsql` generates a table with Korean/truncated column names from the .dbf file. Our proper table uses English column names. The INSERT query maps between them:

```sql
INSERT INTO safety.safe_return_routes (route_id, route_name, ...)
SELECT "안심귀갓_3", "안심귀갓_4", ...
FROM safety.routes_stage;
```

The staging table is dropped after the transfer.

---

## Update Frequency

| Data | Frequency | Method |
|---|---|---|
| Route geometry (SHP) | Once / when Seoul releases new shapefile | Full manual process above |
| Stats (bell_count, cctv_count, lamp_count) | Monthly | UPDATE from JSON API |

The geometry almost never changes. Only the stats need monthly updates.

---

## Verification

Check row count:
```sql
SELECT COUNT(*) FROM safety.safe_return_routes;
-- should be 362
```

Visual check — export one route as GeoJSON and paste into geojson.io:
```sql
SELECT ST_AsGeoJSON(location)
FROM safety.safe_return_routes
WHERE route_id = '1111011000_04';
```

Wrap in FeatureCollection before pasting:
```json
{
  "type": "FeatureCollection",
  "features": [{
    "type": "Feature",
    "geometry": { PASTE_ST_AsGeoJSON_OUTPUT_HERE },
    "properties": {}
  }]
}
```
