import { describe, expect, test } from "bun:test";
import { shouldSkip, skipReason } from "./skip";

describe("skip list", () => {
  test("skips upkeep 81", () => {
    expect(shouldSkip({ id: 81n, targetApp: 1n })).toBe(true);
    expect(skipReason({ id: 81n, targetApp: 1n })).toContain("81");
  });
  test("skips target app 770041460", () => {
    expect(shouldSkip({ id: 1n, targetApp: 770041460n })).toBe(true);
    expect(skipReason({ id: 1n, targetApp: 770041460n })).toContain("770041460");
  });
  test("does not skip an ordinary upkeep", () => {
    expect(shouldSkip({ id: 1n, targetApp: 769891898n })).toBe(false);
    expect(skipReason({ id: 1n, targetApp: 769891898n })).toBeNull();
  });
});
