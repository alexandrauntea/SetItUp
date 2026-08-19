import { render, screen, waitFor } from "@testing-library/react-native";
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

  test("afișează galeria și când există o singură fotografie", async () => {
    await render(
      <ProfilePhotoGallery
        name="Anca Popescu"
        photoPaths={["profilePhotos/user/primary.jpg"]}
        primaryPhotoPath="profilePhotos/user/primary.jpg"
        primaryPhotoUrl="https://example.com/primary.jpg"
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Fotografii")).toBeTruthy();
      expect(screen.getByText("1 fotografie")).toBeTruthy();
      expect(
        screen.getByLabelText(
          "Fotografia 1 din 1 a profilului Anca Popescu",
        ),
      ).toBeTruthy();
    });
    expect(screen.getByText("Principală")).toBeTruthy();
    expect(mockedGetPhotoDownloadUrl).not.toHaveBeenCalled();
  });

  test("afișează fotografiile una sub alta, cu fotografia principală prima", async () => {
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
    expect(screen.getByText("2 fotografii")).toBeTruthy();
    expect(
      screen.getByLabelText("Fotografia 2 din 2 a profilului Anca Popescu"),
    ).toBeTruthy();
    expect(mockedGetPhotoDownloadUrl).toHaveBeenCalledTimes(1);
    expect(mockedGetPhotoDownloadUrl).toHaveBeenCalledWith(
      "profilePhotos/user/secondary.jpg",
    );

    expect(
      screen.queryByRole("button", { name: "Afișează fotografia 2" }),
    ).toBeNull();
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
      expect(screen.getByText("1 fotografie")).toBeTruthy();
    });
    expect(
      screen.getByLabelText("Fotografia 1 din 1 a profilului Anca Popescu"),
    ).toBeTruthy();
  });
});
