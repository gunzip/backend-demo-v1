import { describe, expect, it, vi } from "vitest";

import { runClient } from "./run-client";

describe("runClient", () => {
  it("returns an err result when the HTTP request throws", async () => {
    const output = {
      error: vi.fn(),
      log: vi.fn(),
    };

    const result = await runClient(
      ["--fiscal-code", "RSSMRA80A01H501U", "--birth-date", "1980-01-01"],
      { API_URL: "http://localhost:3000" },
      output,
      async () => {
        throw new Error("network down");
      },
    );

    expect(result.isErr()).toBe(true);
    if (result.isOk()) {
      throw new Error("Expected request failure");
    }

    expect(result.error.message).toBe("Request failed: network down");
    expect(output.log).not.toHaveBeenCalled();
    expect(output.error).not.toHaveBeenCalled();
  });
});
