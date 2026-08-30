export const SKIP_UPKEEP_IDS: ReadonlySet<bigint> = new Set([81n]);
export const SKIP_TARGET_APPS: ReadonlySet<bigint> = new Set([770041460n]);

export function shouldSkip(upkeep: { id: bigint; targetApp: bigint }): boolean {
  return SKIP_UPKEEP_IDS.has(upkeep.id) || SKIP_TARGET_APPS.has(upkeep.targetApp);
}

export function skipReason(upkeep: { id: bigint; targetApp: bigint }): string | null {
  if (SKIP_UPKEEP_IDS.has(upkeep.id)) return "skip list: upkeep 81";
  if (SKIP_TARGET_APPS.has(upkeep.targetApp)) return "skip list: target app 770041460";
  return null;
}
