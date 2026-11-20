-- =====================================================================
--  Test bazy danych – Asystent planowania podróży
--  Uruchomienie (baza musi być postawiona i po `dotnet ef database update`):
--    docker exec -i travel_assistant_db psql -U dev_user -d travel_assistant < tests/db/test_bazy.sql
--  Wszystko dzieje się w transakcji zakończonej ROLLBACK – dane w bazie się NIE zmieniają.
-- =====================================================================
\set QUIET on
\set ON_ERROR_STOP on
\pset footer off
SET client_min_messages = warning;
\o /dev/null

BEGIN;

CREATE TEMP TABLE wyniki (
    nr     SERIAL,
    test   TEXT,
    wynik  TEXT
) ON COMMIT DROP;

-- Pomocnik: zapisuje wynik testu
CREATE FUNCTION pg_temp.ok(t TEXT, warunek BOOLEAN) RETURNS VOID AS $$
    INSERT INTO wyniki (test, wynik) VALUES (t, CASE WHEN warunek THEN '✅ OK' ELSE '❌ BŁĄD' END);
$$ LANGUAGE sql;

-- ---------------------------------------------------------------------
-- 1. Struktura
-- ---------------------------------------------------------------------
SELECT pg_temp.ok('Istnieje 6 tabel aplikacji',
    (SELECT count(*) FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN ('users','trip_requests','trip_plans','trip_days','trip_items','packing_list_items')) = 6);

SELECT pg_temp.ok('Migracja EF Core zapisana w historii',
    EXISTS (SELECT 1 FROM "__EFMigrationsHistory" WHERE migration_id LIKE '%InitialCreate'));

-- ---------------------------------------------------------------------
-- 2. Dane demo (seed)
-- ---------------------------------------------------------------------
SELECT pg_temp.ok('Konto demo istnieje (demo@travel.local)',
    EXISTS (SELECT 1 FROM users WHERE email = 'demo@travel.local'));

SELECT pg_temp.ok('Hasło demo zapisane jako hash bcrypt, nie jawnym tekstem',
    (SELECT password_hash LIKE '$2a$%' AND password_hash <> 'haslo123' FROM users WHERE email = 'demo@travel.local'));

SELECT pg_temp.ok('Podróż "Włoskie Wakacje" ma 3 dni i 7 punktów',
    (SELECT count(DISTINCT d.id) = 3 AND count(i.id) = 7
       FROM trip_plans p JOIN trip_days d ON d.trip_plan_id = p.id JOIN trip_items i ON i.trip_day_id = d.id
      WHERE p.title = 'Włoskie Wakacje'));

SELECT pg_temp.ok('Koszt planu Sycylii (suma punktów) mieści się w budżecie',
    (SELECT sum(i.estimated_cost) <= p.budget
       FROM trip_plans p JOIN trip_days d ON d.trip_plan_id = p.id JOIN trip_items i ON i.trip_day_id = d.id
      WHERE p.title = 'Włoskie Wakacje' GROUP BY p.budget));

SELECT pg_temp.ok('Podróż ręczna (Londyn) nie ma zapytania AI – trip_request_id = NULL',
    (SELECT trip_request_id IS NULL FROM trip_plans WHERE title = 'Mecz Chelsea'));

-- ---------------------------------------------------------------------
-- 3. Ograniczenia – baza sama odrzuca złe dane
-- ---------------------------------------------------------------------
DO $$ BEGIN
    INSERT INTO trip_items (trip_day_id, type, title, estimated_cost, latitude, longitude, order_index)
    VALUES ('d0000000-0000-0000-0000-000000000001', 'rakieta', 'Zły typ', 0, 37.5, 15.0, 9);
    PERFORM pg_temp.ok('Odrzuca punkt z typem innym niż activity/transport', false);
EXCEPTION WHEN check_violation THEN
    PERFORM pg_temp.ok('Odrzuca punkt z typem innym niż activity/transport', true);
END $$;

DO $$ BEGIN
    INSERT INTO trip_items (trip_day_id, type, title, estimated_cost, latitude, longitude, order_index)
    VALUES ('d0000000-0000-0000-0000-000000000001', 'activity', 'Poza mapą', 0, 123.0, 15.0, 9);
    PERFORM pg_temp.ok('Odrzuca współrzędne spoza zakresu (szerokość 123°)', false);
EXCEPTION WHEN check_violation OR numeric_value_out_of_range THEN
    PERFORM pg_temp.ok('Odrzuca współrzędne spoza zakresu (szerokość 123°)', true);
END $$;

DO $$ BEGIN
    UPDATE trip_days SET color = 'zielony' WHERE id = 'd0000000-0000-0000-0000-000000000001';
    PERFORM pg_temp.ok('Odrzuca kolor dnia, który nie jest HEX (#10b981)', false);
EXCEPTION WHEN check_violation THEN
    PERFORM pg_temp.ok('Odrzuca kolor dnia, który nie jest HEX (#10b981)', true);
END $$;

DO $$ BEGIN
    INSERT INTO trip_days (trip_plan_id, day_number, date)
    VALUES ('33333333-3333-3333-3333-333333333333', 1, '2027-05-25');
    PERFORM pg_temp.ok('Odrzuca dwa "Dzień 1" w tej samej podróży', false);
EXCEPTION WHEN unique_violation THEN
    PERFORM pg_temp.ok('Odrzuca dwa "Dzień 1" w tej samej podróży', true);
END $$;

DO $$ BEGIN
    INSERT INTO trip_plans (user_id, title, start_date, end_date, total_estimated_cost)
    VALUES ('11111111-1111-1111-1111-111111111111', 'Wstecz', '2027-06-10', '2027-06-01', 0);
    PERFORM pg_temp.ok('Odrzuca podróż kończącą się przed startem', false);
EXCEPTION WHEN check_violation THEN
    PERFORM pg_temp.ok('Odrzuca podróż kończącą się przed startem', true);
END $$;

DO $$ BEGIN
    INSERT INTO users (email, password_hash) VALUES ('demo@travel.local', 'x');
    PERFORM pg_temp.ok('Odrzuca drugie konto z tym samym e-mailem', false);
EXCEPTION WHEN unique_violation THEN
    PERFORM pg_temp.ok('Odrzuca drugie konto z tym samym e-mailem', true);
END $$;

DO $$ BEGIN
    INSERT INTO trip_requests (start_date, end_date, interests)
    VALUES ('2027-01-01', '2027-01-03', ARRAY['zakupy']);
    PERFORM pg_temp.ok('Odrzuca nieznane zainteresowanie w kreatorze AI', false);
EXCEPTION WHEN check_violation THEN
    PERFORM pg_temp.ok('Odrzuca nieznane zainteresowanie w kreatorze AI', true);
END $$;

-- ---------------------------------------------------------------------
-- 4. Relacje – usuwanie kaskadowe i SET NULL
-- ---------------------------------------------------------------------
DELETE FROM trip_requests WHERE id = '22222222-2222-2222-2222-222222222222';
SELECT pg_temp.ok('Usunięcie zapytania AI zostawia podróż (SET NULL)',
    (SELECT trip_request_id IS NULL FROM trip_plans WHERE id = '33333333-3333-3333-3333-333333333333'));

DELETE FROM trip_plans WHERE id = '33333333-3333-3333-3333-333333333333';
SELECT pg_temp.ok('Usunięcie podróży kasuje jej dni, punkty i listę pakowania (CASCADE)',
    NOT EXISTS (SELECT 1 FROM trip_days WHERE trip_plan_id = '33333333-3333-3333-3333-333333333333')
    AND NOT EXISTS (SELECT 1 FROM trip_items WHERE trip_day_id IN
        ('d0000000-0000-0000-0000-000000000001','d0000000-0000-0000-0000-000000000002','d0000000-0000-0000-0000-000000000003'))
    AND NOT EXISTS (SELECT 1 FROM packing_list_items WHERE trip_plan_id = '33333333-3333-3333-3333-333333333333'));

DELETE FROM users WHERE email = 'demo@travel.local';
SELECT pg_temp.ok('Usunięcie użytkownika kasuje wszystkie jego podróże (CASCADE)',
    NOT EXISTS (SELECT 1 FROM trip_plans WHERE user_id = '11111111-1111-1111-1111-111111111111'));

-- ---------------------------------------------------------------------
-- Wynik
-- ---------------------------------------------------------------------
\o
\echo
\echo '==================== TEST BAZY DANYCH ===================='
SELECT nr AS "#", test AS "Co sprawdzamy", wynik AS "Wynik" FROM wyniki ORDER BY nr;
SELECT count(*) FILTER (WHERE wynik LIKE '✅%') || ' / ' || count(*) || ' testów zaliczonych' AS "Podsumowanie" FROM wyniki;
\echo 'Wszystkie zmiany cofnięte (ROLLBACK) – dane w bazie bez zmian.'

ROLLBACK;
