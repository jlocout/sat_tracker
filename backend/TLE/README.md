SatTracker backend microservice

This is a minimal ASP.NET Core microservice that exposes one endpoint:

- `GET /api/tles` — returns an array of TLE objects { name, tle1, tle2 }.

Behavior:
- If environment variables `SPACETRACK_USERNAME` and `SPACETRACK_PASSWORD` are present, the service will attempt to authenticate against Space-Track and fetch TLE data. If authentication is not provided or fails, it falls back to fetching public TLEs from CelesTrak (e.g., `stations.txt`).

Run:

```bash
cd TLE
dotnet run --project SatTracker.Api.csproj
```

The service listens on the default Kestrel ports; when developing behind the frontend dev server, you may want to run it on a fixed port and allow the frontend to call it (CORS may need enabling).
