# Dependency strategy matrix

Use this reference when the right testing boundary is not obvious.

## Inbound surface

| Surface                                | Preferred driver                                                                                                                      | Why                                                                               |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Hono / OpenAPIHono app instance        | Supertest against a shared Node adapter/request listener; fall back to `app.request(...)` only if no stable Node HTTP boundary exists | Keeps the test pinned to an HTTP boundary that can survive framework swaps        |
| Express / Fastify / similar app object | Supertest against the real callback/server boundary, or framework injection when it targets the same boundary                         | Exercises the real adapter while keeping the loop local                           |
| Azure Function HTTP trigger            | direct handler invocation with crafted request/context                                                                                | The Functions host owns the HTTP server, so Supertest is not the natural boundary |
| Queue/topic/event handler              | direct invocation with message/context                                                                                                | Keeps the test focused on the handler contract instead of host startup            |

## Outbound dependency

| Dependency type                                                | Preferred technique                          | Assert at this boundary                                                    | Avoid                                                              |
| -------------------------------------------------------------- | -------------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| REST or HTTP service call                                      | record/replay cassette                       | normalized request + final contract                                        | live traffic during replay mode                                    |
| SDK wrapper around an HTTP web service contract                | record/replay cassette with normalization    | normalized HTTP exchange that represents the external service contract      | persisting secrets, auth headers, or unstable request IDs          |
| Azure Function output binding                                  | direct assertion on binding payload          | `context.bindings`, `extraOutputs`, or returned output envelope            | sniffing the host's later network traffic                          |
| Blob/object storage, Cosmos-compatible stores, Redis, brokers  | Testcontainers-backed real local side effect | blob contents, stored document, cache state, or received message read back | asserting only SDK call args or trying to record socket internals  |
| Mixed HTTP + stateful service                                  | hybrid test                                  | HTTP via cassette, stateful service via containerized side effect          | forcing one mechanism onto everything                              |
| No viable local service or emulator                            | narrow seam with explicit justification      | closest contract boundary you can prove locally                            | defaulting to mocks/spies without explaining why a real check fails |

## Testcontainers lifecycle

When production code reads endpoints or connection strings from env/config, point that same config at the containerized dependency in test setup.

```ts
import { GenericContainer, Wait } from "testcontainers";

const redisContainer = await new GenericContainer("redis:7-alpine")
  .withExposedPorts(6379)
  .withWaitStrategy(Wait.forLogMessage("Ready to accept connections"))
  .start();

process.env.REDIS_URL = `redis://${redisContainer.getHost()}:${redisContainer.getMappedPort(6379)}`;
```

Prefer the lightest setup that proves the contract:

- start only the services required for the scenario
- seed state through public APIs when possible
- read back the side effect through the same protocol another consumer would use
- clean state between tests so assertions stay deterministic

## Hono example

```ts
import request from "supertest";
import { createAdaptorServer } from "@hono/node-server";

const server = createAdaptorServer({
  fetch: createApp().fetch,
});

const response = await request(server)
  .post("/users/is-adult")
  .set("content-type", "application/json")
  .send({
    fiscal_code: "RSSMRA80A01H501U",
    birth_date: "1980-01-01",
  });
```

If the runtime already exposes a `createServer()` or request-listener factory, prefer that over instantiating the framework app directly in the test.

## Side-effect assertions

When the dependency is stateful, verify the thing that now exists in the service:

- storage: download the blob/object and assert payload plus relevant metadata
- Cosmos/document DB: query the collection/container for the persisted document
- Redis: read the key, TTL, stream, or published value that matters
- queue/broker: receive the message and assert body plus stable headers

Only keep assertions at the SDK boundary when the runtime itself owns the next hop, such as Azure Functions output bindings.

## Replay safety checklist

Before saving a cassette, normalize or remove values that will create noisy diffs:

- timestamps and generated dates
- request IDs and correlation IDs
- trace headers
- auth tokens
- signed URLs
- environment-specific hosts when only the path and payload matter
