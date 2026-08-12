import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { Alert } from "react-native";

import EditProfileScreen from "@/app/profile/edit";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/contexts/ProfileContext";
import { uploadProfilePhoto } from "@/services/profileImageService";

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

jest.mock("@/services/profileImageService", () => ({
  uploadProfilePhoto: jest.fn(),
}));

jest.mock("@/components/ProfilePhotoPicker", () => ({
  ProfilePhotoPicker: ({
    onPhotoSelected,
  }: {
    onPhotoSelected: (photo: {
      uri: string;
      mimeType: string;
    }) => void;
  }) => {
    const { Pressable, Text } = require("react-native");

    return (
      <Pressable
        accessibilityRole="button"
        onPress={() =>
          onPhotoSelected({
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
const mockedUploadProfilePhoto = jest.mocked(uploadProfilePhoto);
const updateProfile = jest.fn();

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
    updateProfile.mockResolvedValue(undefined);
    mockedUploadProfilePhoto.mockResolvedValue(
      "https://exemplu.ro/poza-noua.jpg",
    );
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
    await fireEvent.press(screen.getByText("Muzică & ieșiri"));
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
        photoUrl: "https://exemplu.ro/poza-veche.jpg",
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

  test("încarcă o fotografie nouă înainte de salvare", async () => {
    await render(<EditProfileScreen />);

    await fireEvent.press(screen.getByText("Alege poza nouă"));
    await fireEvent.press(screen.getByText("Salvează"));

    await waitFor(() => {
      expect(mockedUploadProfilePhoto).toHaveBeenCalledWith(
        "user-123",
        "file:///poza-noua.jpg",
        "image/jpeg",
      );
      expect(updateProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          photoUrl: "https://exemplu.ro/poza-noua.jpg",
        }),
      );
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
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();
    updateProfile.mockRejectedValue(new Error("firestore-error"));
    await render(<EditProfileScreen />);

    await fireEvent.press(screen.getByText("Salvează"));

    expect(
      await screen.findByText(
        "Fotografia sau modificările nu au putut fi salvate.",
      ),
    ).toBeTruthy();
    expect(Alert.alert).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
