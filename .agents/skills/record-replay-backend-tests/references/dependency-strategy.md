# Dependency strategy matrix

Use this reference when the right testing boundary is not obvious.

## Inbound surface

| Surface | Preferred driver | Why |
| --- | --- | --- |
| Hono / OpenAPIHono app instance | `app.request(...)` | Fastest in-process HTTP contract test without opening a port |
| Express / Fastify / similar app object | framework injection or Supertest | Exercises the real adapter while keeping the loop local |
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
const app = createApp();

const response = await app.request("/users/is-adult", {
  method: "POST",
  headers: {
    "content-type": "application/json",
  },
  body: JSON.stringify({
    fiscal_code: "RSSMRA80A01H501U",
    birth_date: "1980-01-01",
  }),
});
```

## Replay safety checklist

Before saving a cassette, normalize or remove values that will create noisy diffs:

- timestamps and generated dates
- request IDs and correlation IDs
- trace headers
- auth tokens
- signed URLs
- environment-specific hosts when only the path and payload matter
