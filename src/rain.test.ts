import { describe, expect, test } from "bun:test";
import { boxKey, decodeRain, parseBoxKey, rainStatus, SEED_WINDOW, type RainRec } from "./rain";

test("box key round trip", () => {
  const key = boxKey(3n);
  expect(key.length).toBe(9);
  expect(key[0]).toBe(114);
  expect(parseBoxKey(key)).toBe(3n);
});

test("decode rejects short", () => {
  expect(() => decodeRain(1n, new Uint8Array(223))).toThrow(/short RainRec/);
});

test("status window", () => {
  const r = {
    mode: 1n,
    prizeLocked: 50000n,
    commitRound: 100n,
  } as RainRec;
  expect(rainStatus(r, 100n)).toBe("drawn-waiting-resolve");
  expect(rainStatus(r, 101n)).toBe("resolve-window remaining");
  expect(rainStatus(r, 100n + BigInt(SEED_WINDOW) + 1n)).toBe("abandonable");
  expect(rainStatus({ mode: 0n, prizeLocked: 0n, commitRound: 0n } as RainRec, 9n)).toBe("open");
});
