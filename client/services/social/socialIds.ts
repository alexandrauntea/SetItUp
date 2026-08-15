export function createPairId(uidA: string, uidB: string): string {
  return [uidA, uidB].sort().join("_");
}

export function createManagerRequestId(ownerId: string): string {
  return ownerId;
}
