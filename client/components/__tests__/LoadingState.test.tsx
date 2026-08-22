import { render, screen } from "@testing-library/react-native";

import { LoadingState } from "@/components/LoadingState";

describe("LoadingState", () => {
  test("afișează mesajul standard de încărcare", async () => {
    await render(<LoadingState />);

    expect(screen.getByText("Se încarcă...")).toBeTruthy();
  });

  test("acceptă un mesaj și o etichetă accesibilă specifice ecranului", async () => {
    await render(
      <LoadingState
        accessibilityLabel="Se încarcă profilul"
        message="Se încarcă profilul..."
      />,
    );

    expect(screen.getByText("Se încarcă profilul...")).toBeTruthy();
    expect(screen.getByLabelText("Se încarcă profilul")).toBeTruthy();
  });
});
