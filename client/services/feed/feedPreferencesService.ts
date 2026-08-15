import type { FeedPreferences } from "@/types/feed";

export type GetFeedPreferences = (
  ownerId: string,
) => Promise<FeedPreferences | null>;

export type SaveFeedPreferences = (
  preferences: FeedPreferences,
) => Promise<void>;
