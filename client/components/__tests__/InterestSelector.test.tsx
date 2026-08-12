import { fireEvent, render, screen } from "@testing-library/react-native";

import { InterestSelector } from "@/components/InterestSelector";

describe("Selectorul de interese", () => {
  test("afișează inițial doar categoriile", async () => {
    await render(
      <InterestSelector
        selectedInterests={[]}
        onToggleInterest={jest.fn()}
      />,
    );

    expect(screen.getByText("Artă & divertisment")).toBeTruthy();
    expect(screen.getByText("Sport & mișcare")).toBeTruthy();
    expect(screen.queryByText("Fotografie")).toBeNull();
  });

  test("deschide o singură categorie și permite selectarea", async () => {
    const onToggleInterest = jest.fn();

    await render(
      <InterestSelector
        selectedInterests={[]}
        onToggleInterest={onToggleInterest}
      />,
    );

    await fireEvent.press(screen.getByText("Sport & mișcare"));
    await fireEvent.press(screen.getByText("Alergare"));
    expect(onToggleInterest).toHaveBeenCalledWith("Alergare");

    await fireEvent.press(screen.getByText("Muzică & ieșiri"));
    expect(screen.queryByText("Alergare")).toBeNull();
    expect(screen.getByText("Concerte")).toBeTruthy();
  });

  test("arată numărul total și selecțiile din fiecare categorie", async () => {
    await render(
      <InterestSelector
        selectedInterests={["Muzică", "Concerte", "Fotbal"]}
        onToggleInterest={jest.fn()}
      />,
    );

    expect(screen.getByText("3 selectate")).toBeTruthy();
    expect(screen.getByText("2")).toBeTruthy();
    expect(screen.getByText("1")).toBeTruthy();
  });
});
