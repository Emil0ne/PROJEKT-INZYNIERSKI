# Obraz backendu (TravelAssistant.API, .NET 8)
# Budowany z folderu backend/:  docker build -f backend/Dockerfile backend
# (w praktyce: docker compose up -d --build)

# ---------- etap 1: build ----------
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Najpierw same pliki projektów -> restore jest cache'owany, dopóki nie zmienią się paczki
COPY TravelAssistant.API/TravelAssistant.API.csproj TravelAssistant.API/
COPY TravelAssistant.Data/TravelAssistant.Data.csproj TravelAssistant.Data/
RUN dotnet restore TravelAssistant.API/TravelAssistant.API.csproj

# Reszta kodu (bin/ i obj/ odfiltrowuje .dockerignore)
COPY . .
RUN dotnet publish TravelAssistant.API/TravelAssistant.API.csproj \
    -c Release -o /app/publish --no-restore /p:UseAppHost=false

# ---------- etap 2: runtime ----------
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .

ENV ASPNETCORE_HTTP_PORTS=8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "TravelAssistant.API.dll"]
