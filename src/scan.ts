import algosdk from "algosdk";
import {
  decodeUpkeep,
  upkeepIdFromBoxName,
  isExecutable,
  effectiveFee,
  type Upkeep,
} from "@corvidlabs/arcron";
import { shouldSkip, skipReason } from "./skip";

export type Ranked = {
  upkeep: Upkeep;
  executable: boolean;
  skipped: boolean;
  reason: string | null;
  fee: bigint;
};

function boxNameBytes(name: Uint8Array | string): Uint8Array {
  if (typeof name === "string") return new Uint8Array(Buffer.from(name, "base64"));
  return name;
}

export async function listUpkeeps(algod: algosdk.Algodv2, appId: number): Promise<Upkeep[]> {
  const upkeeps: Upkeep[] = [];
  let next: string | undefined;
  do {
    let req = algod.getApplicationBoxes(appId).limit(100);
    if (next) req = req.next(next);
    const page = await req.do();
    const boxes = page.boxes ?? [];
    for (const box of boxes) {
      const name = boxNameBytes(box.name as Uint8Array | string);
      const id = upkeepIdFromBoxName(name);
      if (id === null) continue;
      const raw = await algod.getApplicationBoxByName(appId, name).do();
      const value = raw.value instanceof Uint8Array ? raw.value : new Uint8Array(raw.value);
      try {
        upkeeps.push(decodeUpkeep(id, value));
      } catch (err) {
        console.error("decode failed for upkeep " + id + ": " + (err instanceof Error ? err.message : err));
      }
    }
    next = page.nextToken || page.next || undefined;
  } while (next);
  return upkeeps;
}

export function rank(upkeeps: readonly Upkeep[], currentRound: bigint): Ranked[] {
  return upkeeps.map((upkeep) => {
    const reason = skipReason(upkeep);
    const skipped = reason !== null || shouldSkip(upkeep);
    const fee = effectiveFee(upkeep, currentRound);
    return {
      upkeep,
      skipped,
      reason,
      fee,
      executable: !skipped && isExecutable(upkeep, currentRound),
    };
  });
}
