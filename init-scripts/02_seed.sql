-- =====================================================================
--  Dane przykładowe (testy + prezentacja)
--  Login demo:  demo@travel.local  /  haslo123   (hash bcrypt)
--  Stałe UUID, żeby łatwo testować endpointy w Swaggerze/Postmanie.
-- =====================================================================

INSERT INTO users (id, email, password_hash, display_name) VALUES
    ('11111111-1111-1111-1111-111111111111',
     'demo@travel.local',
     crypt('haslo123', gen_salt('bf', 11)),
     'Demo User');

-- Zapytanie z kreatora AI, z którego "powstała" podróż
INSERT INTO trip_requests (id, user_id, budget, currency, start_date, end_date,
                           companion, pace, notes, interests) VALUES
    ('22222222-2222-2222-2222-222222222222',
     '11111111-1111-1111-1111-111111111111',
     4500, 'PLN', '2027-05-25', '2027-05-27',
     'We dwoje', 'balanced', 'Chcemy wynająć auto', ARRAY['monuments', 'food', 'nature']);

-- Podróż wygenerowana przez AI (Sycylia – jak w mockach frontendu)
INSERT INTO trip_plans (id, user_id, trip_request_id, title, location, image_url,
                        lat, lng, zoom, start_date, end_date, budget, currency,
                        destination, total_estimated_cost, summary) VALUES
    ('33333333-3333-3333-3333-333333333333',
     '11111111-1111-1111-1111-111111111111',
     '22222222-2222-2222-2222-222222222222',
     'Włoskie Wakacje', 'Sycylia, Włochy',
     'https://commons.wikimedia.org/wiki/Special:FilePath/Taormina_Teatro_Greco.jpg?width=800',
     37.5999, 14.0154, 8, '2027-05-25', '2027-05-27', 4500, 'PLN',
     'Sycylia', 1490, 'Trzy dni na wschodzie Sycylii: Katania, Taormina i Etna.');

-- Podróż utworzona ręcznie (bez requestu AI, bez harmonogramu)
INSERT INTO trip_plans (id, user_id, title, location, image_url,
                        lat, lng, zoom, start_date, end_date, budget, currency) VALUES
    ('44444444-4444-4444-4444-444444444444',
     '11111111-1111-1111-1111-111111111111',
     'Mecz Chelsea', 'Londyn, UK',
     'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80',
     51.5074, -0.1278, 11, '2027-04-10', '2027-04-12', 3000, 'PLN');

-- Dni
INSERT INTO trip_days (id, trip_plan_id, day_number, date, title, color) VALUES
    ('d0000000-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333', 1, '2027-05-25', 'Przylot i Katania', '#10b981'),
    ('d0000000-0000-0000-0000-000000000002', '33333333-3333-3333-3333-333333333333', 2, '2027-05-26', 'Taormina',          '#2563eb'),
    ('d0000000-0000-0000-0000-000000000003', '33333333-3333-3333-3333-333333333333', 3, '2027-05-27', 'Etna',              '#f59e0b');

-- Punkty harmonogramu
INSERT INTO trip_items (trip_day_id, type, title, estimated_cost, start_time, location_name, latitude, longitude, order_index) VALUES
    -- Dzień 1
    ('d0000000-0000-0000-0000-000000000001', 'transport', 'Przylot i odbiór Fiata Pandy',  800, '10:00', 'Lotnisko Catania-Fontanarossa', 37.469800, 15.065900, 0),
    ('d0000000-0000-0000-0000-000000000001', 'activity',  'Targ rybny La Pescheria',          0, '13:00', 'Katania',                       37.501600, 15.085300, 1),
    ('d0000000-0000-0000-0000-000000000001', 'activity',  'Kolacja – arancini i granita',    120, '19:30', 'Via Etnea, Katania',            37.505500, 15.087000, 2),
    -- Dzień 2
    ('d0000000-0000-0000-0000-000000000002', 'activity',  'Teatr Antyczny w Taorminie',       60, '09:30', 'Taormina',                      37.852300, 15.292200, 0),
    ('d0000000-0000-0000-0000-000000000002', 'activity',  'Isola Bella – plaża',              30, '13:00', 'Taormina',                      37.850200, 15.300600, 1),
    -- Dzień 3
    ('d0000000-0000-0000-0000-000000000003', 'transport', 'Dojazd na Etnę (Rifugio Sapienza)', 80, '08:30', 'Etna',                          37.700600, 14.999000, 0),
    ('d0000000-0000-0000-0000-000000000003', 'activity',  'Kolejka i kratery Silvestri',     400, '10:00', 'Etna',                          37.700000, 14.998000, 1);

-- Lista pakowania
INSERT INTO packing_list_items (trip_plan_id, item_name, is_packed, order_index) VALUES
    ('33333333-3333-3333-3333-333333333333', 'Paszport / Dowód osobisty', FALSE, 0),
    ('33333333-3333-3333-3333-333333333333', 'Ładowarka do telefonu',     TRUE,  1),
    ('33333333-3333-3333-3333-333333333333', 'Buty trekkingowe na Etnę',  FALSE, 2);
