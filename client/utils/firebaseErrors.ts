const FIREBASE_ERROR_MESSAGES: Record<string, string> = {
  "auth/email-already-in-use": "Există deja un cont cu această adresă de email.",
  "auth/invalid-email": "Adresa de email nu este validă.",
  "auth/weak-password": "Parola este prea slabă.",
  "auth/invalid-credential": "Emailul sau parola nu sunt corecte.",
  "auth/user-disabled": "Acest cont a fost dezactivat.",
  "auth/too-many-requests":
    "Au fost prea multe încercări. Încearcă din nou mai târziu.",
  "auth/network-request-failed":
    "Nu ne-am putut conecta. Verifică legătura la internet.",
};

export function getFirebaseErrorMessage(
  error: unknown,
  fallbackMessage = "A apărut o problemă. Încearcă din nou.",
): string {
  if (typeof error !== "object" || error === null || !("code" in error)) {
    return fallbackMessage;
  }

  const errorCode = String(error.code);
  return FIREBASE_ERROR_MESSAGES[errorCode] ?? fallbackMessage;
}
