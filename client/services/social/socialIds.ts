export function createPairId(uidA: string, uidB: string): string {
  return [uidA, uidB].sort().join("_");
}

export function createManagerRequestId(
  ownerId: string,
  managerId: string
): string {
  return `${ownerId}_${managerId}`;
}