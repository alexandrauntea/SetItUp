import { fireEvent, render, screen } from "@testing-library/react-native";

import { UserSearchCard } from "@/components/social/UserSearchCard";
import type { UserSearchResult } from "@/types/social";

jest.mock("expo-image", () => ({
  Image: jest.requireActual("react-native").Image,
}));

const publicResult: UserSearchResult = {
  uid: "target-uid",
  username: "anca_21",
  isPrivate: false,
  profile: {
    uid: "target-uid",
    username: "anca_21",
    firstName: "Anca",
    lastName: "Popescu",
    occupation: "Studentă",
    gender: "female",
    description: "Îmi plac muzica și călătoriile.",
    interests: ["Muzică", "Călătorii"],
    age: 21,
    isPrivate: false,
    updatedAt: "2026-08-10T10:00:00.000Z",
  },
  relationshipState: "none",
};

describe("Cardul rezultatului de căutare", () => {
  test("afișează profilul public și permite deschiderea lui", async () => {
    const onOpenProfile = jest.fn();

    await render(
      <UserSearchCard
        result={publicResult}
        isSending={false}
        onSendRequest={jest.fn()}
        onOpenProfile={onOpenProfile}
      />,
    );

    expect(screen.getByText("Anca Popescu")).toBeTruthy();
    expect(screen.getByText("@anca_21")).toBeTruthy();

    fireEvent.press(screen.getByText("Vezi profilul"));
    expect(onOpenProfile).toHaveBeenCalledTimes(1);
  });

  test("trimite cererea când utilizatorii nu au încă o relație", async () => {
    const onSendRequest = jest.fn();

    await render(
      <UserSearchCard
        result={publicResult}
        isSending={false}
        onSendRequest={onSendRequest}
        onOpenProfile={jest.fn()}
      />,
    );

    fireEvent.press(screen.getByText("Trimite cerere"));
    expect(onSendRequest).toHaveBeenCalledTimes(1);
  });

  test("nu expune datele unui profil privat", async () => {
    const privateResult: UserSearchResult = {
      ...publicResult,
      isPrivate: true,
      profile: null,
    };

    await render(
      <UserSearchCard
        result={privateResult}
        isSending={false}
        onSendRequest={jest.fn()}
        onOpenProfile={jest.fn()}
      />,
    );

    expect(screen.getByText("@anca_21")).toBeTruthy();
    expect(screen.getByText("Profil privat")).toBeTruthy();
    expect(screen.queryByText("Anca Popescu")).toBeNull();
    expect(screen.queryByText("Vezi profilul")).toBeNull();
  });

  test.each([
    ["request-sent", "Cerere trimisă"],
    ["request-received", "Ți-a trimis o cerere"],
    ["friends", "Sunteți prieteni"],
  ] as const)(
    "afișează starea %s în locul butonului de trimitere",
    async (relationshipState, label) => {
      await render(
        <UserSearchCard
          result={{ ...publicResult, relationshipState }}
          isSending={false}
          onSendRequest={jest.fn()}
          onOpenProfile={jest.fn()}
        />,
      );

      expect(screen.getByText(label)).toBeTruthy();
      expect(screen.queryByText("Trimite cerere")).toBeNull();
    },
  );
});
