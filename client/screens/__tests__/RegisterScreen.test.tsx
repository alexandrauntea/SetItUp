import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";

import RegisterScreen from "@/app/(auth)/register";
import { useProfile } from "@/contexts/ProfileContext";
import {
  deleteCurrentUserAccount,
  logoutUser,
  registerUser,
} from "@/services/authService";
import { createUserProfile } from "@/services/profileService";

const mockReplace = jest.fn();

jest.mock("expo-router", () => {
  const React = require("react");
  const { Text } = require("react-native");

  return {
    Link: ({ children }: { children: React.ReactNode }) => (
      <Text>{children}</Text>
    ),
    useRouter: () => ({ replace: mockReplace }),
  };
});

jest.mock("expo-linear-gradient", () => ({
  LinearGradient: require("react-native").View,
}));

jest.mock("@/contexts/ProfileContext", () => ({
  useProfile: jest.fn(),
}));

jest.mock("@/services/authService", () => ({
  deleteCurrentUserAccount: jest.fn(),
  logoutUser: jest.fn(),
  registerUser: jest.fn(),
}));

jest.mock("@/services/profileService", () => ({
  createUserProfile: jest.fn(),
}));

const mockedUseProfile = jest.mocked(useProfile);
const mockedRegisterUser = jest.mocked(registerUser);
const mockedCreateUserProfile = jest.mocked(createUserProfile);
const mockedDeleteAccount = jest.mocked(deleteCurrentUserAccount);
const mockedLogout = jest.mocked(logoutUser);
const refreshProfile = jest.fn();

async function completeValidForm() {
  await fireEvent.changeText(
    screen.getByPlaceholderText("De exemplu: andrei21"),
    "andrei_21",
  );
  await fireEvent.changeText(
    screen.getByPlaceholderText("adresa@email.com"),
    " Andrei@Email.com ",
  );
  await fireEvent.changeText(
    screen.getByPlaceholderText("ZZ/LL/AAAA"),
    "02082005",
  );
  await fireEvent.changeText(
    screen.getByPlaceholderText("Alege o parolă"),
    "parola123",
  );
  await fireEvent.changeText(
    screen.getByPlaceholderText("Confirmă parola"),
    "parola123",
  );
  await fireEvent.press(screen.getByRole("checkbox"));
}

describe("Ecranul de înregistrare", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseProfile.mockReturnValue({ refreshProfile } as never);
    mockedDeleteAccount.mockResolvedValue(undefined);
    mockedLogout.mockResolvedValue(undefined);
  });

  test("nu creează contul dacă formularul este incomplet", async () => {
    await render(<RegisterScreen />);

    await fireEvent.press(screen.getByText("Creează contul"));

    expect(mockedRegisterUser).not.toHaveBeenCalled();
    expect(
      screen.getByText(
        "Numele de utilizator trebuie să aibă între 3 și 20 de caractere și poate conține doar litere, cifre și underscore (_).",
      ),
    ).toBeTruthy();
  });

  test("creează contul, profilul inițial și deschide configurarea profilului", async () => {
    mockedRegisterUser.mockResolvedValue({ uid: "user-123" } as never);
    mockedCreateUserProfile.mockResolvedValue({} as never);
    refreshProfile.mockResolvedValue(undefined);
    await render(<RegisterScreen />);
    await completeValidForm();

    await fireEvent.press(screen.getByText("Creează contul"));

    await waitFor(() => {
      expect(mockedRegisterUser).toHaveBeenCalledWith(
        "andrei@email.com",
        "parola123",
      );
      expect(mockedCreateUserProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          uid: "user-123",
          username: "andrei_21",
          email: "andrei@email.com",
          birthDate: "02/08/2005",
          profileCompleted: false,
        }),
      );
      expect(refreshProfile).toHaveBeenCalledWith("user-123");
      expect(mockReplace).toHaveBeenCalledWith("/profile/create");
    });
  });

  test("afișează eroarea și șterge contul Auth când username-ul este ocupat", async () => {
    const consoleSpy = jest.spyOn(console, "info").mockImplementation();
    mockedRegisterUser.mockResolvedValue({ uid: "user-123" } as never);
    mockedCreateUserProfile.mockRejectedValue(new Error("USERNAME_TAKEN"));
    await render(<RegisterScreen />);
    await completeValidForm();

    await fireEvent.press(screen.getByText("Creează contul"));

    await waitFor(() => {
      expect(mockedCreateUserProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          uid: "user-123",
          username: "andrei_21",
        }),
      );
      expect(mockedDeleteAccount).toHaveBeenCalledTimes(1);
      expect(mockedLogout).not.toHaveBeenCalled();
      expect(refreshProfile).not.toHaveBeenCalled();
      expect(
        screen.getByText("Numele de utilizator este deja folosit."),
      ).toBeTruthy();
    });
    expect(mockReplace).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  test("deconectează contul incomplet dacă ștergerea lui eșuează", async () => {
    const consoleSpy = jest.spyOn(console, "info").mockImplementation();
    mockedRegisterUser.mockResolvedValue({ uid: "user-123" } as never);
    mockedCreateUserProfile.mockRejectedValue(new Error("firestore-error"));
    mockedDeleteAccount.mockRejectedValue(new Error("delete-error"));
    await render(<RegisterScreen />);
    await completeValidForm();

    await fireEvent.press(screen.getByText("Creează contul"));

    await waitFor(() => {
      expect(mockedLogout).toHaveBeenCalledTimes(1);
    });
    consoleSpy.mockRestore();
  });
});
