import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";

import ManagerScreen from "@/app/friends/manager";
import { getFriends } from "@/services/social/friendshipService";
import {
  getIncomingManagerRequests,
  getManagedProfiles,
  getManagerRelationship,
  getOutgoingManagerRequests,
  removeManager,
} from "@/services/social/managerService";
import { requestConfirmation } from "@/utils/platformAlert";

jest.mock("expo-router", () => ({
  useRouter: () => ({
    back: jest.fn(),
    canGoBack: () => true,
    replace: jest.fn(),
  }),
}));

jest.mock("expo-linear-gradient", () => ({
  LinearGradient: require("react-native").View,
}));

jest.mock("@expo/vector-icons", () => ({
  Ionicons: require("react-native").Text,
}));

jest.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { uid: "current-user" } }),
}));

jest.mock("@/services/social/friendshipService", () => ({
  getFriends: jest.fn(),
}));

jest.mock("@/services/social/managerService", () => ({
  acceptManagerRequest: jest.fn(),
  declineManagerRequest: jest.fn(),
  getIncomingManagerRequests: jest.fn(),
  getManagedProfiles: jest.fn(),
  getManagerRelationship: jest.fn(),
  getOutgoingManagerRequests: jest.fn(),
  removeManager: jest.fn(),
  sendManagerRequest: jest.fn(),
}));

jest.mock("@/utils/platformAlert", () => ({
  requestConfirmation: jest.fn(),
  showPlatformAlert: jest.fn(),
}));

const mockedGetFriends = jest.mocked(getFriends);
const mockedIncoming = jest.mocked(getIncomingManagerRequests);
const mockedManagedProfiles = jest.mocked(getManagedProfiles);
const mockedManagerRelationship = jest.mocked(getManagerRelationship);
const mockedOutgoing = jest.mocked(getOutgoingManagerRequests);
const mockedRemoveManager = jest.mocked(removeManager);
const mockedConfirmation = jest.mocked(requestConfirmation);

const ownedRelationship = {
  ownerId: "current-user",
  ownerUsername: "andrei",
  managerId: "my-manager",
  managerUsername: "anca_manager",
  memberIds: ["current-user", "my-manager"] as [string, string],
  createdAt: "2026-08-12T10:00:00.000Z",
};

const managedRelationship = {
  ownerId: "managed-owner",
  ownerUsername: "profil_gestionat",
  managerId: "current-user",
  managerUsername: "andrei",
  memberIds: ["managed-owner", "current-user"] as [string, string],
  createdAt: "2026-08-13T10:00:00.000Z",
};

describe("Ecranul managerului", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedManagerRelationship.mockResolvedValue(ownedRelationship);
    mockedManagedProfiles.mockResolvedValue([managedRelationship]);
    mockedIncoming.mockResolvedValue([]);
    mockedOutgoing.mockResolvedValue([]);
    mockedGetFriends.mockResolvedValue([]);
  });

  test("afișează managerul propriu și profilurile gestionate", async () => {
    await render(<ManagerScreen />);

    expect(await screen.findByText("@anca_manager")).toBeTruthy();
    expect(screen.getByText("@profil_gestionat")).toBeTruthy();
    expect(
      screen.getByText("Profiluri pentru care ești manager (1)"),
    ).toBeTruthy();
  });

  test("managerul poate renunța la un profil gestionat", async () => {
    mockedConfirmation.mockResolvedValue(true);
    mockedRemoveManager.mockResolvedValue();
    mockedManagedProfiles
      .mockResolvedValueOnce([managedRelationship])
      .mockResolvedValueOnce([]);
    await render(<ManagerScreen />);

    const removeButtons = await screen.findAllByText("Șterge manager");
    await fireEvent.press(removeButtons[1]);

    await waitFor(() => {
      expect(mockedRemoveManager).toHaveBeenCalledWith(
        "managed-owner",
        "current-user",
      );
      expect(
        screen.getByText("Nu ești manager pentru niciun profil în acest moment."),
      ).toBeTruthy();
    });
  });

  test("afișează eroare când una dintre surse nu poate fi încărcată", async () => {
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    mockedManagedProfiles.mockRejectedValueOnce(new Error("permission-denied"));
    await render(<ManagerScreen />);

    expect(
      await screen.findByText(
        "Unele date nu au putut fi încărcate. Trage în jos pentru a reîncerca.",
      ),
    ).toBeTruthy();
    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });
});
