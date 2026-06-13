# Platform Vision — ownjoy

## What ownjoy Is

A women's lifestyle platform built on a safety map foundation. Three core features:

1. **Safety Map** — find safe neighbourhoods, visualise crime data, CCTV coverage, emergency bells
2. **Flatmate Matching** — women-only listing and matching system to find safe flatmates
3. **Chat** — direct messaging between matched users

---

## How the Safety Map Connects to the Platform

The safety data is not just a feature — it powers the entire platform.

```
User searches for a flat in Mapo-gu
    ↓
Platform queries PostGIS for that neighbourhood:
    - CCTV density
    - Emergency bell locations
    - Street light coverage
    - Safe return routes nearby
    ↓
Displays safety score alongside the flatmate listing
```

Safety data becomes the context that makes flatmate listings meaningful for women.

---

## Data Architecture

### Safety Data (already designed)
Independent government data, loaded monthly via ETL. Powers the map layer.

```
safety.cctv
safety.street_lights
safety.emergency_bells
safety.security_lights
safety.womens_shelters
safety.safe_delivery_boxes
safety.cpted_points
safety.safe_return_routes
safety.safe_return_route_items     → linked to routes via ASG_ID
safety.safe_return_route_services  → linked to routes via ASG_ID
```

### Platform Data (to build)
Relational user data. Powers matching, chat, and community features.

```
users ──────────────────────────────────────┐
  │                                         │
  ├── profiles                              │
  │                                         │
  ├── flatmate_listings                     │
  │       │                                 │
  │       └── flatmate_interests ───────────┘
  │               │
  │               └── conversations
  │                       │
  │                       └── messages
  │
  ├── saved_locations   (map bookmarks)
  └── area_reviews      (community safety ratings)
```

---

## Platform Table Definitions

### Users & Auth

```sql
CREATE TABLE users (
    id              SERIAL PRIMARY KEY,
    email           TEXT UNIQUE NOT NULL,
    password_hash   TEXT NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT now(),
    is_verified     BOOLEAN DEFAULT false
);

CREATE TABLE profiles (
    id              SERIAL PRIMARY KEY,
    user_id         INT UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    name            TEXT,
    age             INT,
    occupation      TEXT,
    bio             TEXT,
    profile_image   TEXT,       -- S3 URL
    updated_at      TIMESTAMPTZ DEFAULT now()
);
```

### Flatmate Matching

```sql
CREATE TABLE flatmate_listings (
    id              SERIAL PRIMARY KEY,
    user_id         INT REFERENCES users(id) ON DELETE CASCADE,
    district        TEXT,               -- 마포구, 서대문구, etc.
    location        GEOMETRY(Point, 4326), -- exact listing location
    budget          INT,                -- monthly rent in KRW
    move_in_date    DATE,
    description     TEXT,
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX ON flatmate_listings USING GIST (location);

CREATE TABLE flatmate_preferences (
    listing_id      INT PRIMARY KEY REFERENCES flatmate_listings(id) ON DELETE CASCADE,
    age_min         INT,
    age_max         INT,
    occupation      TEXT,               -- filter by occupation type
    pet_ok          BOOLEAN DEFAULT false,
    smoking_ok      BOOLEAN DEFAULT false
);

-- User A expresses interest in User B's listing
CREATE TABLE flatmate_interests (
    id              SERIAL PRIMARY KEY,
    sender_id       INT REFERENCES users(id) ON DELETE CASCADE,
    listing_id      INT REFERENCES flatmate_listings(id) ON DELETE CASCADE,
    status          TEXT DEFAULT 'pending', -- pending / accepted / rejected
    created_at      TIMESTAMPTZ DEFAULT now(),
    UNIQUE (sender_id, listing_id)
);
```

### Chat

```sql
-- A conversation is created when an interest is accepted
CREATE TABLE conversations (
    id              SERIAL PRIMARY KEY,
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE conversation_participants (
    conversation_id INT REFERENCES conversations(id) ON DELETE CASCADE,
    user_id         INT REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (conversation_id, user_id)
);

CREATE TABLE messages (
    id              SERIAL PRIMARY KEY,
    conversation_id INT REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id       INT REFERENCES users(id) ON DELETE CASCADE,
    content         TEXT NOT NULL,
    sent_at         TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX ON messages (conversation_id, sent_at);
```

### Map & Community

```sql
-- User bookmarks a location on the safety map
CREATE TABLE saved_locations (
    id              SERIAL PRIMARY KEY,
    user_id         INT REFERENCES users(id) ON DELETE CASCADE,
    name            TEXT,
    note            TEXT,
    location        GEOMETRY(Point, 4326),
    created_at      TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX ON saved_locations USING GIST (location);

-- Community safety ratings by neighbourhood
CREATE TABLE area_reviews (
    id              SERIAL PRIMARY KEY,
    user_id         INT REFERENCES users(id) ON DELETE CASCADE,
    safety_rating   INT CHECK (safety_rating BETWEEN 1 AND 5),
    review_text     TEXT,
    location        GEOMETRY(Point, 4326),
    created_at      TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX ON area_reviews USING GIST (location);
```

---

## Key Relationships

| Relationship | How |
|---|---|
| User → Profile | One-to-one, `profiles.user_id` FK |
| User → Listings | One-to-many, `flatmate_listings.user_id` FK |
| Listing → Preferences | One-to-one, `flatmate_preferences.listing_id` FK |
| User → Interests | Many-to-many via `flatmate_interests` |
| Interest → Conversation | When accepted, a conversation is created |
| Conversation → Messages | One-to-many, `messages.conversation_id` FK |
| User → Saved Locations | One-to-many |
| User → Area Reviews | One-to-many |

---

## Why PostgreSQL + PostGIS

| Feature | Why PostgreSQL |
|---|---|
| Flatmate matching | Relational joins between users, listings, interests |
| Chat | FK constraints ensure messages belong to valid conversations |
| Safety map | PostGIS spatial queries for neighbourhood safety scores |
| Area reviews | Aggregate ratings by geographic area with `ST_Within` |
| Future scaling | Transactions, indexes, full-text search all built in |

---

## Build Order

1. **Now** — Safety map data (ETL pipeline, PostGIS schema) ← current stage
2. **Next** — User auth (`users`, `profiles`)
3. **Then** — Flatmate listings + matching (`flatmate_listings`, `flatmate_interests`)
4. **Then** — Chat (`conversations`, `messages`)
5. **Later** — Community features (`area_reviews`, neighbourhood safety scores)
