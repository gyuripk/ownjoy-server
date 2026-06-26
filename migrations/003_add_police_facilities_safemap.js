exports.up = (pgm) => {
  pgm.sql(`
    CREATE TABLE IF NOT EXISTS safety.police_facilities_safemap (
      source_id      TEXT PRIMARY KEY,
      name           TEXT,
      facility_type  TEXT,
      road_address   TEXT,
      phone          TEXT,
      police_agency  TEXT,
      police_station TEXT,
      location       GEOMETRY(Point, 4326),
      refreshed_at   TIMESTAMPTZ
    );
    CREATE INDEX IF NOT EXISTS police_facilities_safemap_location_idx
      ON safety.police_facilities_safemap USING GIST (location);
  `);
};

exports.down = (pgm) => {
  pgm.sql(`DROP TABLE IF EXISTS safety.police_facilities_safemap;`);
};
