# Ads Board – Full Stack Project

A simple neighborhood posts board with an Angular client and ASP.NET Core backend.

## Stack
- Client: Angular 20 (standalone components, Material, signals)
- Server: ASP.NET Core 9 Web API, JWT auth

## Project Structure
- `client/` – Angular app
- `server/WebApplication1/` – ASP.NET Core API

## Prerequisites
- Node.js 18+ and npm
- .NET SDK 9.0+

## Setup & Run
### Backend
```pwsh
Push-Location "C:\Users\leafi\ads-board\server\WebApplication1"
dotnet restore
dotnet run
Pop-Location
```
- API listens at `https://localhost:7183`

### Frontend
```pwsh
Push-Location "C:\Users\leafi\ads-board\client"
npm install
npm start
Pop-Location
```
- App served at `http://localhost:4200`

## Configuration
- Client environment: `client/src/environments/environment.ts`
  - `baseApiUrl`: backend base URL
  - `googleMapsApiKey`: used to load Maps JS API via `APP_INITIALIZER`
- Google Maps is loaded at startup (`app/core/google-maps-loader.ts`).

## Key Features
- Posts list with search, pagination, and optional radius filter around user location.
- Create/Edit/Delete posts (requires login and appropriate role).
- Places Autocomplete for area label; coordinates sent with create/update.
- Retry with backoff for transient API errors.
- Auth: JWT access token with 401 refresh flow (client-side).

## Common Commands
- Lint: `ng lint` (run inside `client/`)
- Build: `ng build`
- Run tests (if added): `ng test`

## Notes
- Ensure browser allows geolocation for radius and “associate current place”.
- If API returns 401, token may be expired; client attempts refresh automatically.

## Troubleshooting
- If Maps Autocomplete doesn’t load, verify `googleMapsApiKey` and network access.
- CORS: backend should allow requests from Angular dev server origin.

## License
Internal project; no public license specified.
