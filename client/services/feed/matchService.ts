import type { Match } from "@/types/feed";

export type ListMatches = (userId: string) => Promise<Match[]>;
