# StayConnect ASP.NET Core Backend

This folder contains the ASP.NET Core Web API backend for StayConnect.

## Important architecture decision

Supabase is used only as the PostgreSQL database. Login, register, JWT tokens, roles, profile APIs, property APIs, and booking APIs are handled by ASP.NET Core.

```txt
React frontend -> ASP.NET Core Web API -> Supabase PostgreSQL
```

Do not use Supabase Auth for this setup.

## Structure

```txt
backend/
├── StayConnect.Api
├── StayConnect.Application
├── StayConnect.Domain
├── StayConnect.Infrastructure
│   └── Migrations
├── database
├── Directory.Packages.props
├── StayConnect.sln
└── .env.example
```

## Included

- ASP.NET Core Web API
- Supabase PostgreSQL through EF Core/Npgsql
- EF Core migrations for `users`, `properties`, and `bookings`
- Backend-owned register/login
- PBKDF2 password hashing
- JWT authentication
- User profile and host status APIs
- Property/listing APIs
- Booking and availability APIs
- Swagger/OpenAPI
- Serilog request logging
- CORS for the Vite frontend
- Global exception middleware

## Supabase setup with EF Core migrations

Set your backend connection string first. Use `backend/.env.example` as reference.

For Supabase pooler, the connection string format is:

```txt
Host=aws-1-ap-south-1.pooler.supabase.com;Port=6543;Database=postgres;Username=postgres.YOUR_PROJECT_REF;Password=YOUR_SUPABASE_DB_PASSWORD;Ssl Mode=Require;Trust Server Certificate=true
```

Then apply the EF Core migration:

```bash
cd backend

dotnet tool install --global dotnet-ef --version 8.0.11 || dotnet tool update --global dotnet-ef --version 8.0.11

ASPNETCORE_ENVIRONMENT=Development dotnet ef database update \
  --project StayConnect.Infrastructure/StayConnect.Infrastructure.csproj \
  --startup-project StayConnect.Api/StayConnect.Api.csproj
```

The initial migration creates the EF-owned tables required by the current backend:

```txt
users
properties
bookings
```

The old raw SQL files in `backend/database` are fallback/manual setup scripts. Prefer EF migrations for normal development.

## Add a new EF migration later

After changing entities or `ApplicationDbContext`, run:

```bash
cd backend

ASPNETCORE_ENVIRONMENT=Development dotnet ef migrations add MigrationName \
  --project StayConnect.Infrastructure/StayConnect.Infrastructure.csproj \
  --startup-project StayConnect.Api/StayConnect.Api.csproj \
  --output-dir Migrations
```

Then apply it:

```bash
ASPNETCORE_ENVIRONMENT=Development dotnet ef database update \
  --project StayConnect.Infrastructure/StayConnect.Infrastructure.csproj \
  --startup-project StayConnect.Api/StayConnect.Api.csproj
```

## Run locally

```bash
cd backend
dotnet restore StayConnect.sln
dotnet build StayConnect.sln
ASPNETCORE_ENVIRONMENT=Development dotnet run --project StayConnect.Api/StayConnect.Api.csproj
```

Swagger runs in development mode at:

```txt
/swagger
```

## Main API endpoints

```txt
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
GET  /api/users/me
PUT  /api/users/me
PATCH /api/users/me/host-status
GET  /api/users/hosts
GET  /api/properties
GET  /api/properties/featured
GET  /api/properties/{id}
POST /api/properties
PUT  /api/properties/{id}
DELETE /api/properties/{id}
POST /api/bookings
GET  /api/bookings/{id}
GET  /api/bookings/guest/{guestId}
GET  /api/bookings/host/{hostId}
GET  /api/bookings/availability
PATCH /api/bookings/{id}/status
PATCH /api/bookings/{id}/payment
```

## Frontend setup

The frontend now uses ASP.NET Core for auth. In local/Codespaces development, use the Vite proxy:

```txt
VITE_API_URL=/api
```

For production, set `VITE_API_URL` to your deployed ASP.NET backend URL.

## Still pending

- Full review APIs
- Wishlist APIs
- Message APIs
- Payment provider integration
- Admin analytics APIs
- Image upload/storage APIs
