import { FeedItem } from "@/types/feed";
import { fireEvent, render, screen } from "@testing-library/react-native";
import React from "react";
import { FeedCard } from "../FeedCard";

describe("FeedCard Component", () => {
  const sampleItem: FeedItem = {
    profile: {
      uid: "user1",
      username: "alex_popa",
      firstName: "Alex",
      lastName: "Popa",
      occupation: "Inginer Software",
      gender: "male",
      description: "Pasionat de drumeții și tehnologie.",
      interests: ["Fotbal", "Muzică", "Gaming"],
      age: 27,
    },
    isPreferred: true,
  };

  it("renders candidate profile details correctly", async () => {
    await render(
      <FeedCard item={sampleItem} onDislike={jest.fn()} onLike={jest.fn()} />
    );

    expect(screen.getByText("Alex Popa, 27")).toBeTruthy();
    expect(screen.getByText("@alex_popa")).toBeTruthy();
    expect(screen.getByText("Inginer Software")).toBeTruthy();
    expect(screen.getByText("Pasionat de drumeții și tehnologie.")).toBeTruthy();
    expect(screen.getByText("#Fotbal")).toBeTruthy();
    expect(screen.getByText("#Muzică")).toBeTruthy();
    expect(screen.getByText("#Gaming")).toBeTruthy();
  });

  it("calls onLike when like button is pressed", async () => {
    const onLikeMock = jest.fn();
    await render(
      <FeedCard item={sampleItem} onDislike={jest.fn()} onLike={onLikeMock} />
    );

    fireEvent.press(screen.getByTestId("like-button"));
    expect(onLikeMock).toHaveBeenCalledTimes(1);
  });

  it("calls onDislike when dislike button is pressed", async () => {
    const onDislikeMock = jest.fn();
    await render(
      <FeedCard item={sampleItem} onDislike={onDislikeMock} onLike={jest.fn()} />
    );

    fireEvent.press(screen.getByTestId("dislike-button"));
    expect(onDislikeMock).toHaveBeenCalledTimes(1);
  });
});
