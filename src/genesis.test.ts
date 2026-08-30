import { describe, expect, test } from "bun:test";
import { assertTestNetGenesis } from "./genesis";

describe("assertTestNetGenesis", () => {
  test("accepts testnet-v1.0", () => {
    expect(() => assertTestNetGenesis("testnet-v1.0")).not.toThrow();
  });
  test("refuses MainNet", () => {
    expect(() => assertTestNetGenesis("mainnet-v1.0")).toThrow(/MainNet/);
  });
  test("refuses anything else", () => {
    expect(() => assertTestNetGenesis("sandnet-v1")).toThrow(/Refusing genesis/);
  });
});
