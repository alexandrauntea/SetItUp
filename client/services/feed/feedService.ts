import type { FeedPage, FeedRequest } from "@/types/feed";

export type GetFeed = (request: FeedRequest) => Promise<FeedPage>;

export const FEED_DEFAULT_PAGE_SIZE = 20;
export const FEED_PREFERRED_PROFILE_RATIO = 0.8;
export const FEED_RANDOM_PROFILE_RATIO = 0.2;
