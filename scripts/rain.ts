/**
 * No-key Rain listener.
 *
 * Reads TestNet hub 770130162 RainRec boxes and writes docs/rain.json.
 * Does not sign. No mnemonic. Not a send.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import algosdk from "algosdk";
import { assertTestNetGenesis } from "../src/genesis";
import { DEFAULT_HUB, boxKey, decodeRain, modeName, rainStatus } from "../src/rain";

const DEFAULT_URL = "https://testnet-api.algonode.cloud";
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "docs", "rain.json");

function num(n: bigint): number {
  return Number(n);
}

function keyOf(kv: { key?: string }): string {
  const k = kv.key ?? "";
  try {
    return Buffer.from(k, "base64").toString("utf8");
  } catch {
    return k;
  }
}

async function nextRainId(algod: algosdk.Algodv2, hub: number): Promise<bigint> {
  const app = await algod.getApplicationByID(hub).do();
  const params = (app.params ?? app) as {
    globalState?: Array<{ key?: string; value?: { uint?: number | bigint; type?: number } }>;
    "global-state"?: Array<{ key?: string; value?: { uint?: number | bigint; type?: number } }>;
  };
  const gs = params.globalState ?? params["global-state"] ?? [];
  for (const kv of gs) {
    if (keyOf(kv) === "next_rain_id") {
      return BigInt(kv.value?.uint ?? 0);
    }
  }
  throw new Error("app " + hub + ": next_rain_id missing");
}

async function main(): Promise<void> {
  const url = process.env.ALGOD_URL || DEFAULT_URL;
  const token = process.env.ALGOD_TOKEN || "";
  const hub = Number(process.env.RAIN_HUB || DEFAULT_HUB);
  const algod = new algosdk.Algodv2(token, url, "");
  const params = await algod.getTransactionParams().do();
  const genesisId = String(params.genesisID ?? params.genesisId ?? "");
  assertTestNetGenesis(genesisId);
  const round = BigInt(params.firstValid ?? params.firstRoundValid ?? 0);
  const nextId = await nextRainId(algod, hub);
  const rains = [];
  for (let id = 1n; id <= nextId; id++) {
    const rawBox = await algod.getApplicationBoxByName(hub, boxKey(id)).do();
    const value = rawBox.value instanceof Uint8Array ? rawBox.value : new Uint8Array(rawBox.value);
    const rec = decodeRain(id, value);
    rains.push({
      id: num(rec.id),
      label: rec.label,
      mode: modeName(rec.mode),
      drip: num(rec.drip),
      pot: num(rec.pot),
      tickets: num(rec.tickets),
      prize_locked: num(rec.prizeLocked),
      commit_round: num(rec.commitRound),
      status: rainStatus(rec, round),
    });
  }
  const payload = {
    generated_at: new Date().toISOString().replace(/\.\d{3}Z$/, "Z"),
    algod: url,
    hub,
    genesis: genesisId,
    last_round: num(round),
    next_rain_id: num(nextId),
    rains,
  };
  await mkdir(dirname(OUT), { recursive: true });
  await writeFile(OUT, JSON.stringify(payload, null, 2) + "\n");
  console.log("wrote " + OUT + " last_round=" + payload.last_round + " rains=" + rains.length);
  console.log("rain: no signer loaded, no transaction submitted.");
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
