--
-- PostgreSQL database dump
--

\restrict fErA7rtxjcA0exY4gbNstryMC5qveIsGO1g19X7OgHhM2530Yc7k6ItkmIXRdW4

-- Dumped from database version 16.14 (Ubuntu 16.14-0ubuntu0.24.04.1)
-- Dumped by pg_dump version 16.14 (Ubuntu 16.14-0ubuntu0.24.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: safety; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA IF NOT EXISTS safety;


ALTER SCHEMA safety OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: cctv; Type: TABLE; Schema: safety; Owner: postgres
--

CREATE TABLE IF NOT EXISTS safety.cctv (
    source_id text NOT NULL,
    region_code text,
    road_address text,
    purpose text,
    camera_count integer,
    created_date date,
    location public.geometry(Point,4326),
    refreshed_at timestamp with time zone,
    lot_address text
);


ALTER TABLE safety.cctv OWNER TO postgres;

--
-- Name: emergency_bells; Type: TABLE; Schema: safety; Owner: postgres
--

CREATE TABLE IF NOT EXISTS safety.emergency_bells (
    source_id text NOT NULL,
    region_code text,
    road_address text,
    lot_address text,
    install_place_type text,
    install_location text,
    link_method text,
    police_linked boolean,
    security_linked boolean,
    office_linked boolean,
    is_working boolean,
    last_checked_date date,
    created_date date,
    location public.geometry(Point,4326),
    refreshed_at timestamp with time zone
);


ALTER TABLE safety.emergency_bells OWNER TO postgres;

--
-- Name: regions; Type: TABLE; Schema: safety; Owner: postgres
--

CREATE TABLE IF NOT EXISTS safety.regions (
    code text NOT NULL,
    name text NOT NULL
);


ALTER TABLE safety.regions OWNER TO postgres;

--
-- Name: safe_delivery_boxes; Type: TABLE; Schema: safety; Owner: postgres
--

CREATE TABLE IF NOT EXISTS safety.safe_delivery_boxes (
    id integer NOT NULL,
    region_code text,
    name text,
    road_address text,
    lot_address text,
    weekday_open time without time zone,
    weekday_close time without time zone,
    saturday_open time without time zone,
    saturday_close time without time zone,
    holiday_open time without time zone,
    holiday_close time without time zone,
    free_hours integer,
    late_fee integer,
    support_phone text,
    created_date date,
    location public.geometry(Point,4326),
    refreshed_at timestamp with time zone
);


ALTER TABLE safety.safe_delivery_boxes OWNER TO postgres;

--
-- Name: safe_delivery_boxes_id_seq; Type: SEQUENCE; Schema: safety; Owner: postgres
--

CREATE SEQUENCE safety.safe_delivery_boxes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE safety.safe_delivery_boxes_id_seq OWNER TO postgres;

--
-- Name: safe_delivery_boxes_id_seq; Type: SEQUENCE OWNED BY; Schema: safety; Owner: postgres
--

ALTER SEQUENCE safety.safe_delivery_boxes_id_seq OWNED BY safety.safe_delivery_boxes.id;


--
-- Name: safe_return_routes; Type: TABLE; Schema: safety; Owner: postgres
--

CREATE TABLE IF NOT EXISTS safety.safe_return_routes (
    route_id text NOT NULL,
    route_name text,
    district text,
    district_code text,
    neighborhood text,
    neighborhood_code text,
    length_m numeric(10,2),
    bell_count integer,
    cctv_count integer,
    lamp_count integer,
    location_desc text,
    built_year integer,
    created_date date,
    location public.geometry(MultiLineString,4326),
    refreshed_at timestamp with time zone
);


ALTER TABLE safety.safe_return_routes OWNER TO postgres;

--
-- Name: safe_stores; Type: TABLE; Schema: safety; Owner: postgres
--

CREATE TABLE IF NOT EXISTS safety.safe_stores (
    id integer NOT NULL,
    region_code text,
    name text,
    road_address text,
    lot_address text,
    phone text,
    police_station text,
    is_operating boolean,
    created_date date,
    location public.geometry(Point,4326),
    refreshed_at timestamp with time zone
);


ALTER TABLE safety.safe_stores OWNER TO postgres;

--
-- Name: safe_stores_id_seq; Type: SEQUENCE; Schema: safety; Owner: postgres
--

CREATE SEQUENCE safety.safe_stores_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE safety.safe_stores_id_seq OWNER TO postgres;

--
-- Name: safe_stores_id_seq; Type: SEQUENCE OWNED BY; Schema: safety; Owner: postgres
--

ALTER SEQUENCE safety.safe_stores_id_seq OWNED BY safety.safe_stores.id;


--
-- Name: smart_street_lights; Type: TABLE; Schema: safety; Owner: postgres
--

CREATE TABLE IF NOT EXISTS safety.smart_street_lights (
    id integer NOT NULL,
    region_code text,
    lamp_type text,
    road_address text,
    lot_address text,
    always_on boolean,
    has_cctv boolean,
    has_wifi boolean,
    has_gps boolean,
    has_beacon boolean,
    has_emergency_call boolean,
    created_date date,
    location public.geometry(Point,4326),
    refreshed_at timestamp with time zone
);


ALTER TABLE safety.smart_street_lights OWNER TO postgres;

--
-- Name: smart_street_lights_id_seq; Type: SEQUENCE; Schema: safety; Owner: postgres
--

CREATE SEQUENCE safety.smart_street_lights_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE safety.smart_street_lights_id_seq OWNER TO postgres;

--
-- Name: smart_street_lights_id_seq; Type: SEQUENCE OWNED BY; Schema: safety; Owner: postgres
--

ALTER SEQUENCE safety.smart_street_lights_id_seq OWNED BY safety.smart_street_lights.id;


--
-- Name: safe_delivery_boxes id; Type: DEFAULT; Schema: safety; Owner: postgres
--

ALTER TABLE ONLY safety.safe_delivery_boxes ALTER COLUMN id SET DEFAULT nextval('safety.safe_delivery_boxes_id_seq'::regclass);


--
-- Name: safe_stores id; Type: DEFAULT; Schema: safety; Owner: postgres
--

ALTER TABLE ONLY safety.safe_stores ALTER COLUMN id SET DEFAULT nextval('safety.safe_stores_id_seq'::regclass);


--
-- Name: smart_street_lights id; Type: DEFAULT; Schema: safety; Owner: postgres
--

ALTER TABLE ONLY safety.smart_street_lights ALTER COLUMN id SET DEFAULT nextval('safety.smart_street_lights_id_seq'::regclass);


--
-- Name: cctv cctv_pkey; Type: CONSTRAINT; Schema: safety; Owner: postgres
--

ALTER TABLE ONLY safety.cctv
    ADD CONSTRAINT cctv_pkey PRIMARY KEY (source_id);


--
-- Name: emergency_bells emergency_bells_pkey; Type: CONSTRAINT; Schema: safety; Owner: postgres
--

ALTER TABLE ONLY safety.emergency_bells
    ADD CONSTRAINT emergency_bells_pkey PRIMARY KEY (source_id);


--
-- Name: regions regions_pkey; Type: CONSTRAINT; Schema: safety; Owner: postgres
--

ALTER TABLE ONLY safety.regions
    ADD CONSTRAINT regions_pkey PRIMARY KEY (code);


--
-- Name: safe_delivery_boxes safe_delivery_boxes_pkey; Type: CONSTRAINT; Schema: safety; Owner: postgres
--

ALTER TABLE ONLY safety.safe_delivery_boxes
    ADD CONSTRAINT safe_delivery_boxes_pkey PRIMARY KEY (id);


--
-- Name: safe_return_routes safe_return_routes_pkey; Type: CONSTRAINT; Schema: safety; Owner: postgres
--

ALTER TABLE ONLY safety.safe_return_routes
    ADD CONSTRAINT safe_return_routes_pkey PRIMARY KEY (route_id);


--
-- Name: safe_stores safe_stores_pkey; Type: CONSTRAINT; Schema: safety; Owner: postgres
--

ALTER TABLE ONLY safety.safe_stores
    ADD CONSTRAINT safe_stores_pkey PRIMARY KEY (id);


--
-- Name: smart_street_lights smart_street_lights_pkey; Type: CONSTRAINT; Schema: safety; Owner: postgres
--

ALTER TABLE ONLY safety.smart_street_lights
    ADD CONSTRAINT smart_street_lights_pkey PRIMARY KEY (id);


--
-- Name: cctv_location_idx; Type: INDEX; Schema: safety; Owner: postgres
--

CREATE INDEX cctv_location_idx ON safety.cctv USING gist (location);


--
-- Name: emergency_bells_location_idx; Type: INDEX; Schema: safety; Owner: postgres
--

CREATE INDEX emergency_bells_location_idx ON safety.emergency_bells USING gist (location);


--
-- Name: safe_delivery_boxes_location_idx; Type: INDEX; Schema: safety; Owner: postgres
--

CREATE INDEX safe_delivery_boxes_location_idx ON safety.safe_delivery_boxes USING gist (location);


--
-- Name: safe_return_routes_location_idx; Type: INDEX; Schema: safety; Owner: postgres
--

CREATE INDEX safe_return_routes_location_idx ON safety.safe_return_routes USING gist (location);


--
-- Name: safe_stores_location_idx; Type: INDEX; Schema: safety; Owner: postgres
--

CREATE INDEX safe_stores_location_idx ON safety.safe_stores USING gist (location);


--
-- Name: smart_street_lights_location_idx; Type: INDEX; Schema: safety; Owner: postgres
--

CREATE INDEX smart_street_lights_location_idx ON safety.smart_street_lights USING gist (location);


--
-- PostgreSQL database dump complete
--

\unrestrict fErA7rtxjcA0exY4gbNstryMC5qveIsGO1g19X7OgHhM2530Yc7k6ItkmIXRdW4

