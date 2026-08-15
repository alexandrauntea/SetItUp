import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";

import LoginScreen from "@/app/(auth)/login";
import { loginUser } from "@/services/authService";

jest.mock("@/services/authService", () => ({
  loginUser: jest.fn(),
}));

jest.mock("expo-linear-gradient", () => ({
  LinearGradient: require("react-native").View,
}));

const mockedLoginUser = jest.mocked(loginUser);

describe("Ecranul de autentificare", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("afișează câmpurile și acțiunea principală", async () => {
    await render(<LoginScreen />);

    expect(screen.getByText("Bine ai revenit")).toBeTruthy();
    expect(screen.getByPlaceholderText("adresa@email.com")).toBeTruthy();
    expect(screen.getByPlaceholderText("Parola ta")).toBeTruthy();
    expect(screen.getByText("Intră în cont")).toBeTruthy();
  });

  test("nu apelează Firebase când formularul este invalid", async () => {
    await render(<LoginScreen />);

    await fireEvent.press(screen.getByText("Intră în cont"));

    expect(screen.getByText("Introdu o adresă de email validă.")).toBeTruthy();
    expect(mockedLoginUser).not.toHaveBeenCalled();
  });

  test("trimite emailul fără spații și parola către serviciu", async () => {
    mockedLoginUser.mockResolvedValue({ uid: "user-123" } as never);
    await render(<LoginScreen />);

    await fireEvent.changeText(
      screen.getByPlaceholderText("adresa@email.com"),
      "  andrei@email.com  ",
    );
    await fireEvent.changeText(
      screen.getByPlaceholderText("Parola ta"),
      "parola123",
    );

    await fireEvent.press(screen.getByText("Intră în cont"));

    await waitFor(() => {
      expect(mockedLoginUser).toHaveBeenCalledWith(
        "andrei@email.com",
        "parola123",
      );
    });
  });

  test("afișează mesajul Firebase când autentificarea eșuează", async () => {
    const consoleSpy = jest.spyOn(console, "info").mockImplementation();
    mockedLoginUser.mockRejectedValue({ code: "auth/invalid-credential" });
    await render(<LoginScreen />);

    await fireEvent.changeText(
      screen.getByPlaceholderText("adresa@email.com"),
      "andrei@email.com",
    );
    await fireEvent.changeText(
      screen.getByPlaceholderText("Parola ta"),
      "parola123",
    );

    await fireEvent.press(screen.getByText("Intră în cont"));

    await waitFor(() => {
      expect(
        screen.getByText("Emailul sau parola nu sunt corecte."),
      ).toBeTruthy();
    });
    consoleSpy.mockRestore();
  });
});
