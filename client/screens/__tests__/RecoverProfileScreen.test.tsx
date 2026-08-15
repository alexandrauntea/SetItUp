import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";

import RecoverProfileScreen from "@/app/profile/recover";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/contexts/ProfileContext";
import { createUserProfile } from "@/services/profileService";

const mockReplace = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

jest.mock("expo-linear-gradient", () => ({
  LinearGradient: require("react-native").View,
}));

jest.mock("@/contexts/AuthContext", () => ({
  useAuth: jest.fn(),
}));

jest.mock("@/contexts/ProfileContext", () => ({
  useProfile: jest.fn(),
}));

jest.mock("@/services/profileService", () => ({
  createUserProfile: jest.fn(),
}));

const mockedUseAuth = jest.mocked(useAuth);
const mockedUseProfile = jest.mocked(useProfile);
const mockedCreateUserProfile = jest.mocked(createUserProfile);
const refreshProfile = jest.fn();

async function completeValidForm() {
  await fireEvent.changeText(
    screen.getByPlaceholderText("De exemplu: andrei21"),
    "  andrei_21  ",
  );
  await fireEvent.changeText(
    screen.getByPlaceholderText("ZZ/LL/AAAA"),
    "02082005",
  );
  await fireEvent.press(screen.getByRole("checkbox"));
}

describe("Ecranul de recuperare a profilului", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseAuth.mockReturnValue({
      user: { uid: "user-123", email: "andrei@email.com" },
    } as never);
    mockedUseProfile.mockReturnValue({ refreshProfile } as never);
    mockedCreateUserProfile.mockResolvedValue({} as never);
    refreshProfile.mockResolvedValue(undefined);
  });

  test("validează numele de utilizator înainte de salvare", async () => {
    await render(<RecoverProfileScreen />);

    await fireEvent.press(screen.getByText("Continuă"));

    expect(
      screen.getByText(
        "Username-ul trebuie să aibă între 3 și 20 de caractere și poate conține litere, cifre și underscore (_).",
      ),
    ).toBeTruthy();
    expect(mockedCreateUserProfile).not.toHaveBeenCalled();
  });

  test("validează data nașterii și acordul GDPR", async () => {
    await render(<RecoverProfileScreen />);

    await fireEvent.changeText(
      screen.getByPlaceholderText("De exemplu: andrei21"),
      "andrei_21",
    );
    await fireEvent.changeText(
      screen.getByPlaceholderText("ZZ/LL/AAAA"),
      "01012020",
    );
    await fireEvent.press(screen.getByText("Continuă"));

    expect(
      screen.getByText(
        "Introdu data în formatul ZZ/LL/AAAA. Trebuie să ai cel puțin 18 ani.",
      ),
    ).toBeTruthy();

    await fireEvent.changeText(
      screen.getByPlaceholderText("ZZ/LL/AAAA"),
      "02082005",
    );
    await fireEvent.press(screen.getByText("Continuă"));

    expect(
      screen.getByText("Trebuie să accepți termenii și politica GDPR."),
    ).toBeTruthy();
    expect(mockedCreateUserProfile).not.toHaveBeenCalled();
  });

  test("oprește recuperarea dacă utilizatorul nu are email", async () => {
    mockedUseAuth.mockReturnValue({
      user: { uid: "user-123", email: null },
    } as never);
    await render(<RecoverProfileScreen />);
    await completeValidForm();

    await fireEvent.press(screen.getByText("Continuă"));

    expect(
      screen.getByText("Contul nu are o adresă de email validă."),
    ).toBeTruthy();
    expect(mockedCreateUserProfile).not.toHaveBeenCalled();
  });

  test("recreează documentul profilului și deschide configurarea", async () => {
    await render(<RecoverProfileScreen />);
    await completeValidForm();

    await fireEvent.press(screen.getByText("Continuă"));

    await waitFor(() => {
      expect(mockedCreateUserProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          uid: "user-123",
          username: "  andrei_21  ",
          email: "andrei@email.com",
          birthDate: "02/08/2005",
          profileCompleted: false,
          isPrivate: false,
        }),
      );
      expect(refreshProfile).toHaveBeenCalledWith("user-123");
      expect(mockReplace).toHaveBeenCalledWith("/profile/create");
    });
  });

  test("afișează un mesaj clar când username-ul este deja folosit", async () => {
    const consoleSpy = jest.spyOn(console, "info").mockImplementation();
    mockedCreateUserProfile.mockRejectedValue(new Error("USERNAME_TAKEN"));
    await render(<RecoverProfileScreen />);
    await completeValidForm();

    await fireEvent.press(screen.getByText("Continuă"));

    expect(
      await screen.findByText("Numele de utilizator este deja folosit."),
    ).toBeTruthy();
    expect(refreshProfile).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  test("afișează eroarea Firebase și rămâne pe ecran", async () => {
    const consoleSpy = jest.spyOn(console, "info").mockImplementation();
    mockedCreateUserProfile.mockRejectedValue(
      Object.assign(new Error("network"), {
        code: "auth/network-request-failed",
      }),
    );
    await render(<RecoverProfileScreen />);
    await completeValidForm();

    await fireEvent.press(screen.getByText("Continuă"));

    expect(
      await screen.findByText(
        "Nu ne-am putut conecta. Verifică legătura la internet.",
      ),
    ).toBeTruthy();
    expect(mockReplace).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
