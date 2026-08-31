/** Decode the 224-byte RainRec box on TestNet hub 770130162. */
export const REC_SIZE = 224;
export const SEED_WINDOW = 800;
export const DEFAULT_HUB = 770130162;

export type RainRec = {
  id: bigint;
  label: string;
  prizeAsset: bigint;
  drip: bigint;
  interval: bigint;
  lastRainRound: bigint;
  pot: bigint;
  tickets: bigint;
  drawId: bigint;
  cumulative: bigint;
  mode: bigint;
  waveCap: bigint;
  waveCount: bigint;
  lastShare: bigint;
  lastWaveId: bigint;
  waveUnclaimed: bigint;
  commitRound: bigint;
  prizeLocked: bigint;
};

function u64(raw: Uint8Array, off: number): bigint {
  const view = new DataView(raw.buffer, raw.byteOffset + off, 8);
  return view.getBigUint64(0, false);
}

export function boxKey(id: bigint): Uint8Array {
  const key = new Uint8Array(9);
  key[0] = 114; // r
  new DataView(key.buffer).setBigUint64(1, id, false);
  return key;
}

export function parseBoxKey(name: Uint8Array): bigint | null {
  if (name.length !== 9 || name[0] !== 114) return null;
  return new DataView(name.buffer, name.byteOffset + 1, 8).getBigUint64(0, false);
}

function labelOf(chunk: Uint8Array): string {
  let n = chunk.length;
  for (let i = 0; i < chunk.length; i++) {
    if (chunk[i] === 0) {
      n = i;
      break;
    }
  }
  return new TextDecoder().decode(chunk.subarray(0, n));
}

export function decodeRain(id: bigint, raw: Uint8Array): RainRec {
  if (raw.length < REC_SIZE) {
    throw new Error("rain " + id + ": short RainRec len=" + raw.length + " want>=" + REC_SIZE);
  }
  return {
    id,
    label: labelOf(raw.subarray(64, 96)),
    prizeAsset: u64(raw, 96),
    drip: u64(raw, 104),
    interval: u64(raw, 112),
    lastRainRound: u64(raw, 120),
    pot: u64(raw, 128),
    tickets: u64(raw, 136),
    drawId: u64(raw, 144),
    cumulative: u64(raw, 152),
    mode: u64(raw, 160),
    waveCap: u64(raw, 168),
    waveCount: u64(raw, 176),
    lastShare: u64(raw, 184),
    lastWaveId: u64(raw, 192),
    waveUnclaimed: u64(raw, 200),
    commitRound: u64(raw, 208),
    prizeLocked: u64(raw, 216),
  };
}

export function modeName(mode: bigint): string {
  if (mode === 0n) return "SPLIT";
  if (mode === 1n) return "ONE";
  if (mode === 2n) return "WAVE";
  return mode.toString();
}

/** Status at lastRound. Only ONE with prize_locked uses the 800-round window. */
export function rainStatus(rec: RainRec, lastRound: bigint): string {
  if (rec.mode === 1n && rec.prizeLocked > 0n) {
    if (lastRound <= rec.commitRound) return "drawn-waiting-resolve";
    if (lastRound <= rec.commitRound + BigInt(SEED_WINDOW)) return "resolve-window remaining";
    return "abandonable";
  }
  return "open";
}
