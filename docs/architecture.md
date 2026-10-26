# Architecture

## Overview

```
packages/api-spec  ──►  apps/api  (Express 5, Mongoose, Zod)   ──►  MongoDB
        │                    ▲
        │                    │ live requests (CORS, no credentials)
        └──────────────►  apps/web (Next.js App Router, static docs + client playground)
```

`@mockapis/api-spec` is the single source of truth:

| Module | Contents |
| --- | --- |
| `constants.ts` | API prefix, pagination limits, max delay, rate-limit defaults, demo credentials, error codes, exposed headers |
| `schemas.ts` | Zod schemas for every resource, the error body, auth responses, and request bodies (create/replace/patch, login/register/refresh) |
| `resources.ts` | Per-resource config: fields, sortable/searchable fields, filters, relations, mutability, example bodies |
| `endpoints.ts` | Endpoint registry: method, path, params, bodies, response schema, success/failure example requests, status codes |
| `openapi.ts` | Builds the OpenAPI 3.0.3 document from the registry and schemas |
| `examples.generated.json` | Real responses captured by `pnpm spec:examples` |

## API request pipeline

1. `requestId`: validates or creates `X-Request-Id`, and adds `X-Response-Time`.
2. `requestLogger` (pino-http): logs the method, path, and status only. Authorization, cookies, and passwords are redacted.
3. `helmet` uses a strict CSP for JSON and a relaxed one for Swagger UI. `cors` uses the configured origins, `credentials: false`, and exposed headers.
4. `requestTimeout` returns `503 REQUEST_TIMEOUT` if a handler stalls.
5. `/health`, `/ready`, `/openapi.json`, and `/docs` are served before rate limiting.
6. `/api/v1` rate limiters: a general per-IP limiter, plus a stricter one for delayed requests. The memory store is the default; the Mongo store (atomic upsert with a TTL index) works across instances.
7. `requireJsonBody` (415) and `express.json` with a size limit (413 for large bodies, 400 `INVALID_JSON` for malformed ones).
8. `simulateDelay` handles `?delay=`.
9. Module routers. `validateRequest` parses params, query, and body with strict Zod schemas and stores the result on `req.validated`.
10. `notFound`, then `globalErrorHandler`, which maps every error to `{ message, status, code, path, requestId }` without stack traces or internals.

## Data

- Fixtures in `apps/api/src/DB/fixtures` are generated with a seeded PRNG (`mulberry32`), so every deployment has identical data. A fingerprint of the fixtures is stored in `seed_meta`. `AUTO_SEED` reseeds only when the fingerprint or the counts differ.
- Each resource has a numeric `id` with a unique index. Mongo `_id`, `__v`, and `passwordHash` are never returned.
- Passwords are stored as scrypt hashes, even though they are public demo passwords.

## Simulated writes

The generic `createMutationHandlers` validates the body, checks references (for example, that a comment's `postId` exists), checks unique conflicts (409), and computes the result: `maxId + 1` for creates, a merged record for PATCH, and the replacement for PUT. It then responds with `X-MockAPIs-Simulated: true`. No write reaches the database.

## Website

- Docs pages are statically rendered from the registry. Code snippets and example responses are highlighted on the server with Shiki (dual light/dark themes).
- Client components handle the "Try it" panels, the playground, the endpoint directory search, the theme, and toasts. They import only `@mockapis/api-spec/constants`, so Zod schemas never reach the browser bundle.
- Requests that contain `{{accessToken}}` or `{{refreshToken}}` placeholders get fresh demo tokens from `/auth/login` before they are sent. Playground history lives in `sessionStorage`, and Authorization values are never stored.
