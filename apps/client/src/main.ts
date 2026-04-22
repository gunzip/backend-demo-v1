import { runClient } from "./run-client";

const result = await runClient(process.argv.slice(2), process.env);

if (result.isErr()) {
  console.error(result.error.message);
  process.exitCode = 1;
}
