# PROJEKT-INZYNIERSKI

## Baza danych (PostgreSQL 16 + Docker + EF Core)

Schemat bazy i dane demo są zdefiniowane w kodzie (EF Core, code-first) w projekcie
`backend/TravelAssistant.Data` – migracje to jedno źródło prawdy o strukturze bazy.

```bash
cp .env.example .env                                              # uzupełnij hasło
docker compose up -d                                              # pusty PostgreSQL 16
dotnet tool restore                                               # narzędzie dotnet-ef (raz)
dotnet ef database update --project backend/TravelAssistant.Data  # tabele + dane demo
```

- Nowa zmiana w encjach → `dotnet ef migrations add NazwaZmiany --project backend/TravelAssistant.Data`
- Reset bazy od zera: `docker compose down -v && docker compose up -d`, potem znowu `database update`
- Hasło inne niż w `.env.example`? Ustaw zmienną `ConnectionStrings__Default` przed komendami `dotnet ef`
- Konto demo: `demo@travel.local` / `haslo123` (hash bcrypt)
- Podpięcie w API (`Program.cs`): `builder.Services.AddTravelAssistantData(builder.Configuration.GetConnectionString("Default")!);`

## CI (GitHub Actions)

Plik `.github/workflows/ci.yml` uruchamia się przy każdym Pull Requeście i pushu do `main`:
- **Baza danych** – czysty PostgreSQL 16 + migracje EF Core; sprawdza też, czy nikt nie zmienił encji bez dodania migracji
- **Backend** – `dotnet restore` + `dotnet build` (+ testy, gdy pojawią się projekty `*Tests.csproj`)
- **Frontend** – `npm ci`, `npm run lint`, `npm run build`

Joby backend/frontend są pomijane, dopóki odpowiedni folder nie trafi do `main`.
