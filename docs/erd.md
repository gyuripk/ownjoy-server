# Entity Relationship Diagram

## Platform Tables

```mermaid
erDiagram

    USERS {
        int id PK
        string email
        string password_hash
        boolean is_verified
        timestamp created_at
    }

    PROFILES {
        int id PK
        int user_id FK
        string name
        int age
        string occupation
        string bio
        string profile_image
        timestamp updated_at
    }

    FLATMATE_LISTINGS {
        int id PK
        int user_id FK
        string district
        geometry location
        int budget
        date move_in_date
        boolean is_active
        timestamp created_at
    }

    FLATMATE_PREFERENCES {
        int listing_id PK
        int age_min
        int age_max
        string occupation
        boolean pet_ok
        boolean smoking_ok
    }

    FLATMATE_INTERESTS {
        int id PK
        int sender_id FK
        int listing_id FK
        string status
        timestamp created_at
    }

    CONVERSATIONS {
        int id PK
        timestamp created_at
    }

    CONVERSATION_PARTICIPANTS {
        int conversation_id PK
        int user_id FK
    }

    MESSAGES {
        int id PK
        int conversation_id FK
        int sender_id FK
        string content
        timestamp sent_at
    }

    SAVED_LOCATIONS {
        int id PK
        int user_id FK
        string name
        geometry location
        timestamp created_at
    }

    AREA_REVIEWS {
        int id PK
        int user_id FK
        int safety_rating
        string review_text
        geometry location
        timestamp created_at
    }

    USERS ||--|| PROFILES : "has"
    USERS ||--o{ FLATMATE_LISTINGS : "posts"
    USERS ||--o{ FLATMATE_INTERESTS : "sends"
    USERS ||--o{ CONVERSATION_PARTICIPANTS : "joins"
    USERS ||--o{ MESSAGES : "sends"
    USERS ||--o{ SAVED_LOCATIONS : "bookmarks"
    USERS ||--o{ AREA_REVIEWS : "writes"
    FLATMATE_LISTINGS ||--|| FLATMATE_PREFERENCES : "has"
    FLATMATE_LISTINGS ||--o{ FLATMATE_INTERESTS : "receives"
    CONVERSATIONS ||--|{ CONVERSATION_PARTICIPANTS : "has"
    CONVERSATIONS ||--|{ MESSAGES : "contains"
```

---

## Safety Data Tables

```mermaid
erDiagram

    SAFETY_CCTV {
        int id PK
        string source_id UK
        string address
        string purpose
        int camera_count
        geometry location
        timestamp refreshed_at
    }

    SAFETY_STREET_LIGHTS {
        int id PK
        string source_id UK
        string address
        boolean has_cctv
        boolean has_wifi
        boolean has_emergency_call
        geometry location
        timestamp refreshed_at
    }

    SAFETY_EMERGENCY_BELLS {
        int id PK
        string source_id UK
        string address
        string purpose
        boolean police_linked
        geometry location
        timestamp refreshed_at
    }

    SAFETY_SECURITY_LIGHTS {
        int id PK
        string source_id UK
        string name
        string address
        int count
        geometry location
        timestamp refreshed_at
    }

    SAFETY_WOMENS_SHELTERS {
        int id PK
        string source_id UK
        string name
        string address
        boolean is_operating
        geometry location
        timestamp refreshed_at
    }

    SAFETY_SAFE_DELIVERY_BOXES {
        int id PK
        string source_id UK
        string name
        string address
        geometry location
        timestamp refreshed_at
    }

    SAFETY_CPTED_POINTS {
        int id PK
        string source_id UK
        string address
        string design_target
        string progress
        geometry location
        timestamp refreshed_at
    }

    SAFE_RETURN_ROUTES {
        int id PK
        string route_id UK
        string route_name
        string district
        int bell_count
        int cctv_count
        int lamp_count
        geometry location
        timestamp refreshed_at
    }

    SAFE_RETURN_ROUTE_ITEMS {
        int id PK
        string facility_id UK
        string route_id FK
        string facility_code
        string name
        geometry location
        timestamp refreshed_at
    }

    SAFE_RETURN_ROUTE_SERVICES {
        int id PK
        string service_id UK
        string route_id FK
        string service_code
        string name
        string address
        geometry location
        timestamp refreshed_at
    }

    SAFE_RETURN_ROUTES ||--o{ SAFE_RETURN_ROUTE_ITEMS : "has facilities"
    SAFE_RETURN_ROUTES ||--o{ SAFE_RETURN_ROUTE_SERVICES : "has services"
```

---

## Key Types

| Key  | Meaning                           |
| ---- | --------------------------------- |
| `PK` | Primary key                       |
| `FK` | Foreign key                       |
| `UK` | Unique key - used for ETL upserts |

## Notes

- `geometry` = PostGIS Point for all tables except `SAFE_RETURN_ROUTES` which uses LineString
- Safety tables have no FK relationships between each other - independent government datasets
- `route_id` on items and services tables is a logical FK only, not enforced by the database
