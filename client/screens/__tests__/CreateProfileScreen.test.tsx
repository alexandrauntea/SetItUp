import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { Alert } from "react-native";

import CreateProfileScreen from "@/app/profile/create";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/contexts/ProfileContext";
import { useProfilePhotoManagement } from "@/hooks/useProfilePhotoManagement";

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
            uri: "file:///poza-profil.jpg",
            mimeType: "image/jpeg",
          })
        }
      >
        <Text>Alege poza test</Text>
      </Pressable>
    );
  },
}));

const mockedUseAuth = jest.mocked(useAuth);
const mockedUseProfile = jest.mocked(useProfile);
const mockedUseProfilePhotoManagement = jest.mocked(
  useProfilePhotoManagement,
);
const updateProfile = jest.fn();
const onAddPhoto = jest.fn();

async function completeStepOne() {
  await fireEvent.changeText(
    screen.getByPlaceholderText("De exemplu: Andrei"),
    "  Andrei  ",
  );
  await fireEvent.changeText(
    screen.getByPlaceholderText("De exemplu: Barbuceanu"),
    "  Barbuceanu  ",
  );
  await fireEvent.changeText(
    screen.getByPlaceholderText("De exemplu: student"),
    "  Student  ",
  );
  await fireEvent.press(screen.getByText("Masculin"));
  await fireEvent.press(screen.getByText("Continuă"));

  expect(await screen.findByText("Ce te definește?")).toBeTruthy();
}

async function completeStepTwo() {
  await fireEvent.changeText(
    screen.getByPlaceholderText("Scrie câteva cuvinte"),
    "  Îmi place să cunosc oameni noi.  ",
  );
  await fireEvent.press(screen.getByText("Tehnologie & cunoaștere"));
  await fireEvent.press(screen.getByText("Tehnologie"));
  await fireEvent.press(screen.getByText("Muzică & activități"));
  await fireEvent.press(screen.getByText("Muzică"));
  await fireEvent.press(screen.getByText("Continuă"));

  expect(await screen.findByText("Cine îți vede profilul?")).toBeTruthy();
}

describe("Ecranul de creare a profilului", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, "alert").mockImplementation();

    mockedUseAuth.mockReturnValue({
      user: { uid: "user-123" },
    } as never);
    mockedUseProfile.mockReturnValue({
      profile: null,
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
    updateProfile.mockResolvedValue(undefined);
    onAddPhoto.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("afișează o eroare generală când lipsesc mai multe câmpuri", async () => {
    await render(<CreateProfileScreen />);

    await fireEvent.press(screen.getByText("Continuă"));

    expect(screen.getByText("Completează câmpurile lipsă.")).toBeTruthy();
    expect(screen.getByText("Cum te prezinți?")).toBeTruthy();
    expect(updateProfile).not.toHaveBeenCalled();
  });

  test("numește câmpul care lipsește când este unul singur", async () => {
    await render(<CreateProfileScreen />);

    await fireEvent.changeText(
      screen.getByPlaceholderText("De exemplu: Andrei"),
      "Andrei",
    );
    await fireEvent.changeText(
      screen.getByPlaceholderText("De exemplu: Barbuceanu"),
      "Barbuceanu",
    );
    await fireEvent.changeText(
      screen.getByPlaceholderText("De exemplu: student"),
      "Student",
    );
    await fireEvent.press(screen.getByText("Continuă"));

    expect(screen.getByText('Completează câmpul „Gen”.')).toBeTruthy();
  });

  test("permite trecerea la pasul doi și revenirea la primul pas", async () => {
    await render(<CreateProfileScreen />);

    await completeStepOne();
    await fireEvent.press(screen.getByText("Înapoi"));

    expect(await screen.findByText("Cum te prezinți?")).toBeTruthy();
    expect(screen.getByDisplayValue("Andrei")).toBeTruthy();
    expect(screen.getByDisplayValue("Barbuceanu")).toBeTruthy();
  });

  test("cere descrierea și cel puțin un interes la pasul doi", async () => {
    await render(<CreateProfileScreen />);
    await completeStepOne();

    await fireEvent.press(screen.getByText("Continuă"));
    expect(screen.getByText("Completeaza descrierea.")).toBeTruthy();

    await fireEvent.changeText(
      screen.getByPlaceholderText("Scrie câteva cuvinte"),
      "Îmi place tehnologia.",
    );
    await fireEvent.press(screen.getByText("Continuă"));

    expect(
      screen.getByText("Selectează cel puțin un interes."),
    ).toBeTruthy();
    expect(updateProfile).not.toHaveBeenCalled();
  });

  test("salvează datele curățate și deschide profilul", async () => {
    await render(<CreateProfileScreen />);
    await completeStepOne();
    await completeStepTwo();

    await fireEvent.press(screen.getByText("Privat"));
    await fireEvent.press(screen.getByText("Creează profilul"));

    await waitFor(() => {
      expect(updateProfile).toHaveBeenCalledWith({
        firstName: "Andrei",
        lastName: "Barbuceanu",
        occupation: "Student",
        gender: "male",
        description: "Îmi place să cunosc oameni noi.",
        interests: ["Tehnologie", "Muzică"],
        isPrivate: true,
        profileCompleted: true,
      });
      expect(Alert.alert).toHaveBeenCalledWith(
        "Gata!",
        "Profilul tău este pregătit.",
        expect.any(Array),
      );
    });

    const alertButtons = jest.mocked(Alert.alert).mock.calls[0][2];
    alertButtons?.[0]?.onPress?.();

    expect(mockReplace).toHaveBeenCalledWith("/profile/view");
  });

  test("trimite fotografia aleasă către managerul de fotografii", async () => {
    await render(<CreateProfileScreen />);

    await fireEvent.press(screen.getByText("Alege poza test"));
    await completeStepOne();
    await completeStepTwo();
    await fireEvent.press(screen.getByText("Creează profilul"));

    await waitFor(() => {
      expect(onAddPhoto).toHaveBeenCalledWith({
        uri: "file:///poza-profil.jpg",
        mimeType: "image/jpeg",
      });
      expect(updateProfile).toHaveBeenCalled();
    });
  });

  test("nu suprascrie datele fotografiilor când utilizatorul nu le modifică", async () => {
    mockedUseProfile.mockReturnValue({
      profile: { photoUrl: "https://exemplu.ro/poza-existenta.jpg" },
      updateProfile,
    } as never);
    await render(<CreateProfileScreen />);

    await completeStepOne();
    await completeStepTwo();
    await fireEvent.press(screen.getByText("Creează profilul"));

    await waitFor(() => {
      expect(onAddPhoto).not.toHaveBeenCalled();
      expect(updateProfile).toHaveBeenCalled();
      expect(updateProfile.mock.calls[0][0]).not.toHaveProperty("photoUrl");
    });
  });

  test("afișează o eroare și rămâne pe ecran dacă salvarea eșuează", async () => {
    const consoleSpy = jest.spyOn(console, "info").mockImplementation();
    updateProfile.mockRejectedValue(new Error("firestore-error"));
    await render(<CreateProfileScreen />);

    await completeStepOne();
    await completeStepTwo();
    await fireEvent.press(screen.getByText("Creează profilul"));

    expect(
      await screen.findByText(
        "Fotografia sau profilul nu a putut fi salvat. Încearcă din nou.",
      ),
    ).toBeTruthy();
    expect(Alert.alert).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
