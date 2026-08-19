import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import React from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { preferencesService } from "../../../services/preferencesService";
import FeedFiltersScreen from "../filters";

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
  useNavigation: () => ({ goBack: jest.fn() }),
}));

jest.mock("../../../contexts/AuthContext", () => ({
  useAuth: jest.fn(),
}));

jest.mock("firebase/firestore", () => ({}));
jest.mock("../../../services/firebase", () => ({ db: {} }));

jest.mock("../../../services/preferencesService", () => ({
  preferencesService: {
    getOwnerPreferences: jest.fn(),
    saveOwnerPreferences: jest.fn(),
  },
  validatePreferences: jest.fn((prefs) => {
    const min = Number(prefs?.minAge);
    const max = Number(prefs?.maxAge);
    if (isNaN(min) || isNaN(max)) {
      return "Vârsta minimă și vârsta maximă trebuie să fie numere valide.";
    }
    if (min < 18) {
      return "Vârsta minimă trebuie să fie de cel puțin 18 ani.";
    }
    if (max < min) {
      return "Vârsta maximă nu poate fi mai mică decât vârsta minimă.";
    }
    if (max > 100) {
      return "Vârsta maximă nu poate depăși 100 de ani.";
    }
    return null;
  }),
}));

describe("FeedFiltersScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({
      user: { uid: "owner123" },
      loading: false,
    });
    (preferencesService.getOwnerPreferences as jest.Mock).mockResolvedValue({
      minAge: 20,
      maxAge: 30,
      genderPreference: "everyone",
      interests: ["music", "travel"],
    });
    (preferencesService.saveOwnerPreferences as jest.Mock).mockImplementation(
      async () => undefined,
    );
  });

  it("loads and displays initial preferences", async () => {
    (preferencesService.getOwnerPreferences as jest.Mock).mockResolvedValue({
      minAge: 25,
      maxAge: 40,
      genderPreference: "female",
      interests: ["music", "travel"],
    });

    const screen = await render(<FeedFiltersScreen />);

    await waitFor(() => {
      expect(screen.getByTestId("min-age-input").props.value).toBe("25");
      expect(screen.getByTestId("max-age-input").props.value).toBe("40");
      expect(screen.getByTestId("interests-input").props.value).toBe("music, travel");
    });
  });

  it("displays validation error if minAge is less than 18", async () => {
    const screen = await render(<FeedFiltersScreen />);

    await waitFor(() => {
      expect(screen.getByTestId("min-age-input").props.value).toBe("20");
    });

    fireEvent.changeText(screen.getByTestId("min-age-input"), "15");
    await waitFor(() => {
      expect(screen.getByTestId("min-age-input").props.value).toBe("15");
    });
    await act(async () => {
      fireEvent.press(screen.getByTestId("save-button"));
    });

    await waitFor(() => {
      expect(
        screen.getByText("Vârsta minimă trebuie să fie de cel puțin 18 ani.")
      ).toBeTruthy();
    });
    expect(preferencesService.saveOwnerPreferences).not.toHaveBeenCalled();
  });

  it("calls saveOwnerPreferences when form is valid and submitted", async () => {
    const screen = await render(<FeedFiltersScreen />);

    await waitFor(() => {
      expect(screen.getByTestId("min-age-input").props.value).toBe("20");
    });

    fireEvent.changeText(screen.getByTestId("min-age-input"), "22");
    fireEvent.changeText(screen.getByTestId("max-age-input"), "35");
    fireEvent.changeText(screen.getByTestId("interests-input"), "gaming, tech");
    await waitFor(() => {
      expect(screen.getByTestId("min-age-input").props.value).toBe("22");
      expect(screen.getByTestId("max-age-input").props.value).toBe("35");
      expect(screen.getByTestId("interests-input").props.value).toBe("gaming, tech");
    });
    await act(async () => {
      fireEvent.press(screen.getByTestId("save-button"));
    });

    await waitFor(() => {
      expect(preferencesService.saveOwnerPreferences).toHaveBeenCalledWith(
        "owner123",
        {
          minAge: 22,
          maxAge: 35,
          genderPreference: "everyone",
          interests: ["gaming", "tech"],
        }
      );
    });
  });
});
