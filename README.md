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

## CI (GitHub Actions)

Plik `.github/workflows/ci.yml` uruchamia się przy każdym Pull Requeście i pushu do `main`:
- **Baza danych** – czysty PostgreSQL 16 + wszystkie skrypty z `init-scripts` (wyłapuje błędy w schemacie/seedzie)
- **Backend** – `dotnet restore` + `dotnet build` (+ testy, gdy pojawią się projekty `*Tests.csproj`)
- **Frontend** – `npm ci`, `npm run lint`, `npm run build`

Joby backend/frontend są pomijane, dopóki odpowiedni folder nie trafi do `main`.
