# Baza danych – Asystent planowania podróży

PostgreSQL 16 uruchamiany w Dockerze. Struktura bazy jest zdefiniowana w kodzie C# (EF Core, podejście *code-first*)
w projekcie `backend/TravelAssistant.Data` – migracje są jedynym źródłem prawdy o schemacie.

## Diagram ERD

```mermaid
erDiagram
    users ||--o{ trip_requests : "składa"
    users ||--o{ trip_plans : "posiada"
    trip_requests |o--o{ trip_plans : "generuje (AI)"
    trip_plans ||--o{ trip_days : "dzieli się na"
    trip_days ||--o{ trip_items : "zawiera"
    trip_plans ||--o{ packing_list_items : "ma listę"

    users {
        uuid id PK
        varchar email UK
        text password_hash "bcrypt"
        varchar display_name
        timestamptz created_at
        timestamptz updated_at
    }

    trip_requests {
        uuid id PK
        uuid user_id FK
        numeric budget "opcjonalny"
        char currency "ISO 4217"
        date start_date
        date end_date
        varchar pace "relaxed | balanced | intensive"
        text_array interests "monuments, food, nature, museums, nightlife"
        varchar companion
        text notes
        jsonb preferences
    }

    trip_plans {
        uuid id PK
        uuid user_id FK
        uuid trip_request_id FK "NULL = podróż ręczna"
        varchar title
        varchar location
        float lat
        float lng
        int zoom
        date start_date
        date end_date
        numeric budget
        char currency
        numeric total_estimated_cost
        jsonb raw_llm_response "surowa odpowiedź AI"
    }

    trip_days {
        uuid id PK
        uuid trip_plan_id FK
        int day_number "UNIQUE w podróży"
        date date
        varchar title "customTitle we froncie"
        varchar color "HEX, np. #10b981"
    }

    trip_items {
        uuid id PK
        uuid trip_day_id FK
        varchar type "activity | transport"
        varchar title
        numeric estimated_cost
        time start_time
        numeric latitude
        numeric longitude
        int order_index
    }

    packing_list_items {
        uuid id PK
        uuid trip_plan_id FK
        varchar category
        varchar item_name
        boolean is_packed
        int order_index
    }
```

## Najważniejsze decyzje projektowe

| Decyzja | Uzasadnienie |
|---|---|
| **Tabele relacyjne zamiast jednego JSON-a** na cały plan | Frontend edytuje pojedyncze punkty i przeciąga je między dniami – łatwiej i bezpieczniej zmieniać pojedyncze wiersze. |
| **JSONB tylko dla `raw_llm_response`** | Surowa odpowiedź modelu AI zostaje zapisana w całości (do analizy, buforowania i debugowania). |
| **UUID jako klucze główne** | Identyfikatory można bezpiecznie generować po stronie klienta i nie zdradzają liczby rekordów. |
| **Status podróży nie jest kolumną** | `upcoming / ongoing / past` liczony jest z dat – nie da się go rozsynchronizować. |
| **`ON DELETE CASCADE`** (dni, punkty, lista pakowania) | Usunięcie podróży lub użytkownika sprząta wszystkie zależne dane. |
| **`ON DELETE SET NULL`** dla `trip_request_id` | Usunięcie zapytania z kreatora AI nie kasuje podróży użytkownika. |
| **`order_index` bez UNIQUE** | Przy przeciąganiu punktów kolejność jest chwilowo przeliczana – UNIQUE blokowałby zapis. |
| **Ograniczenia CHECK w bazie** | Baza sama odrzuca błędne dane (zły typ punktu, kolor, współrzędne, daty), niezależnie od aplikacji. |

## Uruchomienie i test

```bash
cp .env.example .env
docker compose up -d
dotnet tool restore
dotnet ef database update --project backend/TravelAssistant.Data

# test bazy – 17 sprawdzeń, wynik w tabelce, dane po teście bez zmian
docker exec -i travel_assistant_db psql -U dev_user -d travel_assistant < tests/db/test_bazy.sql
```
