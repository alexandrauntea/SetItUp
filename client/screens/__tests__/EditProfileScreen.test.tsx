import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { Alert } from "react-native";

import EditProfileScreen from "@/app/profile/edit";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/contexts/ProfileContext";
import { useProfilePhotoManagement } from "@/hooks/useProfilePhotoManagement";
import { getManagerRelationship } from "@/services/social/managerService";
import { requestConfirmation } from "@/utils/platformAlert";

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

jest.mock("@/hooks/useProfilePhotoManagement", () => ({
  useProfilePhotoManagement: jest.fn(),
}));

jest.mock("@/services/social/managerService", () => ({
  getManagerRelationship: jest.fn(),
}));

jest.mock("@/utils/platformAlert", () => ({
  requestConfirmation: jest.fn(),
}));

jest.mock("@/components/ProfilePhotoManager", () => ({
  ProfilePhotoManager: ({
    onAddPhoto,
  }: {
    onAddPhoto: (photo: {
      uri: string;
      mimeType: string;
    }) => void;
  }) => {
    const { Pressable, Text } = require("react-native");

    return (
      <Pressable
        accessibilityRole="button"
        onPress={() =>
          onAddPhoto({
            uri: "file:///poza-noua.jpg",
            mimeType: "image/jpeg",
          })
        }
      >
        <Text>Alege poza nouă</Text>
      </Pressable>
    );
  },
}));

const mockedUseAuth = jest.mocked(useAuth);
const mockedUseProfile = jest.mocked(useProfile);
const mockedUseProfilePhotoManagement = jest.mocked(
  useProfilePhotoManagement,
);
const mockedGetManagerRelationship = jest.mocked(getManagerRelationship);
const mockedRequestConfirmation = jest.mocked(requestConfirmation);
const updateProfile = jest.fn();
const onAddPhoto = jest.fn();

const savedProfile = {
  uid: "user-123",
  username: "andrei",
  email: "andrei@email.com",
  birthDate: "02/08/2005",
  firstName: "Andrei",
  lastName: "Barbuceanu",
  description: "Îmi place tehnologia.",
  occupation: "Student",
  gender: "male",
  interests: ["Tehnologie", "Muzică"],
  isPrivate: false,
  photoUrl: "https://exemplu.ro/poza-veche.jpg",
  profileCompleted: true,
  gdprAcceptedAt: "2026-08-01T10:00:00.000Z",
  createdAt: "2026-08-01T10:00:00.000Z",
  updatedAt: "2026-08-01T10:00:00.000Z",
};

describe("Ecranul de editare a profilului", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, "alert").mockImplementation();
    mockedUseAuth.mockReturnValue({ user: { uid: "user-123" } } as never);
    mockedUseProfile.mockReturnValue({
      profile: savedProfile,
      updateProfile,
    } as never);
    mockedUseProfilePhotoManagement.mockReturnValue({
      photos: [],
      operation: null,
      errorMessage: "",
      onAddPhoto,
      onReplacePhoto: jest.fn(),
      onRemovePhoto: jest.fn(),
      onSetPrimaryPhoto: jest.fn(),
    });
    mockedGetManagerRelationship.mockResolvedValue(null);
    updateProfile.mockResolvedValue(undefined);
    onAddPhoto.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("încarcă în formular datele existente ale profilului", async () => {
    await render(<EditProfileScreen />);

    expect(screen.getByDisplayValue("Andrei")).toBeTruthy();
    expect(screen.getByDisplayValue("Barbuceanu")).toBeTruthy();
    expect(screen.getByDisplayValue("Student")).toBeTruthy();
    expect(screen.getByDisplayValue("Îmi place tehnologia.")).toBeTruthy();
    expect(screen.getByText("Editează profilul")).toBeTruthy();
  });

  test("nu salvează când prenumele este gol", async () => {
    await render(<EditProfileScreen />);

    await fireEvent.changeText(screen.getByDisplayValue("Andrei"), "   ");
    await fireEvent.press(screen.getByText("Salvează"));

    expect(screen.getByText("Scrie prenumele tău.")).toBeTruthy();
    expect(updateProfile).not.toHaveBeenCalled();
  });

  test("salvează modificările și păstrează fotografia existentă", async () => {
    await render(<EditProfileScreen />);

    await fireEvent.changeText(screen.getByDisplayValue("Student"), "  Inginer  ");
    await fireEvent.press(screen.getByText("Feminin"));
    await fireEvent.press(screen.getByText("Muzică & activități"));
    await fireEvent.press(screen.getByText("Muzică"));
    await fireEvent.press(screen.getByText("Privat"));
    await fireEvent.press(screen.getByText("Salvează"));

    await waitFor(() => {
      expect(updateProfile).toHaveBeenCalledWith({
        firstName: "Andrei",
        lastName: "Barbuceanu",
        description: "Îmi place tehnologia.",
        occupation: "Inginer",
        gender: "female",
        interests: ["Tehnologie"],
        isPrivate: true,
      });
      expect(Alert.alert).toHaveBeenCalledWith(
        "SetItUp",
        "Profilul a fost actualizat.",
        expect.any(Array),
      );
    });

    const alertButtons = jest.mocked(Alert.alert).mock.calls[0][2];
    alertButtons?.[0]?.onPress?.();
    expect(mockReplace).toHaveBeenCalledWith("/profile/view");
  });

  test("solicită confirmare la comutarea pe privat dacă utilizatorul are un manager", async () => {
    mockedGetManagerRelationship.mockResolvedValueOnce({
      ownerId: "user-123",
      ownerUsername: "andrei",
      managerId: "mgr-1",
      managerUsername: "manager1",
      memberIds: ["user-123", "mgr-1"],
      createdAt: "2026-08-01",
    });

    mockedRequestConfirmation.mockResolvedValueOnce(false);

    await render(<EditProfileScreen />);

    await waitFor(() => {
      expect(mockedGetManagerRelationship).toHaveBeenCalledWith("user-123");
    });

    await fireEvent.press(screen.getByText("Privat"));

    expect(mockedRequestConfirmation).toHaveBeenCalledWith({
      title: "Schimbi profilul în privat?",
      message:
        "Ești sigur că vrei să îți faci contul privat? Managerul tău nu îți va putea căuta match-uri în continuare.",
      cancelText: "Anulează",
      confirmText: "Da, continuă",
      destructive: true,
    });

    await fireEvent.press(screen.getByText("Salvează"));

    await waitFor(() => {
      expect(updateProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          isPrivate: false,
        })
      );
    });
  });

  test("trimite fotografia nouă către managerul de fotografii", async () => {
    await render(<EditProfileScreen />);

    await fireEvent.press(screen.getByText("Alege poza nouă"));
    await fireEvent.press(screen.getByText("Salvează"));

    await waitFor(() => {
      expect(onAddPhoto).toHaveBeenCalledWith({
        uri: "file:///poza-noua.jpg",
        mimeType: "image/jpeg",
      });
      expect(updateProfile).toHaveBeenCalled();
    });
  });

  test("butonul Anulează revine la profil fără să salveze", async () => {
    await render(<EditProfileScreen />);

    await fireEvent.changeText(screen.getByDisplayValue("Student"), "Medic");
    await fireEvent.press(screen.getByText("Anulează"));

    expect(updateProfile).not.toHaveBeenCalled();
    expect(mockReplace).toHaveBeenCalledWith("/profile/view");
  });

  test("afișează un mesaj și rămâne pe ecran dacă salvarea eșuează", async () => {
    const consoleSpy = jest.spyOn(console, "info").mockImplementation();
    updateProfile.mockRejectedValue(new Error("firestore-error"));
    await render(<EditProfileScreen />);

    await fireEvent.press(screen.getByText("Salvează"));

    expect(
      await screen.findByText(
        "A apărut o problemă. Încearcă din nou.",
      ),
    ).toBeTruthy();
    expect(Alert.alert).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
