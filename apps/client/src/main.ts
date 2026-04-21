import { hc } from "hono/client";

import type { AppType } from "../../api/src";

import { loadClientConfig } from "./config";

interface CliArgs {
  birthDate: string;
  fiscalCode: string;
}

function parseCliArgs(args: string[]): CliArgs {
  return {
    birthDate: readRequiredOption(args, "--birth-date"),
    fiscalCode: readRequiredOption(args, "--fiscal-code"),
  };
}

function readRequiredOption(
  args: string[],
  optionName: "--birth-date" | "--fiscal-code",
): string {
  const optionIndex = args.indexOf(optionName);

  if (optionIndex === -1 || optionIndex === args.length - 1) {
    throw new Error(
      `Missing required option ${optionName}. Usage: pnpm start:client -- --fiscal-code RSSMRA80A01H501U --birth-date 1980-01-01`,
    );
  }

  const optionValue = args[optionIndex + 1];

  if (typeof optionValue !== "string" || optionValue.startsWith("--")) {
    throw new Error(
      `Missing required option ${optionName}. Usage: pnpm start:client -- --fiscal-code RSSMRA80A01H501U --birth-date 1980-01-01`,
    );
  }

  return optionValue;
}

const config = loadClientConfig(process.env);
const cliArgs = parseCliArgs(process.argv.slice(2));
const client = hc<AppType>(config.apiUrl);

const response = await client.users["is-adult"].$post({
  json: {
    birth_date: cliArgs.birthDate,
    fiscal_code: cliArgs.fiscalCode,
  },
});

if (!response.ok) {
  const errorPayload = await response.json();
  const errorMessage =
    typeof errorPayload === "object" &&
    errorPayload !== null &&
    "error" in errorPayload &&
    typeof errorPayload.error === "string"
      ? errorPayload.error
      : "Unknown API error";

  throw new Error(
    `Request failed with status ${response.status}: ${errorMessage}`,
  );
}

const result = await response.json();

console.log(result);
