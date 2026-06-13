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
├── database
├── Directory.Packages.props
├── StayConnect.sln
└── .env.example
```

## Included

- ASP.NET Core Web API
- Supabase PostgreSQL through EF Core/Npgsql
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

## Supabase setup

Run this SQL in the Supabase SQL editor before testing backend login:

```txt
backend/database/001_backend_auth_columns.sql
```

Then set your backend connection string with environment variables. Use `backend/.env.example` as reference.

## Run locally

```bash
cd backend
dotnet restore StayConnect.sln
dotnet build StayConnect.sln
dotnet run --project StayConnect.Api/StayConnect.Api.csproj
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

The frontend now uses ASP.NET Core for auth. Set:

```txt
VITE_API_URL=http://localhost:5000/api
```

For production, set `VITE_API_URL` to your deployed ASP.NET backend URL.

## Still pending

- Full review APIs
- Wishlist APIs
- Message APIs
- Payment provider integration
- Admin analytics APIs
- Image upload/storage APIs
