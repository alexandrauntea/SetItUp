import { auth, db } from "@/services/firebase";
import type { Match } from "@/types/feed";
import type { ManagerRelationship } from "@/types/social";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";

export type ListMatches = (userId: string) => Promise<Match[]>;

const MATCHES_COLLECTION = "matches";
const MANAGER_RELATIONSHIPS_COLLECTION = "managerRelationships";

function asMatch(documentId: string, value: unknown, ownerId: string): Match {
  if (!value || typeof value !== "object") {
    throw new Error("INVALID_MATCH_DATA");
  }

  const data = value as Partial<Match>;
  if (
    !Array.isArray(data.memberIds) ||
    data.memberIds.length !== 2 ||
    !data.memberIds.every((uid) => typeof uid === "string" && uid.length > 0) ||
    new Set(data.memberIds).size !== 2 ||
    !data.memberIds.includes(ownerId) ||
    typeof data.createdAt !== "string" ||
    Number.isNaN(Date.parse(data.createdAt))
  ) {
    throw new Error("INVALID_MATCH_DATA");
  }

  return {
    id: documentId,
    memberIds: data.memberIds as [string, string],
    createdAt: data.createdAt,
  };
}

/** Listează match-urile ownerului numai pentru managerul său autentificat. */
export const listMatches: ListMatches = async (ownerId) => {
  if (!ownerId.trim()) {
    throw new Error("INVALID_MATCH_OWNER");
  }

  const actorId = auth.currentUser?.uid;
  if (!actorId) {
    throw new Error("AUTH_REQUIRED");
  }

  const relationshipSnapshot = await getDoc(
    doc(db, MANAGER_RELATIONSHIPS_COLLECTION, ownerId),
  );
  if (!relationshipSnapshot.exists()) {
    throw new Error("OWNER_HAS_NO_MANAGER");
  }

  const relationship = relationshipSnapshot.data() as ManagerRelationship;
  if (relationship.managerId !== actorId) {
    throw new Error("MATCHES_MANAGER_ONLY");
  }

  const matchesSnapshot = await getDocs(
    query(
      collection(db, MATCHES_COLLECTION),
      where("memberIds", "array-contains", ownerId),
    ),
  );

  return matchesSnapshot.docs
    .map((matchDocument) =>
      asMatch(matchDocument.id, matchDocument.data(), ownerId),
    )
    .sort((first, second) => second.createdAt.localeCompare(first.createdAt));
};
