import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import * as ImagePicker from "expo-image-picker";
import { Alert } from "react-native";

import { ProfilePhotoPicker } from "@/components/ProfilePhotoPicker";

jest.mock("@expo/vector-icons", () => {
  const { View } = jest.requireActual("react-native");

  return { Ionicons: View };
});

jest.mock("expo-image", () => {
  const { Image } = jest.requireActual("react-native");

  return { Image };
});

jest.mock("expo-image-picker", () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}));

const mockedRequestPermission = jest.mocked(
  ImagePicker.requestMediaLibraryPermissionsAsync,
);
const mockedLaunchLibrary = jest.mocked(
  ImagePicker.launchImageLibraryAsync,
);
const onPhotoSelected = jest.fn();

describe("Selectorul fotografiei de profil", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, "alert").mockImplementation();
    mockedRequestPermission.mockResolvedValue({ granted: true } as never);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("afișează inițialele și acțiunea pentru alegerea fotografiei", async () => {
    await render(
      <ProfilePhotoPicker
        initials="AB"
        onPhotoSelected={onPhotoSelected}
      />,
    );

    expect(screen.getByText("AB")).toBeTruthy();
    expect(screen.getByText("Alege o poză")).toBeTruthy();
    expect(screen.getByLabelText("Alege poza de profil")).toBeTruthy();
  });

  test("explică utilizatorului când accesul la fotografii este refuzat", async () => {
    mockedRequestPermission.mockResolvedValue({ granted: false } as never);
    await render(
      <ProfilePhotoPicker
        initials="AB"
        onPhotoSelected={onPhotoSelected}
      />,
    );

    await fireEvent.press(screen.getByLabelText("Alege poza de profil"));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        "Acces la fotografii",
        "Permite accesul la fotografii ca să poți alege o poză de profil.",
      );
    });
    expect(mockedLaunchLibrary).not.toHaveBeenCalled();
    expect(onPhotoSelected).not.toHaveBeenCalled();
  });

  test("nu schimbă fotografia dacă utilizatorul închide galeria", async () => {
    mockedLaunchLibrary.mockResolvedValue({ canceled: true } as never);
    await render(
      <ProfilePhotoPicker
        initials="AB"
        onPhotoSelected={onPhotoSelected}
      />,
    );

    await fireEvent.press(screen.getByLabelText("Alege poza de profil"));

    await waitFor(() => {
      expect(mockedLaunchLibrary).toHaveBeenCalledTimes(1);
    });
    expect(onPhotoSelected).not.toHaveBeenCalled();
  });

  test("respinge fotografiile mai mari de 5 MB", async () => {
    mockedLaunchLibrary.mockResolvedValue({
      canceled: false,
      assets: [
        {
          uri: "file:///poza-mare.jpg",
          mimeType: "image/jpeg",
          fileSize: 6 * 1024 * 1024,
        },
      ],
    } as never);
    await render(
      <ProfilePhotoPicker
        initials="AB"
        onPhotoSelected={onPhotoSelected}
      />,
    );

    await fireEvent.press(screen.getByLabelText("Alege poza de profil"));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        "Fotografia este prea mare",
        "Alege o fotografie mai mică de 5 MB.",
      );
    });
    expect(onPhotoSelected).not.toHaveBeenCalled();
  });

  test("respinge formatele care nu sunt acceptate de Storage", async () => {
    mockedLaunchLibrary.mockResolvedValue({
      canceled: false,
      assets: [
        {
          uri: "file:///poza.heic",
          fileName: "poza.heic",
          mimeType: "image/heic",
          fileSize: 1024 * 1024,
        },
      ],
    } as never);
    await render(
      <ProfilePhotoPicker
        initials="AB"
        onPhotoSelected={onPhotoSelected}
      />,
    );

    await fireEvent.press(screen.getByLabelText("Alege poza de profil"));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        "Format neacceptat",
        "Alege o fotografie JPG, PNG sau WebP.",
      );
    });
    expect(onPhotoSelected).not.toHaveBeenCalled();
  });

  test("afișează o eroare în română dacă galeria nu poate fi deschisă", async () => {
    const consoleSpy = jest.spyOn(console, "info").mockImplementation();
    mockedLaunchLibrary.mockRejectedValue(new Error("picker unavailable"));
    await render(
      <ProfilePhotoPicker
        initials="AB"
        onPhotoSelected={onPhotoSelected}
      />,
    );

    await fireEvent.press(screen.getByLabelText("Alege poza de profil"));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        "Galeria nu este disponibilă",
        "Nu am putut deschide galeria. Încearcă din nou.",
      );
    });
    expect(onPhotoSelected).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  test("trimite formularului fotografia validă selectată", async () => {
    mockedLaunchLibrary.mockResolvedValue({
      canceled: false,
      assets: [
        {
          uri: "file:///poza-valida.jpg",
          mimeType: "image/jpeg",
          fileSize: 1024 * 1024,
        },
      ],
    } as never);
    await render(
      <ProfilePhotoPicker
        initials="AB"
        onPhotoSelected={onPhotoSelected}
      />,
    );

    await fireEvent.press(screen.getByLabelText("Alege poza de profil"));

    await waitFor(() => {
      expect(onPhotoSelected).toHaveBeenCalledWith({
        uri: "file:///poza-valida.jpg",
        mimeType: "image/jpeg",
      });
    });
    expect(mockedLaunchLibrary).toHaveBeenCalledWith(
      expect.objectContaining({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.75,
      }),
    );
  });

  test("afișează acțiunea de schimbare când există deja o fotografie", async () => {
    await render(
      <ProfilePhotoPicker
        initials="AB"
        photoUri="https://exemplu.ro/poza.jpg"
        onPhotoSelected={onPhotoSelected}
      />,
    );

    expect(screen.getByText("Schimbă poza")).toBeTruthy();
    expect(screen.getByLabelText("Schimbă poza de profil")).toBeTruthy();
  });
});
