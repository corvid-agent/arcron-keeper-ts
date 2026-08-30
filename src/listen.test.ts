import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("TypeScript listener", () => {
  const src = readFileSync(join(import.meta.dir, "..", "scripts", "listen.ts"), "utf8");

  test("reuses src/scan.ts decode, does not vendor the decoder", () => {
    expect(src.includes('from "../src/scan"')).toBe(true);
    expect(src.includes("HEAD_BYTES")).toBe(false);
    expect(src.includes("BOX_NAME_PREFIX")).toBe(false);
    expect(src.includes("decodeUpkeep(")).toBe(false);
  });

  test("is dry-run only: no mnemonic, no execute", () => {
    expect(src.includes("KEEPER_MNEMONIC")).toBe(false);
    expect(src.includes("mnemonicToSecretKey")).toBe(false);
    expect(src.includes("makeBasicAccountTransactionSigner")).toBe(false);
    expect(/[^.]execute\(/.test(src)).toBe(false);
  });

  test("skips upkeep 81 and target app 770041460 via src/skip", () => {
    expect(src.includes('from "../src/skip"')).toBe(true);
    expect(src.includes("SKIP_UPKEEP_IDS")).toBe(true);
    expect(src.includes("SKIP_TARGET_APPS")).toBe(true);
  });
});
