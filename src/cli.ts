import algosdk from "algosdk";
import { EXECUTE_FEE, NETWORKS, execute, type Upkeep } from "@corvidlabs/arcron";
import { assertTestNetGenesis } from "./genesis";
import { listUpkeeps, rank } from "./scan";

const DEFAULT_APP = NETWORKS.testnet.defaultAppId ?? 769891898;
const DEFAULT_URL = NETWORKS.testnet.algod.server;

function arg(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  if (i >= 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith("--")) return process.argv[i + 1];
  return undefined;
}

function wantExecute(): boolean {
  return process.argv.includes("--execute");
}

function algodClient(): algosdk.Algodv2 {
  const url = process.env.ALGOD_URL || DEFAULT_URL;
  const token = process.env.ALGOD_TOKEN || "";
  return new algosdk.Algodv2(token, url, "");
}

function fmt(n: bigint): string {
  return n.toString();
}

async function main(): Promise<void> {
  const live = wantExecute();
  const appId = Number(arg("--app") || process.env.ARCRON_APP_ID || DEFAULT_APP);
  const algod = algodClient();
  const params = await algod.getTransactionParams().do();
  const genesisId = String(params.genesisID ?? params.genesisId ?? "");
  assertTestNetGenesis(genesisId);
  const round = BigInt(params.firstValid ?? params.firstRoundValid ?? 0);
  console.log("network  TestNet " + genesisId);
  console.log("algod    " + (process.env.ALGOD_URL || DEFAULT_URL));
  console.log("app      " + appId);
  console.log("round    " + fmt(round));
  console.log("mode     " + (live ? "execute" : "dry-run (signs nothing)"));
  console.log("fee      EXECUTE_FEE=" + EXECUTE_FEE + " uALGO (+1000 if ASA opted in)");
  console.log("");

  const ranked = rank(await listUpkeeps(algod, appId), round);
  if (ranked.length === 0) {
    console.log("No upkeep boxes decoded.");
    return;
  }

  const due = ranked.filter((r) => r.executable);
  const skipped = ranked.filter((r) => r.skipped);
  const waiting = ranked.filter((r) => !r.executable && !r.skipped);

  const line = (r: (typeof ranked)[number]) => {
    const u = r.upkeep;
    const tag = r.skipped ? "SKIP" : r.executable ? "DUE " : "WAIT";
    const extra = r.reason ? " " + r.reason : "";
    return tag + " id=" + u.id + " target=" + u.targetApp + " fee=" + r.fee + " next=" + u.nextExecutionRound + extra;
  };
  for (const r of ranked) console.log(line(r));
  console.log("");
  console.log("counts  due=" + due.length + " skipped=" + skipped.length + " waiting=" + waiting.length + " total=" + ranked.length);

  if (!live) {
    console.log("dry-run: would call package execute() on due ids [" + due.map((r) => r.upkeep.id).join(", ") + "]");
    console.log("dry-run: no signer loaded, no transaction submitted.");
    return;
  }

  const mnemonic = process.env.KEEPER_MNEMONIC;
  if (!mnemonic) {
    throw new Error("--execute needs KEEPER_MNEMONIC in the environment. Dispenser-funded throwaway only. Never commit it.");
  }
  const account = algosdk.mnemonicToSecretKey(mnemonic.trim());
  const sender = account.addr.toString();
  const signer = algosdk.makeBasicAccountTransactionSigner(account);
  if (due.length === 0) {
    console.log("nothing executable");
    return;
  }
  for (const r of due) {
    const u: Upkeep = r.upkeep;
    console.log("execute id=" + u.id + " ...");
    const result = await execute(algod, appId, { sender, signer }, u);
    console.log("  tx=" + result.txId + " round=" + result.confirmedRound);
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
