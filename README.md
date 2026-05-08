# backend-demo-v1

Nx + pnpm monorepo with the same "adult check" use case implemented in three ways.

| Area                  | Purpose                                                                                                                           |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `apps/code-first/`    | Contract, validation, and routes are defined in TypeScript/Hono code and the API publishes its OpenAPI document at runtime.       |
| `apps/api-first/`     | The contract starts from `openapi.yaml`, then server and client artifacts are generated from that spec.                           |
| `apps/api-first-af/`  | The contract starts from `openapi.yaml`, then Azure Functions v4 `app.http(...)` handlers are generated from the server routes.   |

## Requirements

- Node `22.22.2`
- pnpm `10.33.2`

## Install

```bash
pnpm install
```

## Repo-wide commands

```bash
pnpm build
pnpm lint
pnpm test
pnpm typecheck
```

## Shared API behavior

### `POST /users/is-adult`

Request body:

```json
{
  "fiscal_code": "RSSMRA80A01H501U",
  "birth_date": "1980-01-01"
}
```

Response body:

```json
true
```

- `birth_date` is accepted in `YYYY-MM-DD` format.
- For this MVP, fiscal code consistency checks only verify the encoded birth year.

## `apps/code-first/`

`apps/code-first/` contains the hand-written implementation:

- `apps/code-first/api`: Hono API (`api` Nx project)
- `apps/code-first/client`: Hono RPC CLI client (`client` Nx project)

### Run

The root shortcuts point to this implementation:

```bash
pnpm start:api
pnpm start:client -- --fiscal-code RSSMRA80A01H501U --birth-date 1980-01-01
```

Equivalent Nx commands:

```bash
pnpm nx run api:serve
API_URL=http://localhost:3000 pnpm nx run client:start -- --fiscal-code RSSMRA80A01H501U --birth-date 1980-01-01
```

### Useful targets

```bash
pnpm nx run api:build
pnpm nx run api:test
pnpm nx run api:lint
pnpm nx run api:typecheck

pnpm nx run client:build
pnpm nx run client:test
pnpm nx run client:lint
pnpm nx run client:typecheck
```

### Notes

- The API listens on `PORT`, default `3000`.
- The client reads `API_URL`, default `http://localhost:3000`.
- The OpenAPI document is exposed by the running API at `GET /openapi.json`.
- The HTTP contract lives in code under `apps/code-first/api/src/adapters/http/routes/`.

## `apps/api-first/`

`apps/api-first/` contains the spec-driven implementation:

- `apps/api-first/openapi.yaml`: source of truth for the contract
- `apps/api-first/api`: generated-validator API (`api-first-api` Nx project)
- `apps/api-first/client`: generated client package (`api-first-client` Nx project)

### Generate artifacts

```bash
pnpm nx run api-first-api:generate
pnpm nx run api-first-client:generate
```

### Run and validate

```bash
pnpm nx run api-first-api:serve

pnpm nx run api-first-api:build
pnpm nx run api-first-api:test
pnpm nx run api-first-api:lint
pnpm nx run api-first-api:typecheck

pnpm nx run api-first-client:build
pnpm nx run api-first-client:test
pnpm nx run api-first-client:lint
pnpm nx run api-first-client:typecheck
```

### Notes

- The API listens on `PORT`, default `3000`.
- The OpenAPI contract is authored in `apps/api-first/openapi.yaml`, not served dynamically by the API.
- `apps/api-first/client` is a generated client library entrypoint (`src/index.ts`), not a CLI like `apps/code-first/client`.
- The API and client targets depend on generation, so Nx will regenerate artifacts before build/test/lint/typecheck when needed.

## `apps/api-first-af/`

`apps/api-first-af/` contains the Azure Functions v4 spec-driven implementation:

- `apps/api-first-af/openapi.yaml`: source of truth for the contract
- `apps/api-first-af/api`: generated Azure Functions app (`api-first-af-api` Nx project)

### Generate artifacts

```bash
pnpm nx run api-first-af-api:generate
```

### Run and validate

```bash
pnpm nx run api-first-af-api:serve

pnpm nx run api-first-af-api:build
pnpm nx run api-first-af-api:test
pnpm nx run api-first-af-api:lint
pnpm nx run api-first-af-api:typecheck
```

### Notes

- The Azure Functions app is registered from `apps/api-first-af/api/src/index.ts`.
- Generated Azure Functions wrappers live under `apps/api-first-af/api/src/generated/`.
- The `serve` target builds the app and then runs `func start` on port `7072`.
- The OpenAPI contract is authored in `apps/api-first-af/openapi.yaml`.
