# StayConnect ASP.NET Core Backend

This folder contains the ASP.NET Core Web API backend for StayConnect.

## Structure

```txt
backend/
├── StayConnect.Api
├── StayConnect.Application
├── StayConnect.Domain
├── StayConnect.Infrastructure
├── Directory.Packages.props
├── StayConnect.sln
└── docker-compose.yml
```

## Included

- ASP.NET Core Web API
- Layered architecture
- PostgreSQL with EF Core
- Repository and service layer
- Swagger/OpenAPI
- Serilog request logging
- CORS for the Vite frontend
- Global exception middleware

## Run locally

```bash
cd backend
docker compose up -d
dotnet restore StayConnect.sln
dotnet build StayConnect.sln
dotnet run --project StayConnect.Api/StayConnect.Api.csproj
```

Swagger runs in development mode at:

```txt
/swagger
```

## API endpoints

```txt
GET  /api/health
GET  /api/stays
GET  /api/stays/{id}
POST /api/stays
```

## Example request

```json
{
  "title": "Single room near college",
  "description": "Clean furnished room with Wi-Fi and food option.",
  "address": "Main Road, Near Bus Stand",
  "city": "Patna",
  "monthlyRent": 6500,
  "type": "Room"
}
```

## Next steps

1. Add EF Core migrations.
2. Add JWT authentication.
3. Add owner and admin roles.
4. Add booking APIs.
5. Add image upload.
6. Add deployment pipeline.
