import { describe, it, expect } from "vitest";
import { exitCodeFromDiagnostics } from "../src/types/index.js";

describe("exitCodeFromDiagnostics", () => {
  it("returns 0 when there are no errors", () => {
    expect(exitCodeFromDiagnostics([])).toBe(0);
  });

  it("returns 1 when there is at least one error diagnostic", () => {
    expect(
      exitCodeFromDiagnostics([
        {
          severity: "warning",
          code: "WARN_EMPTY_TITLE",
          message: "title is empty",
          line: 1,
          filePath: "fixtures/valid/basico.tmd",
          recoverable: true
        },
        {
          severity: "error",
          code: "BLOCK_NOT_CLOSED",
          message: "block not closed",
          line: 10,
          filePath: "fixtures/invalid/bloco-nao-fechado.tmd",
          recoverable: false
        }
      ])
    ).toBe(1);
  });

  it("returns 0 when there are warnings only", () => {
    expect(
      exitCodeFromDiagnostics([
        {
          severity: "warning",
          code: "WARN_EMPTY_BLOCK",
          message: "empty block",
          line: null,
          filePath: "fixtures/valid/basico.tmd",
          recoverable: true
        }
      ])
    ).toBe(0);
  });
});
