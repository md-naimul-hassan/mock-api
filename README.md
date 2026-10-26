# Mock APIs

A free, public REST API with realistic fake data for learning, prototyping, and testing, plus a documentation website and an interactive API playground.

- **Eight resources:** users, products, posts, comments, todos, carts, recipes, and quotes. All records are synthetic and deterministic.
- **Real query features:** pagination with totals, sorting, field selection, case-insensitive search, filters, and `?delay=`.
- **Simulated CRUD:** POST, PUT, PATCH, and DELETE are validated and return realistic responses, but never modify the shared data.
- **Demo authentication:** login, register, me, refresh, and an admin-only route, with real 401/403 behavior.
- **HTTP testing utilities:** echo (with secret redaction), delay, and any common status code.
- **One error format** with stable codes and request IDs, plus per-IP rate limiting with standard headers.
- **OpenAPI 3** at `/openapi.json` and Swagger UI at `/docs`. These are generated from the same source as the API and the website.
- **Website:** docs with a live "Try it" panel on every endpoint, a searchable endpoint directory, and a playground with code generation for cURL, fetch, Axios, Dart (Dio and http), and Python requests.
- **API Builder:** create your own mock APIs with custom paths, status codes, and JSON responses, then call them at `/api/v1/mock-apis/:projectId/...`.

> Mock APIs is for learning and testing. Do not use it as a production backend or for real personal data, and never use the demo authentication to protect a real application.

## Repository layout

```
.
├── apps/
│   ├── api/                 Express 5 + TypeScript + MongoDB (Mongoose) REST API
│   │   ├── src/
│   │   │   ├── app/         middlewares, modules/<name>/{routes,controller,service,validation,model,interface}, routes
│   │   │   ├── config/      validated environment configuration
│   │   │   ├── DB/          connection, models, deterministic fixtures, seed + CLI
│   │   │   ├── errors/      ApiError and error mappers
│   │   │   ├── helpers/     query builder, JWT, generic resource service/controller, rate-limit store
│   │   │   ├── shared/      logger, catchAsync, sendResponse
│   │   │   ├── app.ts       Express app factory
│   │   │   └── server.ts    HTTP server, DB connection with retry, graceful shutdown
│   │   ├── scripts/         example capture, local MongoDB
│   │   └── tests/           Vitest + Supertest integration tests
│   └── web/                 Next.js 16 (App Router) docs site and playground
├── packages/
│   └── api-spec/            Shared single source of truth: Zod schemas, endpoint registry, OpenAPI builder, captured examples
├── docs/                    Architecture, deployment, and future sandbox design notes
├── docker-compose.yml
└── .github/workflows/ci.yml
```

The API follows the module layout of [md-naimul-hassan/backend-template](https://github.com/md-naimul-hassan/backend-template) (`app/modules/<module>/<module>.{routes,controller,service,validation,model,interface}.ts`, `catchAsync`, `sendResponse`, `ApiError`, `globalErrorHandler`). Response bodies follow the Mock APIs contract (plain JSON resources and a fixed error shape) rather than the template's response wrapper.

## Requirements

- Node.js 22 or newer (developed on Node 26; Docker images use Node 24 LTS)
- pnpm 12 (`npm install -g pnpm@12`, or use Corepack)
- MongoDB 7 or 8. Use Docker (`docker compose up -d mongo`), or run `pnpm db:memory` if you don't have Docker.

## Local development

```bash
pnpm install
cp .env.example .env                   # API settings (placeholders only)
cp apps/web/.env.example apps/web/.env  # Website settings

# Start MongoDB (pick one)
docker compose up -d mongo
pnpm db:memory        # no Docker: downloads a MongoDB binary and keeps data in ./.mongo-data

pnpm db:migrate       # create collections and indexes
pnpm db:seed          # load the deterministic dataset (the API also auto-seeds when AUTO_SEED=true)

pnpm dev              # API on http://localhost:4000, website on http://localhost:3000
```

Try it:

```bash
curl http://localhost:4000/api/v1/users/1
curl 'http://localhost:4000/api/v1/products?category=smartphones&sortBy=price&order=desc&limit=3'
curl -X POST http://localhost:4000/api/v1/auth/login -H 'Content-Type: application/json' \
  -d '{"username":"emilyc","password":"emilycpass"}'
```

### Scripts

| Command | What it does |
| --- | --- |
| `pnpm dev` | Builds the shared spec, then runs the API (watch mode), the website, and the spec compiler in parallel |
| `pnpm dev:api` / `pnpm dev:web` | Run one app |
| `pnpm build` | Build every package (spec, API, website) |
| `pnpm start:api` / `pnpm start:web` | Run the production builds |
| `pnpm lint` | ESLint across the monorepo |
| `pnpm typecheck` | TypeScript in every package |
| `pnpm test` | All tests (spec registry, API integration, website unit and interaction) |
| `pnpm db:migrate` | Create collections and indexes |
| `pnpm db:seed` | Seed the dataset (skipped if it is already up to date) |
| `pnpm db:reset` | Drop the database (run `db:seed` afterwards) |
| `pnpm db:memory` | Start a local MongoDB without Docker |
| `pnpm spec:examples` | Re-capture documentation examples from the real API (run after changing responses) |

## How the pieces fit together

`packages/api-spec` defines the resource schemas, request bodies, and an **endpoint registry** that lists every endpoint with its parameters, examples, and status codes. The other pieces are built from it:

- The **API** validates requests with the same Zod schemas and serves `/openapi.json` built from the registry.
- `pnpm spec:examples` runs every documented request against the real app (using an in-memory MongoDB) and stores the responses in `examples.generated.json`.
- The **website** renders docs, snippets, and example responses from the registry and the captured examples. It replaces the captured base URL with `NEXT_PUBLIC_API_BASE_URL`.
- The **API tests** re-run every documented example and fail if a status code, body, or response schema drifts from the docs.

See [docs/architecture.md](docs/architecture.md) for details.

## Environment variables

API (`.env` at the repo root; see [.env.example](.env.example)):

| Variable | Default | Notes |
| --- | --- | --- |
| `NODE_ENV` | `development` | `production` enables strict secret checks |
| `HOST` / `PORT` | `0.0.0.0` / `4000` | |
| `PUBLIC_API_URL` | `http://localhost:4000` | Public origin used in image URLs, discovery, and the OpenAPI server. Never hardcoded. |
| `WEB_URL` | none | Website URL shown in API discovery |
| `MONGODB_URI` | `mongodb://127.0.0.1:27017/mockapis` | |
| `AUTO_SEED` | `true` | Seed on startup when empty or out of date |
| `CORS_ORIGINS` | `*` | Comma-separated list or `*`. Credentials are never allowed |
| `TRUST_PROXY` | `false` | Set to the number of proxies (e.g. `1`) behind a load balancer so rate limits see real client IPs |
| `BODY_LIMIT` | `100kb` | |
| `REQUEST_TIMEOUT_MS` | `15000` | |
| `DEFAULT_PAGE_LIMIT` / `MAX_PAGE_LIMIT` | `30` / `100` | |
| `RATE_LIMIT_WINDOW_MS` / `RATE_LIMIT_MAX` | `60000` / `100` | Per IP |
| `RATE_LIMIT_DELAY_MAX` | `20` | Extra limit for delayed requests |
| `RATE_LIMIT_STORE` | `memory` | `mongo` shares counters across instances |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | dev-only fallback | **Required in production:** 32+ random characters, different from each other |
| `JWT_ACCESS_EXPIRES_MINS` / `JWT_REFRESH_EXPIRES_MINS` | `30` / `10080` | |
| `DOCS_ENABLED` | `true` | Swagger UI at `/docs` |
| `LOG_LEVEL` | `info` | |

Website (`apps/web/.env`; these values are inlined at build time):

| Variable | Default |
| --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | `http://localhost:4000` |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` |

## Deployment

Summary (full guide in [docs/deployment.md](docs/deployment.md)):

1. Provision MongoDB (a managed cluster or your own) and note the connection string.
2. Deploy the API with `apps/api/Dockerfile` (build context: repo root). Set `NODE_ENV=production`, `MONGODB_URI`, `PUBLIC_API_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, and `TRUST_PROXY` for your proxy setup. With more than one instance, set `RATE_LIMIT_STORE=mongo`.
3. Deploy the website with `apps/web/Dockerfile`, passing `NEXT_PUBLIC_API_BASE_URL` and `NEXT_PUBLIC_SITE_URL` as build args.
4. Use `/health` for liveness and `/ready` for readiness checks.

To run everything locally in containers:

```bash
# .env must define JWT_ACCESS_SECRET and JWT_REFRESH_SECRET (e.g. `openssl rand -base64 48`)
docker compose --profile app up --build
```

Hosting costs, free tiers, and uptime depend on your provider and can change. Nothing in this project guarantees free hosting, unlimited requests, or availability.

## Testing

- `packages/api-spec`: registry consistency checks.
- `apps/api` (Vitest + Supertest against a real MongoDB):
  - every resource's list and detail contract
  - pagination limits and metadata, `select`, sorting, search including empty results, filters, relations, invalid IDs and parameters
  - simulated CRUD: 201/200/204, 404/409/422, and seed data left unchanged
  - malformed JSON (400), wrong content type (415), oversized bodies (413)
  - authentication success and every failure mode, including expired and tampered tokens and 403
  - testing utilities, including secret redaction
  - rate limiting, CORS, security headers, and 503 handling
  - every documented example compared with the captured docs
- `apps/web` (Vitest + Testing Library):
  - code generation for all six languages, including a syntax check of the generated JavaScript
  - URL, query, and token helpers, and the HTTP client (timeouts, network errors)
  - playground interactions with mocked success, error, and network-failure responses

The API tests start an in-memory MongoDB automatically (the binary is downloaded on first run), or use `MONGO_TEST_URI` if set, as CI does.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| `Cannot find module '@mockapis/api-spec'` or stale types | Run `pnpm build:spec`. Root `dev`, `test`, `typecheck`, and `db:*` scripts do this for you. |
| API logs `MongoDB connection failed` and `/ready` returns 503 | Start MongoDB (`docker compose up -d mongo` or `pnpm db:memory`) and check `MONGODB_URI`. The API keeps retrying and serves 503 for data routes until then. |
| `Invalid environment configuration` on startup | A variable in `.env` has the wrong format. The message lists which one. |
| `JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be set...` | Production mode needs two different random secrets of 32+ characters. |
| Browser shows "Network error ... CORS" in the playground | Check that the API is running at `NEXT_PUBLIC_API_BASE_URL` and that `CORS_ORIGINS` includes the site origin (or is `*`). |
| Frequent 429 responses | Lower your request rate or raise `RATE_LIMIT_MAX` on your own instance. Behind a proxy, set `TRUST_PROXY` so clients aren't all seen as one IP. |
| `pnpm db:memory` or the tests hang on first run | They are downloading the MongoDB binary (around 100 MB). Check network access, or set `MONGO_TEST_URI` to an existing MongoDB. |
| Docs show old example responses | Run `pnpm spec:examples` after changing API responses. |
| A stray `.pnpm-store/` folder appears in the repo | Created when pnpm can't use its global store (for example in sandboxes). It is git-ignored and safe to delete. |
