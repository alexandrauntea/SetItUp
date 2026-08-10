import type { User } from "firebase/auth";
import { act, render, screen } from "@testing-library/react-native";
import { Text } from "react-native";

import { AuthProvider, useAuth } from "../AuthContext";
import { subscribeToAuthChanges } from "@/services/authService";

jest.mock("@/services/authService", () => ({
  subscribeToAuthChanges: jest.fn(),
}));

const mockedSubscribe = jest.mocked(subscribeToAuthChanges);

function AuthStateProbe() {
  const { user, isLoading, isAuthenticated } = useAuth();

  return (
    <Text>
      {isLoading ? "loading" : "ready"}|{isAuthenticated ? "yes" : "no"}|
      {user?.uid ?? "none"}
    </Text>
  );
}

describe("AuthContext", () => {
  let authCallback: (user: User | null) => void;
  const unsubscribe = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockedSubscribe.mockImplementation((callback) => {
      authCallback = callback;
      return unsubscribe;
    });
  });

  test("este în starea de încărcare până când Firebase răspunde", async () => {
    await render(
      <AuthProvider>
        <AuthStateProbe />
      </AuthProvider>,
    );

    expect(screen.getByText("loading|no|none")).toBeTruthy();
  });

  test("marchează utilizatorul drept autentificat", async () => {
    await render(
      <AuthProvider>
        <AuthStateProbe />
      </AuthProvider>,
    );

    await act(async () => {
      authCallback({ uid: "user-123" } as User);
    });

    expect(screen.getByText("ready|yes|user-123")).toBeTruthy();
  });

  test("marchează sesiunea drept neautentificată când Firebase returnează null", async () => {
    await render(
      <AuthProvider>
        <AuthStateProbe />
      </AuthProvider>,
    );

    await act(async () => {
      authCallback(null);
    });

    expect(screen.getByText("ready|no|none")).toBeTruthy();
  });

  test("anulează abonarea când providerul este demontat", async () => {
    const view = await render(
      <AuthProvider>
        <AuthStateProbe />
      </AuthProvider>,
    );

    await view.unmount();

    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });
});
