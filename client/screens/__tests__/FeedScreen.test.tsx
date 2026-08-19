import { useAuth } from "@/contexts/AuthContext";
import { getFeed } from "@/services/feed/feedService";
import { saveReaction } from "@/services/feed/reactionService";
import { getManagedProfiles } from "@/services/social/managerService";
import { getPublicProfileByUid } from "@/services/social/userSearchService";
import type { FeedProfile } from "@/types/feed";
import type { ManagerRelationship } from "@/types/social";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import React from "react";
import { FeedScreen } from "../FeedScreen";

jest.mock("@/contexts/AuthContext", () => ({
  useAuth: jest.fn(),
}));

jest.mock("@/services/feed/feedService", () => ({
  getFeed: jest.fn(),
}));

jest.mock("@/services/feed/reactionService", () => ({
  saveReaction: jest.fn(),
}));

jest.mock("@/services/social/managerService", () => ({
  getManagedProfiles: jest.fn(),
}));

jest.mock("@/services/social/userSearchService", () => ({
  getPublicProfileByUid: jest.fn(),
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockGetManagedProfiles = getManagedProfiles as jest.MockedFunction<
  typeof getManagedProfiles
>;
const mockGetFeed = getFeed as jest.MockedFunction<typeof getFeed>;
const mockSaveReaction = saveReaction as jest.MockedFunction<typeof saveReaction>;
const mockGetPublicProfileByUid = getPublicProfileByUid as jest.MockedFunction<
  typeof getPublicProfileByUid
>;

const relationship: ManagerRelationship = {
  ownerId: "owner1",
  ownerUsername: "owner_user",
  managerId: "mgr1",
  managerUsername: "mgr_user",
  memberIds: ["owner1", "mgr1"],
  createdAt: "2026-08-01",
};

const sampleFeedProfile: FeedProfile = {
  uid: "cand1",
  username: "cand1_user",
  firstName: "Maria",
  lastName: "Pop",
  occupation: "Doctor",
  gender: "female",
  description: "Pasionată de călătorii",
  interests: ["Travel"],
  age: 26,
  isPrivate: false,
  updatedAt: "2026-08-19T12:00:00.000Z",
  mutualFriendsCount: 2,
  matchesPreferences: true,
};

describe("FeedScreen", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockGetManagedProfiles.mockReset();
    mockGetFeed.mockReset();
    mockSaveReaction.mockReset();
    mockGetPublicProfileByUid.mockReset();
    mockUseAuth.mockReturnValue({
      user: { uid: "mgr1" } as any,
      isLoading: false,
      isAuthenticated: true,
    });
  });

  it("renders non-manager container when user is not a manager", async () => {
    mockGetManagedProfiles.mockResolvedValueOnce([]);

    await render(<FeedScreen />);

    await waitFor(() => {
      expect(screen.getByTestId("feed-not-manager-container")).toBeTruthy();
    });
  });

  it("renders error state with retry button and retries", async () => {
    mockGetManagedProfiles.mockResolvedValue([relationship]);
    mockGetFeed.mockRejectedValueOnce(new Error("Network Error"));

    await render(<FeedScreen />);

    await waitFor(() => {
      expect(screen.getByTestId("feed-error-container")).toBeTruthy();
    });

    mockGetFeed.mockResolvedValueOnce({
      profiles: [sampleFeedProfile],
      nextCursor: null,
    });
    fireEvent.press(screen.getByText("Încearcă din nou"));

    await waitFor(() => {
      expect(screen.getByTestId("feed-card-wrapper")).toBeTruthy();
    });
  });

  it("renders empty feed container when feed list is empty", async () => {
    mockGetManagedProfiles.mockResolvedValue([relationship]);
    mockGetFeed.mockResolvedValueOnce({ profiles: [], nextCursor: null });

    await render(<FeedScreen />);

    await waitFor(() => {
      expect(screen.getByTestId("feed-empty-container")).toBeTruthy();
    });
  });

  it("renders owner private warning banner when managed owner profile is private", async () => {
    mockGetManagedProfiles.mockResolvedValue([relationship]);
    mockGetPublicProfileByUid.mockResolvedValueOnce({
      uid: "owner1",
      username: "owner_user",
      firstName: "Ion",
      lastName: "Popa",
      occupation: "Inginer",
      gender: "male",
      description: "Test",
      interests: ["Tech"],
      age: 30,
      isPrivate: true,
      updatedAt: "2026-08-01",
    });
    mockGetFeed.mockResolvedValueOnce({ profiles: [], nextCursor: null });

    await render(<FeedScreen />);

    await waitFor(() => {
      expect(screen.getByTestId("feed-owner-private-warning")).toBeTruthy();
    });

    expect(
      screen.getByText(
        "Ownerul contului (@owner_user) are profilul privat, deci nu va apărea în feed-ul altor utilizatori."
      )
    ).toBeTruthy();
  });

  it("renders candidate card and opens MatchModal on mutual like", async () => {
    mockGetManagedProfiles.mockResolvedValue([relationship]);
    mockGetFeed.mockResolvedValueOnce({
      profiles: [sampleFeedProfile],
      nextCursor: null,
    });
    mockSaveReaction.mockResolvedValueOnce({
      reaction: {
        id: "owner1_cand1",
        ownerId: "owner1",
        targetId: "cand1",
        actorId: "mgr1",
        actorRole: "manager",
        value: "like",
        createdAt: "2026-08-19T12:00:00.000Z",
        updatedAt: "2026-08-19T12:00:00.000Z",
      },
      match: {
        id: "cand1_owner1",
        memberIds: ["cand1", "owner1"],
        createdAt: "2026-08-19T12:00:00.000Z",
      },
    });

    await render(<FeedScreen />);

    await waitFor(() => {
      expect(screen.getByText("Maria Pop, 26")).toBeTruthy();
    });

    await act(async () => {
      fireEvent.press(screen.getByTestId("like-button"));
    });

    await waitFor(() => {
      expect(screen.getByTestId("match-modal-container")).toBeTruthy();
    });
    expect(mockSaveReaction).toHaveBeenCalledWith({
      ownerId: "owner1",
      actorId: "mgr1",
      targetId: "cand1",
      value: "like",
    });
  });
});
