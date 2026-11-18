-- =====================================================================
--  Asystent planowania podróży – schemat bazy PostgreSQL 16
--  Uruchamiany automatycznie przez obraz postgres (docker-entrypoint-initdb.d)
--  TYLKO na pustym wolumenie. Po zmianach: docker compose down -v
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- crypt()/gen_salt() do hashy w seedzie

-- Wspólny trigger aktualizujący kolumnę updated_at przy każdym UPDATE
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------
-- Użytkownicy
-- ---------------------------------------------------------------------
CREATE TABLE users (
    id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email          VARCHAR(255) NOT NULL UNIQUE,
    password_hash  TEXT         NOT NULL,
    display_name   VARCHAR(100),
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------
-- Zapytania do kreatora AI (to, co użytkownik wpisał w formularzu)
-- ---------------------------------------------------------------------
CREATE TABLE trip_requests (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
    origin          VARCHAR(255),
    budget          DECIMAL(12, 2),                      -- budżet opcjonalny w kreatorze
    currency        CHAR(3)      NOT NULL DEFAULT 'PLN',
    start_date      DATE         NOT NULL,
    end_date        DATE         NOT NULL,
    transport_mode  VARCHAR(50),                         -- kreator o to nie pyta
    companion       VARCHAR(100),
    pace            VARCHAR(20),
    notes           TEXT,
    interests       TEXT[]       NOT NULL DEFAULT '{}',
    preferences     JSONB,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_trip_requests_dates     CHECK (end_date >= start_date),
    CONSTRAINT chk_trip_requests_pace      CHECK (pace IS NULL OR pace IN ('relaxed', 'balanced', 'intensive')),
    CONSTRAINT chk_trip_requests_interests CHECK (interests <@ ARRAY['monuments', 'food', 'nature', 'museums', 'nightlife']::TEXT[])
);

-- ---------------------------------------------------------------------
-- Podróże (= "Trip" z frontendu). Może powstać z AI albo ręcznie.
-- Status upcoming/ongoing/past NIE jest kolumną – liczony z dat.
-- ---------------------------------------------------------------------
CREATE TABLE trip_plans (
    id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id               UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    trip_request_id       UUID REFERENCES trip_requests(id) ON DELETE SET NULL,  -- NULL = podróż ręczna
    title                 VARCHAR(255) NOT NULL,
    location              VARCHAR(255),                  -- np. "Katania, Włochy"
    image_url             TEXT,
    lat                   DOUBLE PRECISION,
    lng                   DOUBLE PRECISION,
    zoom                  INT,
    start_date            DATE,
    end_date              DATE,
    budget                DECIMAL(12, 2),
    currency              CHAR(3)      NOT NULL DEFAULT 'PLN',
    -- pola z generowania AI
    destination           VARCHAR(255),
    total_estimated_cost  DECIMAL(12, 2) NOT NULL DEFAULT 0,
    summary               TEXT,
    raw_llm_response      JSONB,                         -- surowa odpowiedź modelu
    created_at            TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at            TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_trip_plans_dates CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date),
    CONSTRAINT chk_trip_plans_lat   CHECK (lat IS NULL OR lat BETWEEN -90 AND 90),
    CONSTRAINT chk_trip_plans_lng   CHECK (lng IS NULL OR lng BETWEEN -180 AND 180)
);

-- ---------------------------------------------------------------------
-- Dni podróży (harmonogram). title = customTitle we froncie.
-- ---------------------------------------------------------------------
CREATE TABLE trip_days (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_plan_id  UUID NOT NULL REFERENCES trip_plans(id) ON DELETE CASCADE,
    day_number    INT  NOT NULL,
    date          DATE NOT NULL,
    title         VARCHAR(255),
    description   TEXT,
    color         VARCHAR(7),                            -- HEX, np. #10b981
    CONSTRAINT uq_trip_days_plan_day UNIQUE (trip_plan_id, day_number),
    CONSTRAINT chk_trip_days_number  CHECK (day_number >= 1),
    CONSTRAINT chk_trip_days_color   CHECK (color IS NULL OR color ~ '^#[0-9A-Fa-f]{6}$')
);

-- ---------------------------------------------------------------------
-- Punkty harmonogramu (atrakcje / przejazdy) – mapa i oś czasu.
-- order_index celowo BEZ UNIQUE: przy drag&drop między dniami jest przeliczany.
-- ---------------------------------------------------------------------
CREATE TABLE trip_items (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_day_id     UUID NOT NULL REFERENCES trip_days(id) ON DELETE CASCADE,
    type            VARCHAR(20)  NOT NULL DEFAULT 'activity',
    title           VARCHAR(255) NOT NULL,
    description     TEXT,
    estimated_cost  DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    start_time      TIME,                                -- "time" HH:mm we froncie
    end_time        TIME,
    location_name   VARCHAR(255),
    latitude        DECIMAL(9, 6) NOT NULL,
    longitude       DECIMAL(9, 6) NOT NULL,
    order_index     INT NOT NULL,
    CONSTRAINT chk_trip_items_type CHECK (type IN ('activity', 'transport')),
    CONSTRAINT chk_trip_items_lat  CHECK (latitude  BETWEEN -90  AND 90),
    CONSTRAINT chk_trip_items_lng  CHECK (longitude BETWEEN -180 AND 180),
    CONSTRAINT chk_trip_items_cost CHECK (estimated_cost >= 0)
);

-- ---------------------------------------------------------------------
-- Lista rzeczy do spakowania (front: text + packed)
-- ---------------------------------------------------------------------
CREATE TABLE packing_list_items (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_plan_id  UUID NOT NULL REFERENCES trip_plans(id) ON DELETE CASCADE,
    category      VARCHAR(100) NOT NULL DEFAULT 'Inne',
    item_name     VARCHAR(255) NOT NULL,
    is_packed     BOOLEAN      NOT NULL DEFAULT FALSE,
    order_index   INT          NOT NULL DEFAULT 0
);

-- ---------------------------------------------------------------------
-- Triggery updated_at
-- ---------------------------------------------------------------------
CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_trip_plans_updated_at
    BEFORE UPDATE ON trip_plans
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------
-- Indeksy
-- ---------------------------------------------------------------------
CREATE INDEX idx_trip_requests_user  ON trip_requests(user_id);
CREATE INDEX idx_trip_plans_user     ON trip_plans(user_id);
CREATE INDEX idx_trip_plans_request  ON trip_plans(trip_request_id);
CREATE INDEX idx_trip_items_day      ON trip_items(trip_day_id, order_index);
CREATE INDEX idx_packing_items_plan  ON packing_list_items(trip_plan_id, order_index);
-- idx_trip_days_plan zbędny – pokrywa go UNIQUE (trip_plan_id, day_number)
