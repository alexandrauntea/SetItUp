import { FeedCandidateProfile } from "@/types/feed";
import { fireEvent, render, screen } from "@testing-library/react-native";
import React from "react";
import { MatchModal } from "../MatchModal";

describe("MatchModal Component", () => {
  const matchedCandidate: FeedCandidateProfile = {
    uid: "candidate123",
    username: "elena_v",
    firstName: "Elena",
    lastName: "Vasilescu",
    occupation: "Arhitect",
    gender: "female",
    description: "Design lover",
    interests: ["Arhitectură"],
    age: 26,
  };

  it("renders match title and candidate info when visible", async () => {
    await render(
      <MatchModal
        visible={true}
        matchedProfile={matchedCandidate}
        ownerUsername="andrei_p"
        onClose={jest.fn()}
      />
    );

    expect(screen.getByTestId("match-modal-container")).toBeTruthy();
    expect(screen.getByText("Este match!")).toBeTruthy();
    expect(screen.getByText("Ai găsit o potrivire potrivită pentru @andrei_p!")).toBeTruthy();
    expect(screen.getByText("Elena Vasilescu")).toBeTruthy();
    expect(screen.getByText("@elena_v")).toBeTruthy();
  });

  it("calls onClose when close button is pressed", async () => {
    const onCloseMock = jest.fn();
    await render(
      <MatchModal
        visible={true}
        matchedProfile={matchedCandidate}
        onClose={onCloseMock}
      />
    );

    fireEvent.press(screen.getByTestId("match-close-button"));
    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });
});