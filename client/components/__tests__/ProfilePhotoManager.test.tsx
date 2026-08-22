import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import * as ImagePicker from "expo-image-picker";

import {
  ProfilePhotoManager,
  type ProfilePhotoPreview,
} from "@/components/ProfilePhotoManager";
import { requestConfirmation } from "@/utils/platformAlert";

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

jest.mock("@/utils/platformAlert", () => ({
  requestConfirmation: jest.fn(),
}));

const mockedRequestPermission = jest.mocked(
  ImagePicker.requestMediaLibraryPermissionsAsync,
);
const mockedLaunchLibrary = jest.mocked(
  ImagePicker.launchImageLibraryAsync,
);
const mockedRequestConfirmation = jest.mocked(requestConfirmation);

const photos: ProfilePhotoPreview[] = [
  {
    id: "photo-primary",
    storagePath: "profilePhotos/user-123/photo-primary.jpg",
    position: 0,
    isPrimary: true,
    previewUri: "https://exemplu.ro/principala.jpg",
  },
  {
    id: "photo-secondary",
    storagePath: "profilePhotos/user-123/photo-secondary.jpg",
    position: 1,
    isPrimary: false,
    previewUri: "https://exemplu.ro/secundara.jpg",
  },
];

const onAddPhoto = jest.fn();
const onReplacePhoto = jest.fn();
const onRemovePhoto = jest.fn();
const onSetPrimaryPhoto = jest.fn();

async function renderManager(
  overrides: Partial<React.ComponentProps<typeof ProfilePhotoManager>> = {},
) {
  return await render(
    <ProfilePhotoManager
      initials="SP"
      photos={photos}
      onAddPhoto={onAddPhoto}
      onReplacePhoto={onReplacePhoto}
      onRemovePhoto={onRemovePhoto}
      onSetPrimaryPhoto={onSetPrimaryPhoto}
      {...overrides}
    />,
  );
}

describe("Administrarea fotografiilor de profil", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedRequestPermission.mockResolvedValue({ granted: true } as never);
    mockedRequestConfirmation.mockResolvedValue(true);
    mockedLaunchLibrary.mockResolvedValue({
      canceled: false,
      assets: [
        {
          uri: "file:///fotografie-noua.jpg",
          mimeType: "image/jpeg",
          fileSize: 1024 * 1024,
          width: 1200,
          height: 1200,
        },
      ],
    } as never);
  });

  test("afișează starea goală și permite adăugarea unei fotografii", async () => {
    await renderManager({ photos: [] });

    expect(screen.getByText("Nu ai adăugat fotografii")).toBeTruthy();

    await fireEvent.press(
      screen.getByLabelText("Adaugă o fotografie de profil"),
    );

    await waitFor(() => {
      expect(onAddPhoto).toHaveBeenCalledWith({
        uri: "file:///fotografie-noua.jpg",
        mimeType: "image/jpeg",
      });
    });
  });

  test("marchează fotografia principală și permite schimbarea ei", async () => {
    await renderManager();

    expect(screen.getByText("Principală")).toBeTruthy();

    await fireEvent.press(screen.getByText("Setează principală"));

    await waitFor(() => {
      expect(onSetPrimaryPhoto).toHaveBeenCalledWith("photo-secondary");
    });
  });

  test("selectează o imagine nouă înainte de înlocuire", async () => {
    await renderManager();

    await fireEvent.press(
      screen.getByLabelText("Înlocuiește fotografia 2"),
    );

    await waitFor(() => {
      expect(onReplacePhoto).toHaveBeenCalledWith("photo-secondary", {
        uri: "file:///fotografie-noua.jpg",
        mimeType: "image/jpeg",
      });
    });
  });

  test("cere confirmare înainte de eliminare", async () => {
    await renderManager();

    await fireEvent.press(screen.getByLabelText("Elimină fotografia 2"));

    await waitFor(() => {
      expect(mockedRequestConfirmation).toHaveBeenCalledWith({
        title: "Elimini fotografia?",
        message:
          "Fotografia va fi ștearsă din profil și nu va mai putea fi recuperată.",
        cancelText: "Anulează",
        confirmText: "Elimină",
        destructive: true,
      });
      expect(onRemovePhoto).toHaveBeenCalledWith("photo-secondary");
    });
  });

  test("nu elimină fotografia dacă utilizatorul anulează confirmarea", async () => {
    mockedRequestConfirmation.mockResolvedValue(false);
    await renderManager();

    await fireEvent.press(screen.getByLabelText("Elimină fotografia 1"));

    await waitFor(() => {
      expect(mockedRequestConfirmation).toHaveBeenCalledTimes(1);
    });
    expect(onRemovePhoto).not.toHaveBeenCalled();
  });

  test("afișează progresul încărcării în limba română", async () => {
    await renderManager({
      operation: { kind: "upload", progress: 42 },
    });

    expect(screen.getByText("Se încarcă fotografia… 42%")).toBeTruthy();
  });

  test("dezactivează adăugarea când profilul are șase fotografii", async () => {
    const sixPhotos = Array.from({ length: 6 }, (_, index) => ({
      id: `photo-${index}`,
      storagePath: `profilePhotos/user-123/photo-${index}.jpg`,
      position: index,
      isPrimary: index === 0,
      previewUri: `https://exemplu.ro/photo-${index}.jpg`,
    }));

    await renderManager({ photos: sixPhotos });

    const addButton = screen.getByLabelText("Adaugă o fotografie de profil");
    expect(addButton.props.accessibilityState.disabled).toBe(true);
    expect(screen.getByText("Ai atins limita de 6 fotografii")).toBeTruthy();
  });

  test("afișează eroarea primită de la serviciu", async () => {
    const consoleSpy = jest.spyOn(console, "info").mockImplementation();
    onSetPrimaryPhoto.mockRejectedValueOnce({
      code: "storage/unauthorized",
    });
    await renderManager();

    await fireEvent.press(screen.getByText("Setează principală"));

    expect(
      await screen.findByText(
        "Nu ai permisiunea să încarci această fotografie.",
      ),
    ).toBeTruthy();
    consoleSpy.mockRestore();
  });
});
