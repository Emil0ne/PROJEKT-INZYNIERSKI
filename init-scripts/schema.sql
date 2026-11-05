-- Włączenie rozszerzenia UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela użytkowników
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela preferencji / zapytań o wyjazd
CREATE TABLE trip_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    origin VARCHAR(255),
    budget DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'PLN',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    transport_mode VARCHAR(50) NOT NULL,
    preferences JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela wygenerowanych planów podróży (wynik AI)
CREATE TABLE trip_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_request_id UUID REFERENCES trip_requests(id) ON DELETE CASCADE,
    destination VARCHAR(255) NOT NULL,
    total_estimated_cost DECIMAL(10, 2) NOT NULL,
    summary TEXT,
    raw_llm_response JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela dni wyjazdu (harmonogram)
CREATE TABLE trip_days (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_plan_id UUID REFERENCES trip_plans(id) ON DELETE CASCADE,
    day_number INT NOT NULL,
    date DATE NOT NULL,
    title VARCHAR(255),
    description TEXT
);

-- Tabela punktów / atrakcji (współrzędne do mapy i osi czasu)
CREATE TABLE trip_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_day_id UUID REFERENCES trip_days(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    estimated_cost DECIMAL(10, 2) DEFAULT 0.00,
    start_time TIME,
    end_time TIME,
    location_name VARCHAR(255),
    latitude DECIMAL(9, 6) NOT NULL,
    longitude DECIMAL(9, 6) NOT NULL,
    order_index INT NOT NULL
);

-- Tabela listy rzeczy do spakowania
CREATE TABLE packing_list_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_plan_id UUID REFERENCES trip_plans(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    is_packed BOOLEAN DEFAULT FALSE
);

-- Indeksy dla optymalizacji wydajności
CREATE INDEX idx_trip_requests_user ON trip_requests(user_id);
CREATE INDEX idx_trip_plans_request ON trip_plans(trip_request_id);
CREATE INDEX idx_trip_days_plan ON trip_days(trip_plan_id);
CREATE INDEX idx_trip_items_day ON trip_items(trip_day_id);
CREATE INDEX idx_packing_items_plan ON packing_list_items(trip_plan_id);