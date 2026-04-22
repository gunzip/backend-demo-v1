---
name: record-replay-backend-tests
description: Create or update local characterization and integration tests for Node.js or TypeScript backends that must preserve behavior across refactors, framework migrations, or legacy cleanup using record/replay at HTTP boundaries and Testcontainers-backed verification of real PaaS side effects. Use this whenever the user wants to freeze current backend behavior, add golden master or VCR-style tests, compare Express/Hono/Fastify/Azure Function implementations, validate refactors locally, or keep cloud-heavy integrations testable while still proving real writes to storage, Cosmos DB, Redis, Service Bus, or similar services.
---

# Record & Replay Backend Tests

Use this skill to build fast local characterization tests that freeze observable backend behavior before a refactor. The goal is to let coding agents change framework plumbing or legacy structure while keeping the externally visible contract intact.

## Outcome

Produce or update:

- one or more characterization/integration tests that execute the real adapter in-process, preferably through a framework-agnostic HTTP harness when the refactor may swap HTTP frameworks
- any cassette/recording helpers for outbound HTTP dependencies plus any Testcontainers setup needed to verify real local side effects for stateful services
- a short final note explaining what was frozen, how replay works, and how to rerun the verification

## First inspect

1. Find the existing test runner, fixtures layout, and project conventions. Reuse them.
2. Identify the inbound surface under test:
   - HTTP app/router
   - Azure Function or other serverless handler
   - queue/topic/event handler
3. Classify outbound dependencies:
    - HTTP/HTTPS traffic emitted by the same Node process
    - runtime-managed bindings or host-managed side effects
    - stateful PaaS data-plane dependencies that can be exercised locally via Testcontainers, such as blob/object storage, Cosmos-compatible stores, Redis, brokers, or queues
    - non-HTTP protocols with no viable local container or emulator
4. Find contract sources: OpenAPI, schema validators, existing fixtures, known regressions.
5. Freeze nondeterminism before recording anything: time, random IDs, env-driven values, volatile headers.

## Choose the inbound driver

Prefer the smallest in-process entrypoint that still exercises the real adapter.
If the refactor may replace the current HTTP framework, prefer a harness that targets a stable transport boundary rather than a framework-owned test helper.

### Hono or fetch-style apps

Do not default to `app.request(...)` just because it exists. If the service runs on Node, prefer Supertest against a shared Node-compatible server, request listener, or app callback that can stay stable across framework swaps. Reuse an existing `createServer()` or listener factory when the codebase has one; otherwise, extract a thin factory around the real runtime adapter and use that in both production bootstrap and tests. Fall back to `app.request(...)` only when there is no stable Node HTTP boundary to target or the runtime is not Node, and say why.

### Express, Fastify, or similar HTTP apps

Prefer Supertest against the real HTTP callback/server boundary when the goal is adapter portability. Framework injection is fine when it already targets the same stable boundary you expect to preserve. Do not start a long-lived localhost server unless the codebase gives you no other safe option.

### Azure Functions or serverless handlers

Import the handler and invoke it directly with crafted request/context objects. Do not default to Azure Functions Core Tools or an external host just to get HTTP semantics. For output bindings, assert the payload handed to the host/runtime rather than trying to observe the host's later network traffic.

## Choose the outbound strategy

Read `references/dependency-strategy.md` when the dependency mix is not obvious.

### Same-process HTTP or HTTPS traffic

Use record/replay at the network boundary.

- Prefer an existing project dependency if one already works.
- If you need to add one, choose the smallest tool that matches the transport used by the code under test.
- Persist recordings/cassettes near the test or under the existing fixtures layout.
- Record on the current implementation first, then switch the test to replay or lockdown mode.

### Azure SDKs that ultimately speak HTTP from the same process

Split these by contract boundary:

- if the SDK is just another way of calling a web service whose request/response contract you want to freeze, treat it like HTTP and normalize volatile fields before persisting recordings
- if the SDK targets a stateful PaaS dependency where the real contract is the stored document/blob/key/message, prefer Testcontainers and assert the resulting state instead of the SDK call arguments

For the record/replay cases, normalize volatile fields before persisting recordings:

- auth headers
- timestamps
- request IDs
- trace or span headers
- signed URLs or secrets

### Runtime-managed bindings or host-managed side effects

Do not try to sniff sockets or emulate the host. Assert the serialized payload the app hands to the runtime:

- `context.bindings`
- `extraOutputs`
- returned queue/event payloads
- framework-specific output envelope objects

### Stateful PaaS dependencies reachable through SDKs

Prefer Testcontainers-backed local verification over SDK spies.

- Start the smallest viable local service or emulator for the dependency.
- Inject the connection string, endpoint, or credentials the app already expects.
- Seed only the minimum state required for the scenario.
- After the request or handler completes, assert the actual side effect by querying the containerized service:
  - read the blob or object payload from storage
  - query the inserted or updated document
  - fetch the Redis value, TTL, or pub/sub result that matters
  - receive the queued message from the broker or queue
- Reset or isolate container state between tests so replayed HTTP behavior stays deterministic.

### Non-HTTP protocols with no viable local container or emulator

Avoid SDK spies by default. Only fall back to an SDK-boundary seam when the runtime owns the side effect or there is no credible local service/emulator to assert against, and explain why that exception is necessary.

### Mixed dependencies

Combine techniques in one test:

- record/replay for HTTP calls
- Testcontainers for stateful service side effects
- direct assertions for host-managed outputs

## Implementation workflow

1. Start from the current implementation, not the refactor target.
2. Pick one representative request or message shape from OpenAPI, schema examples, or existing fixtures.
3. For HTTP services on Node, prefer a shared server/listener factory plus Supertest so the same test can survive a framework swap with minimal edits.
4. Identify the smallest container topology needed for non-HTTP stateful dependencies and wire it through the same env/config path production code already uses.
5. Write a characterization test that asserts:
   - final status/result
   - stable headers or metadata that matter
   - response/body payload
   - observable side effects at the correct boundary
   - real persisted state for storage, document stores, caches, or brokers when those are part of the contract
6. If outbound HTTP exists, add record mode and generate the first cassette from the current implementation.
7. Immediately add replay/lockdown behavior so future runs fail instead of silently re-recording.
8. Keep assertions at the external contract level. Do not overfit to internal helper calls or SDK invocation details when the real contract is the data now present in the backing service.
9. Run the test, then use it unchanged against the refactored implementation.
10. Do not update cassettes during refactor validation unless the behavior change is intentional and agreed.

## What to freeze

Freeze what a client or adjacent system can observe:

- HTTP response status, headers, and body
- normalized outbound HTTP request shape
- queue or topic payloads
- stored document/blob/cache/message state as read back from the local service or emulator
- emitted domain-event payloads

Do not freeze irrelevant noise:

- trace IDs
- timestamps unless semantically meaningful
- framework-specific header ordering
- incidental helper-call counts that are not part of the contract

## Guardrails

- Prefer local, in-process execution over booting hosts or opening ports.
- Avoid framework-owned request helpers when the goal is to survive HTTP framework or adapter refactors and a stable Node HTTP boundary is available.
- If the selected scenario has no outbound dependency, do not invent record/replay machinery just because the pattern can support it.
- Keep recordings small and reviewable.
- Redact secrets before persisting any cassette.
- Prefer Testcontainers over SDK spies for stateful PaaS dependencies; if you must fall back, document why the real side effect cannot be exercised locally.
- Keep the container topology minimal and cheap enough for local iteration.
- If the refactor changes only framework plumbing, the characterization test should stay the same or need only minimal entrypoint changes.

## Final response

When you finish, briefly state:

- which surface was tested
- which dependencies used record/replay vs Testcontainers vs direct runtime-output assertions
- which files were added or changed
- how to rerun the local verification

## Examples

**Example 1**
Input: "Migrate this Express endpoint to Hono without breaking behavior. It calls two REST services and writes to Cosmos."
Output shape: "Add a characterization test, record outbound HTTP on the current Express version, start the local Cosmos-compatible container or emulator with Testcontainers, then replay the cassette unchanged while asserting the stored document through the database itself during Hono validation."

**Example 2**
Input: "Freeze this Azure Function before I refactor it. It calls a REST API and emits a Service Bus message."
Output shape: "Invoke the handler directly, record only the REST call, assert the emitted binding/message payload, and avoid running the Functions host."

**Example 3**
Input: "Add refactor-safety tests to this Hono service in the current monorepo. It calls a partner REST API and caches the result in Redis."
Output shape: "Use Supertest against a shared Node HTTP adapter or server factory, record and replay the partner HTTP call, run Redis in Testcontainers, and assert the real cached key/value rather than spying on the Redis client."
