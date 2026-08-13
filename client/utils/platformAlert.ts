import { Alert, Platform } from "react-native";

type ConfirmationOptions = {
  title: string;
  message: string;
  cancelText: string;
  confirmText: string;
  destructive?: boolean;
};

function formatBrowserMessage(title: string, message: string): string {
  return `${title}\n\n${message}`;
}

export function showPlatformAlert(title: string, message: string): void {
  if (Platform.OS === "web") {
    globalThis.alert(formatBrowserMessage(title, message));
    return;
  }

  Alert.alert(title, message);
}

export function requestConfirmation({
  title,
  message,
  cancelText,
  confirmText,
  destructive = false,
}: ConfirmationOptions): Promise<boolean> {
  if (Platform.OS === "web") {
    return Promise.resolve(
      globalThis.confirm(formatBrowserMessage(title, message)),
    );
  }

  return new Promise((resolve) => {
    Alert.alert(
      title,
      message,
      [
        {
          text: cancelText,
          style: "cancel",
          onPress: () => resolve(false),
        },
        {
          text: confirmText,
          style: destructive ? "destructive" : "default",
          onPress: () => resolve(true),
        },
      ],
      {
        cancelable: true,
        onDismiss: () => resolve(false),
      },
    );
  });
}
