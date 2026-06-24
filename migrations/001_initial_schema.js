exports.up = (pgm) => {
  pgm.sql(`
    CREATE SCHEMA IF NOT EXISTS safety;

    CREATE TABLE IF NOT EXISTS safety.cctv (
      source_id     TEXT PRIMARY KEY,
      region_code   TEXT,
      road_address  TEXT,
      lot_address   TEXT,
      purpose       TEXT,
      camera_count  INTEGER,
      created_date  DATE,
      location      GEOMETRY(Point, 4326),
      refreshed_at  TIMESTAMPTZ
    );
    CREATE INDEX IF NOT EXISTS cctv_location_idx ON safety.cctv USING GIST (location);

    CREATE TABLE IF NOT EXISTS safety.emergency_bells (
      source_id          TEXT PRIMARY KEY,
      region_code        TEXT,
      road_address       TEXT,
      lot_address        TEXT,
      install_place_type TEXT,
      install_location   TEXT,
      link_method        TEXT,
      police_linked      BOOLEAN,
      security_linked    BOOLEAN,
      office_linked      BOOLEAN,
      is_working         BOOLEAN,
      last_checked_date  DATE,
      created_date       DATE,
      location           GEOMETRY(Point, 4326),
      refreshed_at       TIMESTAMPTZ
    );
    CREATE INDEX IF NOT EXISTS emergency_bells_location_idx ON safety.emergency_bells USING GIST (location);

    CREATE TABLE IF NOT EXISTS safety.regions (
      code TEXT PRIMARY KEY,
      name TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS safety.safe_delivery_boxes (
      id            SERIAL PRIMARY KEY,
      region_code   TEXT,
      name          TEXT,
      road_address  TEXT,
      lot_address   TEXT,
      weekday_open  TIME,
      weekday_close TIME,
      saturday_open  TIME,
      saturday_close TIME,
      holiday_open   TIME,
      holiday_close  TIME,
      free_hours    INTEGER,
      late_fee      INTEGER,
      support_phone TEXT,
      created_date  DATE,
      location      GEOMETRY(Point, 4326),
      refreshed_at  TIMESTAMPTZ
    );
    CREATE INDEX IF NOT EXISTS safe_delivery_boxes_location_idx ON safety.safe_delivery_boxes USING GIST (location);

    CREATE TABLE IF NOT EXISTS safety.safe_stores (
      id             SERIAL PRIMARY KEY,
      region_code    TEXT,
      name           TEXT,
      road_address   TEXT,
      lot_address    TEXT,
      phone          TEXT,
      police_station TEXT,
      is_operating   BOOLEAN,
      created_date   DATE,
      location       GEOMETRY(Point, 4326),
      refreshed_at   TIMESTAMPTZ
    );
    CREATE INDEX IF NOT EXISTS safe_stores_location_idx ON safety.safe_stores USING GIST (location);

    CREATE TABLE IF NOT EXISTS safety.smart_street_lights (
      id                 SERIAL PRIMARY KEY,
      region_code        TEXT,
      lamp_type          TEXT,
      road_address       TEXT,
      lot_address        TEXT,
      always_on          BOOLEAN,
      has_cctv           BOOLEAN,
      has_wifi           BOOLEAN,
      has_gps            BOOLEAN,
      has_beacon         BOOLEAN,
      has_emergency_call BOOLEAN,
      created_date       DATE,
      location           GEOMETRY(Point, 4326),
      refreshed_at       TIMESTAMPTZ
    );
    CREATE INDEX IF NOT EXISTS smart_street_lights_location_idx ON safety.smart_street_lights USING GIST (location);

    CREATE TABLE IF NOT EXISTS safety.safe_return_routes (
      route_id           TEXT PRIMARY KEY,
      route_name         TEXT,
      district           TEXT,
      district_code      TEXT,
      neighborhood       TEXT,
      neighborhood_code  TEXT,
      length_m           NUMERIC(10, 2),
      bell_count         INTEGER,
      cctv_count         INTEGER,
      lamp_count         INTEGER,
      location_desc      TEXT,
      built_year         INTEGER,
      created_date       DATE,
      location           GEOMETRY(MultiLineString, 4326),
      refreshed_at       TIMESTAMPTZ
    );
    CREATE INDEX IF NOT EXISTS safe_return_routes_location_idx ON safety.safe_return_routes USING GIST (location);
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DROP TABLE IF EXISTS safety.safe_return_routes;
    DROP TABLE IF EXISTS safety.smart_street_lights;
    DROP TABLE IF EXISTS safety.safe_stores;
    DROP TABLE IF EXISTS safety.safe_delivery_boxes;
    DROP TABLE IF EXISTS safety.regions;
    DROP TABLE IF EXISTS safety.emergency_bells;
    DROP TABLE IF EXISTS safety.cctv;
    DROP SCHEMA IF EXISTS safety;
  `);
};
