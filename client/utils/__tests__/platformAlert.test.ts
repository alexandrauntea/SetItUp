import { Alert, Platform } from "react-native";

import {
  requestConfirmation,
  showPlatformAlert,
} from "../platformAlert";

const originalPlatform = Platform.OS;
const originalAlert = globalThis.alert;
const originalConfirm = globalThis.confirm;

function setPlatform(os: typeof Platform.OS) {
  Object.defineProperty(Platform, "OS", {
    configurable: true,
    value: os,
  });
}

describe("platformAlert", () => {
  afterEach(() => {
    setPlatform(originalPlatform);
    globalThis.alert = originalAlert;
    globalThis.confirm = originalConfirm;
    jest.restoreAllMocks();
  });

  it("returns the browser confirmation result on web", async () => {
    setPlatform("web");
    globalThis.confirm = jest.fn(() => true);

    await expect(
      requestConfirmation({
        title: "Anulezi cererea?",
        message: "Cererea trimisă va fi ștearsă.",
        cancelText: "Înapoi",
        confirmText: "Anulează cererea",
        destructive: true,
      }),
    ).resolves.toBe(true);
    expect(globalThis.confirm).toHaveBeenCalledWith(
      "Anulezi cererea?\n\nCererea trimisă va fi ștearsă.",
    );
  });

  it("does not confirm when the browser dialog is dismissed", async () => {
    setPlatform("web");
    globalThis.confirm = jest.fn(() => false);

    await expect(
      requestConfirmation({
        title: "Elimini prietenul?",
        message: "Mesaj",
        cancelText: "Anulează",
        confirmText: "Elimină",
      }),
    ).resolves.toBe(false);
  });

  it("uses React Native Alert on mobile", async () => {
    setPlatform("android");
    const alertSpy = jest
      .spyOn(Alert, "alert")
      .mockImplementation((_title, _message, buttons) => {
        buttons?.[1]?.onPress?.();
      });

    await expect(
      requestConfirmation({
        title: "Confirmare",
        message: "Mesaj",
        cancelText: "Nu",
        confirmText: "Da",
        destructive: true,
      }),
    ).resolves.toBe(true);
    expect(alertSpy).toHaveBeenCalledTimes(1);
  });

  it("uses the browser alert for web errors", () => {
    setPlatform("web");
    globalThis.alert = jest.fn();

    showPlatformAlert("Eroare", "Acțiunea a eșuat.");

    expect(globalThis.alert).toHaveBeenCalledWith(
      "Eroare\n\nAcțiunea a eșuat.",
    );
  });
});
