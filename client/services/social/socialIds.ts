export function createPairId(uidA: string, uidB: string): string {
  return [uidA, uidB].sort().join("_");
}

export function createManagerRequestId(ownerId: string): string {
  return ownerId;
}

export function createReactionId(ownerId: string, targetId: string): string {
  return `${ownerId}_${targetId}`;
}

export function createMatchId(uidA: string, uidB: string): string {
  return createPairId(uidA, uidB);
}
