import { db } from "@/services/firebase";
import { createMatchId, createReactionId } from "@/services/social/socialIds";
import type { Match, Reaction, SaveReactionInput } from "@/types/feed";
import type { ManagerRelationship, ManagerRole } from "@/types/social";
import { doc, runTransaction } from "firebase/firestore";

export interface SaveReactionResult {
  reaction: Reaction;
  match: Match | null;
}

export type SaveReaction = (
  input: SaveReactionInput,
) => Promise<SaveReactionResult>;

export const DISLIKE_COOLDOWN_DAYS = 30;

const REACTIONS_COLLECTION = "reactions";
const MATCHES_COLLECTION = "matches";
const CONVERSATIONS_COLLECTION = "conversations";
const MANAGER_RELATIONSHIPS_COLLECTION = "managerRelationships";
const MANAGER_ROLES_COLLECTION = "managerRoles";
const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1_000;

function validateInput(input: SaveReactionInput): void {
  if (
    !input.ownerId.trim() ||
    !input.actorId.trim() ||
    !input.targetId.trim() ||
    !["like", "dislike"].includes(input.value)
  ) {
    throw new Error("INVALID_REACTION_INPUT");
  }

  if (input.ownerId === input.targetId) {
    throw new Error("CANNOT_REACT_TO_SELF");
  }
}

function isExpiredDislike(reaction: Reaction, now: number): boolean {
  return (
    reaction.value === "dislike" &&
    Boolean(reaction.expiresAt) &&
    Date.parse(reaction.expiresAt!) <= now
  );
}

function sortedMembers(uidA: string, uidB: string): [string, string] {
  return [uidA, uidB].sort() as [string, string];
}

/**
 * Salvează reacția ownerului în numele căruia lucrează managerul.
 *
 * ID-urile deterministe și tranzacția fac operația idempotentă: două apăsări
 * identice nu creează documente suplimentare, iar două like-uri reciproce nu
 * pot crea mai mult de un match. Reacția opusă este folosită doar în interiorul
 * serviciului și nu este returnată către interfață.
 */
export const saveReaction: SaveReaction = async (
  input,
): Promise<SaveReactionResult> => {
  validateInput(input);

  const reactionId = createReactionId(input.ownerId, input.targetId);
  const reverseReactionId = createReactionId(input.targetId, input.ownerId);
  const matchId = createMatchId(input.ownerId, input.targetId);
  const reactionRef = doc(db, REACTIONS_COLLECTION, reactionId);
  const reverseReactionRef = doc(db, REACTIONS_COLLECTION, reverseReactionId);
  const matchRef = doc(db, MATCHES_COLLECTION, matchId);
  const convRef = doc(db, CONVERSATIONS_COLLECTION, matchId);
  const ownerRelationshipRef = doc(
    db,
    MANAGER_RELATIONSHIPS_COLLECTION,
    input.ownerId,
  );
  const targetRoleRef = doc(
    db,
    MANAGER_ROLES_COLLECTION,
    input.targetId,
  );
  const now = Date.now();
  const nowIso = new Date(now).toISOString();

  return runTransaction(db, async (transaction) => {
    const [
      ownerRelationshipSnapshot,
      targetRoleSnapshot,
      reactionSnapshot,
      reverseReactionSnapshot,
      matchSnapshot,
    ] = await Promise.all([
      transaction.get(ownerRelationshipRef),
      transaction.get(targetRoleRef),
      transaction.get(reactionRef),
      transaction.get(reverseReactionRef),
      transaction.get(matchRef),
    ]);

    if (!ownerRelationshipSnapshot.exists()) {
      throw new Error("OWNER_HAS_NO_MANAGER");
    }

    const ownerRelationship =
      ownerRelationshipSnapshot.data() as ManagerRelationship;
    if (ownerRelationship.managerId !== input.actorId) {
      throw new Error("REACTION_MANAGER_ONLY");
    }

    if (!targetRoleSnapshot.exists()) {
      throw new Error("TARGET_HAS_NO_MANAGER");
    }

    const targetRole = targetRoleSnapshot.data() as ManagerRole;
    if (targetRole.role !== "owner") {
      throw new Error("TARGET_HAS_NO_MANAGER");
    }
    if (targetRole.counterpartId === input.actorId) {
      throw new Error("SAME_MANAGER_NOT_ALLOWED");
    }

    const currentMatch = matchSnapshot.exists()
      ? ({ ...matchSnapshot.data(), id: matchId } as Match)
      : null;
    const existingReaction = reactionSnapshot.exists()
      ? ({ ...reactionSnapshot.data(), id: reactionId } as Reaction)
      : null;
    const existingReactionIsActive =
      existingReaction !== null && !isExpiredDislike(existingReaction, now);

    if (existingReactionIsActive) {
      if (existingReaction.value !== input.value) {
        throw new Error("REACTION_ALREADY_RECORDED");
      }

      return {
        reaction: existingReaction,
        match: currentMatch,
      };
    }

    if (currentMatch) {
      throw new Error("PROFILE_ALREADY_MATCHED");
    }

    const reaction: Reaction = {
      id: reactionId,
      ownerId: input.ownerId,
      targetId: input.targetId,
      actorId: input.actorId,
      actorRole: "manager",
      value: input.value,
      createdAt: nowIso,
      updatedAt: nowIso,
      ...(input.value === "dislike"
        ? {
            expiresAt: new Date(
              now + DISLIKE_COOLDOWN_DAYS * DAY_IN_MILLISECONDS,
            ).toISOString(),
          }
        : {}),
    };

    transaction.set(reactionRef, reaction);

    const reverseReaction = reverseReactionSnapshot.exists()
      ? ({
          ...reverseReactionSnapshot.data(),
          id: reverseReactionId,
        } as Reaction)
      : null;
    const isReciprocalLike =
      input.value === "like" && reverseReaction?.value === "like";

    if (!isReciprocalLike) {
      return { reaction, match: null };
    }

    const match: Match = {
      id: matchId,
      memberIds: sortedMembers(input.ownerId, input.targetId),
      createdAt: nowIso,
    };
    transaction.set(matchRef, match);

    transaction.set(convRef, {
      id: matchId,
      matchId,
      memberIds: match.memberIds,
      managerIds: sortedMembers(input.actorId, targetRole.counterpartId),
      blockedBy: null,
      createdAt: nowIso,
      updatedAt: nowIso,
    });

    return { reaction, match };
  });
};
