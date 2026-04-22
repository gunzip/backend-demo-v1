# Dependency strategy matrix

Use this reference when the right testing boundary is not obvious.

## Inbound surface

| Surface | Preferred driver | Why |
| --- | --- | --- |
| Hono / OpenAPIHono app instance | Supertest against a shared Node adapter/request listener; fall back to `app.request(...)` only if no stable Node HTTP boundary exists | Keeps the test pinned to an HTTP boundary that can survive framework swaps |
| Express / Fastify / similar app object | Supertest against the real callback/server boundary, or framework injection when it targets the same boundary | Exercises the real adapter while keeping the loop local |
| Azure Function HTTP trigger | direct handler invocation with crafted request/context | The Functions host owns the HTTP server, so Supertest is not the natural boundary |
| Queue/topic/event handler | direct invocation with message/context | Keeps the test focused on the handler contract instead of host startup |

## Outbound dependency

| Dependency type | Preferred technique | Assert at this boundary | Avoid |
| --- | --- | --- | --- |
| REST or HTTP service call | record/replay cassette | normalized request + final contract | live traffic during replay mode |
| Azure SDK that emits HTTP from the same Node process | record/replay cassette with normalization | normalized HTTP or SDK boundary payload | persisting secrets, auth headers, or unstable request IDs |
| Azure Function output binding | direct assertion on binding payload | `context.bindings`, `extraOutputs`, or returned output envelope | sniffing the host's later network traffic |
| Service Bus / Redis / other non-HTTP SDK | module mock or spy | payload/arguments sent to the SDK | socket-level recording |
| Mixed HTTP + non-HTTP | hybrid test | HTTP via cassette, non-HTTP via mocks/spies | forcing one mechanism onto everything |

## Vitest mock ordering

When the production module instantiates SDK clients at import time, register the mock before importing the subject under test.

```ts
import { vi } from "vitest";

const sendMessages = vi.fn();

vi.mock("@azure/service-bus", () => ({
  ServiceBusClient: vi.fn(() => ({
    createSender: () => ({
      sendMessages,
    }),
  })),
}));

const { handler } = await import("../handler");
```

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

## Replay safety checklist

Before saving a cassette, normalize or remove values that will create noisy diffs:

- timestamps and generated dates
- request IDs and correlation IDs
- trace headers
- auth tokens
- signed URLs
- environment-specific hosts when only the path and payload matter
