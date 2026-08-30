import { describe, expect, test } from "bun:test";
import { decodeUpkeep, EXECUTE_FEE, NETWORKS } from "@corvidlabs/arcron";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("published client", () => {
  test("decodeUpkeep is imported from @corvidlabs/arcron", () => {
    expect(typeof decodeUpkeep).toBe("function");
    expect(EXECUTE_FEE).toBe(3000);
    expect(NETWORKS.testnet.defaultAppId).toBe(769891898);
    expect(NETWORKS.testnet.genesisIds).toContain("testnet-v1.0");
  });
  test("src does not vendor the upkeep decoder", () => {
    const srcDir = join(import.meta.dir);
    const files = ["cli.ts", "scan.ts", "skip.ts", "genesis.ts"];
    const joined = files.map((f) => readFileSync(join(srcDir, f), "utf8")).join("\n");
    expect(joined.includes("HEAD_BYTES")).toBe(false);
    expect(joined.includes("BOX_NAME_PREFIX")).toBe(false);
  });
  test("listener does not vendor the upkeep decoder", () => {
    const listen = readFileSync(join(import.meta.dir, "..", "scripts", "listen.ts"), "utf8");
    expect(listen.includes('from "../src/scan"')).toBe(true);
    expect(listen.includes("HEAD_BYTES")).toBe(false);
    expect(listen.includes("BOX_NAME_PREFIX")).toBe(false);
  });
});
