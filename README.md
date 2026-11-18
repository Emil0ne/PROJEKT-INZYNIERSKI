# PROJEKT-INZYNIERSKI

## Baza danych (PostgreSQL 16 + Docker)

```bash
cp .env.example .env          # uzupełnij hasło
docker compose up -d          # stawia Postgresa ze schematem i danymi demo
docker compose ps             # STATUS powinien być "healthy"
```

- Schemat: `init-scripts/01_schema.sql`, dane demo: `init-scripts/02_seed.sql`
- Skrypty z `init-scripts` wykonują się **tylko na pustym wolumenie** – po zmianie schematu: `docker compose down -v && docker compose up -d`
- Połączenie: `localhost:5432`, baza/użytkownik/hasło z `.env`
- Konto demo: `demo@travel.local` / `haslo123` (hash bcrypt)
