# Future: persistent sandboxes (design notes)

Today, writes are simulated: responses are realistic, but the shared dataset never changes. A future version could offer opt-in **sandboxes** where a user's writes persist for a limited time. This design is not implemented. It records how the current architecture accommodates it.

## Proposed behavior

- `POST /api/v1/sandboxes` returns `{ sandboxId, token, expiresAt }`.
- Requests that include `X-Sandbox-Id` (plus the sandbox token) read and write that sandbox. Requests without it keep today's simulated behavior.
- Sandboxes expire after, for example, 24 hours and are capped in size (e.g. 1,000 extra records and 1 MB in total).

## Data model

- Sandbox records live in separate collections (or the same collections with a `sandboxId` field and compound indexes `{ sandboxId, id }`), never mixed with seed records.
- Reads merge the seed data with the sandbox overlay. Created records are stored; updates and deletes are stored as overrides and tombstones keyed by the seed `id`.
- TTL indexes on `expiresAt` clean up automatically, using the same mechanism as the Mongo rate-limit store.

## Where it plugs in

- `createResourceService(key)` already centralizes `list`, `getById`, `exists`, and `nextId`. A sandbox-aware variant can take a `sandboxId` and apply the overlay.
- `createMutationHandlers` already computes the resulting record. With a sandbox, it would persist that record instead of only returning it, and drop the `X-MockAPIs-Simulated` header.
- The endpoint registry would gain a `sandbox` flag so docs, the OpenAPI document, and the playground can show the extra header.

## Safety

- Sandbox creation would need its own stricter rate limit, plus quotas per IP.
- Content must still be validated by the same schemas. Free-text fields should be length-limited to prevent abuse as file storage.
- Sandboxes must never be listable by other users, and IDs and tokens must be unguessable.
