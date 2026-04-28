import { hc } from "hono/client";
import { okAsync, Result, ResultAsync } from "neverthrow";

import type { AppType } from "../../api/src";

import { loadClientConfig } from "./config";

export interface CliArgs {
  birthDate: string;
  fiscalCode: string;
}

export interface Output {
  error: (message?: unknown, ...optionalParams: unknown[]) => void;
  log: (message?: unknown, ...optionalParams: unknown[]) => void;
}

function normalizeError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }

  return new Error(String(error));
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

const parseCliArgsResult = Result.fromThrowable(parseCliArgs, normalizeError);
const loadClientConfigResult = Result.fromThrowable(
  loadClientConfig,
  normalizeError,
);

export type PostIsAdultRequest = ReturnType<typeof createPostIsAdultRequest>;

type IsAdultResponse = Awaited<ReturnType<PostIsAdultRequest>>;
export function runClient(
  args: string[],
  env: NodeJS.ProcessEnv,
  output: Output = console,
  postIsAdultRequest?: PostIsAdultRequest,
) {
  return parseCliArgsResult(args)
    .andThen((cliArgs) =>
      loadClientConfigResult(env).map((config) => ({
        cliArgs,
        postIsAdultRequest:
          postIsAdultRequest ?? createPostIsAdultRequest(config.apiUrl),
      })),
    )
    .asyncAndThen(({ cliArgs, postIsAdultRequest: postRequest }) =>
      executePostIsAdultRequest(postRequest, cliArgs).andThen((response) =>
        handleResponse(response, cliArgs, output),
      ),
    );
}

function createPostIsAdultRequest(apiUrl: string) {
  const client = hc<AppType>(apiUrl);

  return (cliArgs: CliArgs) =>
    client.users["is-adult"].$post({
      json: {
        birth_date: cliArgs.birthDate,
        fiscal_code: cliArgs.fiscalCode,
      },
    });
}

function executePostIsAdultRequest(
  postIsAdultRequest: PostIsAdultRequest,
  cliArgs: CliArgs,
) {
  return ResultAsync.fromPromise(
    postIsAdultRequest(cliArgs),
    (error) => new Error(`Request failed: ${normalizeError(error).message}`),
  );
}

function handleResponse(
  response: IsAdultResponse,
  cliArgs: CliArgs,
  output: Output,
): ResultAsync<void, Error> {
  switch (response.status) {
    case 200:
      return readJsonResult(response, "success response").map((isAdult) => {
        output.log(
          `User with fiscal code ${cliArgs.fiscalCode} is ${
            isAdult ? "an adult" : "not an adult"
          }.`,
        );
      });
    case 400:
      return readJsonResult(response, "validation error response").map(
        (problemDetails) => {
          output.error("Request validation failed:");
          output.error(`Title: ${problemDetails.title}`);
          output.error(`Detail: ${problemDetails.detail}`);
          output.error("Errors:");
          for (const error of problemDetails.errors) {
            output.error(`- Code: ${error.code}`);
            output.error(`  Message: ${error.message}`);
            output.error(`  Path: ${error.path.join(".")}`);
          }
        },
      );
    case 422:
      return readJsonResult(response, "domain error response").map(
        (problemDetails) => {
          output.error("Domain validation failed:");
          output.error(`Title: ${problemDetails.title}`);
          output.error(`Detail: ${problemDetails.detail}`);
        },
      );
    default: {
      const _exhaustiveCheck: never = response;
      return okAsync(_exhaustiveCheck);
    }
  }
}

function readJsonResult<T>(
  response: { json: () => Promise<T> },
  context: string,
) {
  return ResultAsync.fromPromise(
    response.json(),
    (error) =>
      new Error(`Failed to read ${context}: ${normalizeError(error).message}`),
  );
}
