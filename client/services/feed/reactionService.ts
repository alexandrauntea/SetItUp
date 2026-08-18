import type { Match, Reaction, SaveReactionInput } from "@/types/feed";

export interface SaveReactionResult {
  reaction: Reaction;
  match: Match | null;
}

export type SaveReaction = (
  input: SaveReactionInput,
) => Promise<SaveReactionResult>;

export const DISLIKE_COOLDOWN_DAYS = 30;
