import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";

import { ProfileImage } from "@/components/ProfileImage";

jest.mock("expo-image", () => ({
  Image: jest.requireActual("react-native").Image,
}));

jest.mock("@expo/vector-icons", () => ({
  Ionicons: jest.requireActual("react-native").Text,
}));

describe("ProfileImage", () => {
  test("afișează inițialele când fotografia lipsește", async () => {
    await render(<ProfileImage name="Anca Popescu" />);

    expect(screen.getByText("AP")).toBeTruthy();
  });

  test("afișează fotografia și starea de încărcare", async () => {
    await render(
      <ProfileImage name="Anca Popescu" testID="avatar" uri="https://example.com/photo.jpg" />,
    );

    const image = screen.getByLabelText("Fotografia lui Anca Popescu");
    expect(screen.getByLabelText("Se încarcă fotografia de profil")).toBeTruthy();
    fireEvent(image, "onLoad");
    await waitFor(() =>
      expect(screen.queryByLabelText("Se încarcă fotografia de profil")).toBeNull(),
    );
  });

  test("revine la inițiale dacă fotografia nu poate fi încărcată", async () => {
    await render(
      <ProfileImage name="Anca Popescu" uri="https://example.com/missing.jpg" />,
    );

    fireEvent(screen.getByLabelText("Fotografia lui Anca Popescu"), "onError");
    expect(await screen.findByText("AP")).toBeTruthy();
  });
});
