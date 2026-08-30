/**
 * No-key Arcron listener.
 *
 * Reads TestNet algod boxes via src/scan.ts (package decodeUpkeep) and writes
 * docs/due.json. Does not sign. No mnemonic. Not an execute. Dry-run only.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import algosdk from "algosdk";
import { NETWORKS } from "@corvidlabs/arcron";
import { assertTestNetGenesis } from "../src/genesis";
import { listUpkeeps, rank } from "../src/scan";
import { SKIP_TARGET_APPS, SKIP_UPKEEP_IDS } from "../src/skip";

const DEFAULT_APP = NETWORKS.testnet.defaultAppId ?? 769891898;
const DEFAULT_URL = NETWORKS.testnet.algod.server;
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "docs", "due.json");

function num(n: bigint): number {
  return Number(n);
}

async function main(): Promise<void> {
  const url = process.env.ALGOD_URL || DEFAULT_URL;
  const token = process.env.ALGOD_TOKEN || "";
  const appId = Number(process.env.ARCRON_APP_ID || DEFAULT_APP);
  const algod = new algosdk.Algodv2(token, url, "");
  const params = await algod.getTransactionParams().do();
  const genesisId = String(params.genesisID ?? params.genesisId ?? "");
  assertTestNetGenesis(genesisId);
  const round = BigInt(params.firstValid ?? params.firstRoundValid ?? 0);

  const ranked = rank(await listUpkeeps(algod, appId), round);
  ranked.sort((a, b) => (a.upkeep.id < b.upkeep.id ? -1 : a.upkeep.id > b.upkeep.id ? 1 : 0));
  const due = ranked.filter((r) => r.executable);
  const skipped = ranked.filter((r) => r.skipped);

  const payload = {
    generated_at: new Date().toISOString().replace(/\.\d{3}Z$/, "Z"),
    algod: url,
    app: appId,
    genesis: genesisId,
    last_round: num(round),
    listed: ranked.length,
    skipped: skipped.map((r) => num(r.upkeep.id)),
    skip_upkeep_ids: [...SKIP_UPKEEP_IDS].map(num),
    skip_target_apps: [...SKIP_TARGET_APPS].map(num),
    due_count: due.length,
    due: due.map((r) => ({
      id: num(r.upkeep.id),
      target: num(r.upkeep.targetApp),
      interval: num(r.upkeep.intervalRounds),
      next: num(r.upkeep.nextExecutionRound),
      fee: num(r.fee),
      balance: num(r.upkeep.balance),
      times: num(r.upkeep.timesExecuted),
    })),
  };

  await mkdir(dirname(OUT), { recursive: true });
  await writeFile(OUT, JSON.stringify(payload, null, 2) + "\n");
  console.log(
    "wrote " +
      OUT +
      " last_round=" +
      payload.last_round +
      " listed=" +
      payload.listed +
      " due=" +
      payload.due_count +
      " skipped=" +
      JSON.stringify(payload.skipped),
  );
  console.log("listener: no signer loaded, no transaction submitted.");
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
