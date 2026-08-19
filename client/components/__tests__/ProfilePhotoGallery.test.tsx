import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { Image as mockImage } from "react-native";

import { ProfilePhotoGallery } from "@/components/ProfilePhotoGallery";
import { getPhotoDownloadUrl } from "@/services/photoStorageService";

jest.mock("expo-image", () => ({
  Image: mockImage,
}));

jest.mock("@/services/photoStorageService", () => ({
  getPhotoDownloadUrl: jest.fn(),
}));

const mockedGetPhotoDownloadUrl = jest.mocked(getPhotoDownloadUrl);

describe("ProfilePhotoGallery", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetPhotoDownloadUrl.mockImplementation(async (storagePath) =>
      storagePath.includes("secondary")
        ? "https://example.com/secondary.jpg"
        : "https://example.com/third.jpg",
    );
  });

  test("nu dublează fotografia profilului când există o singură fotografie", async () => {
    const result = await render(
      <ProfilePhotoGallery
        name="Anca Popescu"
        photoPaths={["profilePhotos/user/primary.jpg"]}
        primaryPhotoPath="profilePhotos/user/primary.jpg"
        primaryPhotoUrl="https://example.com/primary.jpg"
      />,
    );

    expect(result.queryByText("Fotografii")).toBeNull();
    expect(mockedGetPhotoDownloadUrl).not.toHaveBeenCalled();
  });

  test("afișează fotografia principală prima și permite alegerea unei miniaturi", async () => {
    await render(
      <ProfilePhotoGallery
        name="Anca Popescu"
        photoPaths={[
          "profilePhotos/user/secondary.jpg",
          "profilePhotos/user/primary.jpg",
        ]}
        primaryPhotoPath="profilePhotos/user/primary.jpg"
        primaryPhotoUrl="https://example.com/primary.jpg"
      />,
    );

    await waitFor(() => {
      expect(
        screen.getByLabelText(
          "Fotografia 1 din 2 a profilului Anca Popescu",
        ),
      ).toBeTruthy();
    });

    expect(screen.getByText("Principală")).toBeTruthy();
    expect(screen.getByText("1 din 2")).toBeTruthy();
    expect(mockedGetPhotoDownloadUrl).toHaveBeenCalledTimes(1);
    expect(mockedGetPhotoDownloadUrl).toHaveBeenCalledWith(
      "profilePhotos/user/secondary.jpg",
    );

    fireEvent.press(
      screen.getByRole("button", { name: "Afișează fotografia 2" }),
    );

    await waitFor(() => {
      expect(
        screen.getByLabelText("Fotografia 2 din 2 a profilului Anca Popescu"),
      ).toBeTruthy();
    });
    expect(screen.queryByText("Principală")).toBeNull();
    expect(screen.getByText("2 din 2")).toBeTruthy();
  });

  test("păstrează în galerie fotografiile care pot fi încărcate", async () => {
    mockedGetPhotoDownloadUrl.mockRejectedValueOnce(new Error("indisponibilă"));

    await render(
      <ProfilePhotoGallery
        name="Anca Popescu"
        photoPaths={[
          "profilePhotos/user/primary.jpg",
          "profilePhotos/user/missing.jpg",
        ]}
        primaryPhotoPath="profilePhotos/user/primary.jpg"
        primaryPhotoUrl="https://example.com/primary.jpg"
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("1 din 1")).toBeTruthy();
    });
    expect(
      screen.getByLabelText("Fotografia 1 din 1 a profilului Anca Popescu"),
    ).toBeTruthy();
  });
});
