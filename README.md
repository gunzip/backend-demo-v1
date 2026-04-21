# backend-demo-v1

Nx + pnpm monorepo with two applications:

- `apps/api`: Hono REST API with input validation and OpenAPI generation.
- `apps/client`: Hono RPC client that consumes the API contract.

## Requirements

- Node `22.22.2`
- pnpm `8.15.5`

## Install

```bash
pnpm install
```

## Useful commands

```bash
pnpm build
pnpm lint
pnpm test
pnpm typecheck
pnpm start:api
pnpm start:client -- --fiscal-code RSSMRA80A01H501U --birth-date 1980-01-01
```

## API contract

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

The API also exposes the OpenAPI document at `GET /openapi.json`.

## Architecture

The server follows the clean architecture layout recommended by PagoPA DX:

- `src/domain`: pure domain logic and entities
- `src/use-cases`: application rules
- `src/adapters`: HTTP/OpenAPI adapter
- `src/config.ts`: fail-fast runtime configuration
- `src/api.ts`: application entrypoint

## Notes

- `birth_date` is accepted in `YYYY-MM-DD` format.
- For the MVP, fiscal code consistency checks only verify the encoded birth year.
