exports.up = (pgm) => {
  pgm.sql(`
    BEGIN;
      DROP TABLE safety.police_facilities;
      ALTER TABLE safety.police_facilities_safemap RENAME TO police_facilities;
      ALTER INDEX safety.police_facilities_safemap_location_idx RENAME TO police_facilities_location_idx;
    COMMIT;
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    BEGIN;
      ALTER TABLE safety.police_facilities RENAME TO police_facilities_safemap;
      ALTER INDEX safety.police_facilities_location_idx RENAME TO police_facilities_safemap_location_idx;
    COMMIT;
  `);
};
