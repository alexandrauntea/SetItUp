import {
  createManagerRequestId,
  createMatchId,
  createPairId,
  createReactionId,
} from "@/services/social/socialIds";

describe("identificatorii sociali", () => {
  test("creează același pairId indiferent de ordine", () => {
    expect(createPairId("uid-b", "uid-a")).toBe("uid-a_uid-b");
    expect(createPairId("uid-a", "uid-b")).toBe("uid-a_uid-b");
  });

  test("folosește ownerul drept ID pentru cererea de manager", () => {
    expect(createManagerRequestId("owner-id")).toBe("owner-id");
  });

  test("păstrează direcția unei reacții", () => {
    expect(createReactionId("owner-id", "target-id")).toBe(
      "owner-id_target-id",
    );
    expect(createReactionId("target-id", "owner-id")).toBe(
      "target-id_owner-id",
    );
  });

  test("creează același matchId indiferent de ordine", () => {
    expect(createMatchId("uid-b", "uid-a")).toBe("uid-a_uid-b");
    expect(createMatchId("uid-a", "uid-b")).toBe("uid-a_uid-b");
  });
});
