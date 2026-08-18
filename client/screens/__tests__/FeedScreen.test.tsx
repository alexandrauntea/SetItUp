import { useAuth } from "@/contexts/AuthContext";
import {
  dislikeProfile,
  getFeedProfiles,
  getManagedOwnerForManager,
  likeProfile,
} from "@/services/social/feedService";
import { FeedItem } from "@/types/feed";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import React from "react";
import { FeedScreen } from "../FeedScreen";

jest.mock("@/contexts/AuthContext", () => ({
  useAuth: jest.fn(),
}));

jest.mock("@/services/social/feedService", () => ({
  getManagedOwnerForManager: jest.fn(),
  getFeedProfiles: jest.fn(),
  likeProfile: jest.fn(),
  dislikeProfile: jest.fn(),
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockGetManagedOwnerForManager = getManagedOwnerForManager as jest.MockedFunction<
  typeof getManagedOwnerForManager
>;
const mockGetFeedProfiles = getFeedProfiles as jest.MockedFunction<
  typeof getFeedProfiles
>;
const mockLikeProfile = likeProfile as jest.MockedFunction<typeof likeProfile>;

describe("FeedScreen", () => {
  const sampleFeedItem: FeedItem = {
    profile: {
      uid: "cand1",
      username: "cand1_user",
      firstName: "Maria",
      lastName: "Pop",
      occupation: "Doctor",
      gender: "female",
      description: "Pasionată de călătorii",
      interests: ["Travel"],
      age: 26,
    },
    commonFriendsCount: 2,
    isPreferred: true,
  };

  beforeEach(() => {
    jest.resetAllMocks();
    mockUseAuth.mockReturnValue({
      user: { uid: "mgr1" } as any,
      isLoading: false,
    });
  });

  it("renders non-manager container when user is not a manager", async () => {
    mockGetManagedOwnerForManager.mockResolvedValueOnce(null);

    await render(<FeedScreen />);

    await waitFor(() => {
      expect(screen.getByTestId("feed-not-manager-container")).toBeTruthy();
    });

    expect(
      screen.getByText("Momentan nu ești manager pentru niciun utilizator. Un owner trebuie să te desemneze drept manager pentru a accesa feedul.")
    ).toBeTruthy();
  });

  it("renders error state with retry button when fetching feed fails, and retries on press", async () => {
    mockGetManagedOwnerForManager.mockResolvedValue({
      ownerId: "owner1",
      ownerUsername: "owner_user",
      managerId: "mgr1",
      managerUsername: "mgr_user",
      memberIds: ["owner1", "mgr1"],
      createdAt: "2026-08-01",
    });

    mockGetFeedProfiles.mockRejectedValueOnce(new Error("Network Error"));

    await render(<FeedScreen />);

    await waitFor(() => {
      expect(screen.getByTestId("feed-error-container")).toBeTruthy();
    });

    expect(screen.getByText("A apărut o eroare")).toBeTruthy();

    // Retry
    mockGetFeedProfiles.mockResolvedValueOnce([sampleFeedItem]);
    fireEvent.press(screen.getByText("Încearcă din nou"));

    await waitFor(() => {
      expect(screen.getByTestId("feed-card-wrapper")).toBeTruthy();
    });

    expect(screen.getByText("Maria Pop, 26")).toBeTruthy();
  });

  it("renders empty feed container when feed list is empty", async () => {
    mockGetManagedOwnerForManager.mockResolvedValueOnce({
      ownerId: "owner1",
      ownerUsername: "owner_user",
      managerId: "mgr1",
      managerUsername: "mgr_user",
      memberIds: ["owner1", "mgr1"],
      createdAt: "2026-08-01",
    });

    mockGetFeedProfiles.mockResolvedValueOnce([]);

    await render(<FeedScreen />);

    await waitFor(() => {
      expect(screen.getByTestId("feed-empty-container")).toBeTruthy();
    });

    expect(screen.getByText("Nu mai sunt profiluri")).toBeTruthy();
  });

  it("renders candidate card and opens MatchModal on mutual like", async () => {
    mockGetManagedOwnerForManager.mockResolvedValue({
      ownerId: "owner1",
      ownerUsername: "owner_user",
      managerId: "mgr1",
      managerUsername: "mgr_user",
      memberIds: ["owner1", "mgr1"],
      createdAt: "2026-08-01",
    });

    mockGetFeedProfiles.mockResolvedValueOnce([sampleFeedItem]);
    mockLikeProfile.mockResolvedValueOnce({
      isMatch: true,
      matchedProfile: sampleFeedItem.profile,
    });

    await render(<FeedScreen />);

    await waitFor(() => {
      expect(screen.getByTestId("feed-card-wrapper")).toBeTruthy();
    });

    expect(screen.getByText("Maria Pop, 26")).toBeTruthy();

    await act(async () => {
      fireEvent.press(screen.getByTestId("like-button"));
    });

    await waitFor(() => {
      expect(screen.getByTestId("match-modal-container")).toBeTruthy();
    });

    expect(screen.getByText("Este match!")).toBeTruthy();
    expect(screen.getByText("Ai găsit o potrivire potrivită pentru @owner_user!")).toBeTruthy();
  });
});