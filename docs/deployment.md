# Deployment

Both apps ship as Docker images built from the repository root. Any platform that runs containers works, for example a VM with Docker Compose, a container PaaS, or Kubernetes. Pricing, free tiers, and limits are set by each provider and change over time, so check them before relying on any of them.

## 1. MongoDB

Use a managed MongoDB (7 or 8) or run your own. Create a database user with read/write access to a single database (e.g. `mockapis`) and keep the connection string secret.

The API creates its collections and indexes and seeds the dataset on startup (`AUTO_SEED=true`). To do this explicitly from a machine that can reach the database, run:

```bash
MONGODB_URI='mongodb+srv://...' pnpm db:migrate
MONGODB_URI='mongodb+srv://...' PUBLIC_API_URL='https://api.example.com' pnpm db:seed
```

`PUBLIC_API_URL` must match the deployed API, because image URLs in the data are absolute.

## 2. API

```bash
docker build -f apps/api/Dockerfile -t mockapis-api .
docker run -p 4000:4000 \
  -e NODE_ENV=production \
  -e MONGODB_URI='mongodb+srv://...' \
  -e PUBLIC_API_URL='https://api.example.com' \
  -e WEB_URL='https://example.com' \
  -e JWT_ACCESS_SECRET="$(openssl rand -base64 48)" \
  -e JWT_REFRESH_SECRET="$(openssl rand -base64 48)" \
  -e TRUST_PROXY=1 \
  mockapis-api
```

Checklist:

- **Secrets:** in production the API refuses to start unless both JWT secrets are set, at least 32 characters long, and different from each other. Store them in your platform's secret manager and rotate them by redeploying (existing demo tokens become invalid, which is fine).
- **Proxies:** set `TRUST_PROXY` to the number of proxies in front of the API (usually `1`). Otherwise every client appears to share the proxy's IP and gets rate limited together. Never set it higher than the real number of proxies, because clients could then spoof `X-Forwarded-For`.
- **Multiple instances:** set `RATE_LIMIT_STORE=mongo` so all instances share rate-limit counters.
- **CORS:** `*` without credentials is the intended setting for a public practice API. Restrict `CORS_ORIGINS` if you run a private instance.
- **Health checks:** use `/health` for liveness (always 200 while the process runs) and `/ready` for readiness (200 only when MongoDB is connected and seeded).
- **TLS:** terminate HTTPS at your load balancer or proxy. The API sends HSTS headers.

## 3. Website

```bash
docker build -f apps/web/Dockerfile \
  --build-arg NEXT_PUBLIC_API_BASE_URL=https://api.example.com \
  --build-arg NEXT_PUBLIC_SITE_URL=https://example.com \
  -t mockapis-web .
docker run -p 3000:3000 mockapis-web
```

`NEXT_PUBLIC_*` values are compiled into the bundle, so rebuild the image when they change.

## 4. Everything on one machine

```bash
cp .env.example .env   # then set JWT_ACCESS_SECRET, JWT_REFRESH_SECRET, PUBLIC_API_URL, NEXT_PUBLIC_API_BASE_URL, ...
docker compose --profile app up -d --build
```

Put a reverse proxy (Caddy, nginx, Traefik) in front for TLS, and set `TRUST_PROXY=1`.

## Operations

- Logs are JSON (pino) on stdout. Request logs contain the method, path, status, duration, and request ID. Tokens, cookies, and passwords are redacted.
- `pnpm db:reset` followed by `pnpm db:seed` restores the dataset. The data is deterministic, so this is always safe.
- If MongoDB goes away, the API keeps serving `/health`, `/test/*`, and the OpenAPI document, returns `503 SERVICE_UNAVAILABLE` for data routes, and reconnects with exponential backoff.
