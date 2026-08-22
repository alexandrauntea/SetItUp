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
  "storage/unauthorized":
    "Nu ai permisiunea să încarci această fotografie.",
  "storage/retry-limit-exceeded":
    "Încărcarea fotografiei a durat prea mult. Încearcă din nou.",
  "storage/unknown":
    "Fotografia nu a putut fi încărcată. Încearcă din nou.",
  "permission-denied":
    "Firebase a refuzat actualizarea profilului. Verifică regulile publicate.",
  "firestore/permission-denied":
    "Firebase a refuzat actualizarea profilului. Verifică regulile publicate.",
};

const LOCAL_ERROR_MESSAGES: Record<string, string> = {
  PHOTO_READ_FAILED: "Fotografia nu a putut fi citită de pe dispozitiv.",
  PHOTO_TYPE_NOT_SUPPORTED: "Formatul fotografiei nu este acceptat.",
  PHOTO_ACCESS_DENIED: "Fotografia nu aparține profilului autentificat.",
  PHOTO_LIMIT_REACHED: "Poți avea maximum 6 fotografii în profil.",
  PROFILE_NOT_FOUND: "Profilul nu a fost găsit.",
  OWNER_HAS_NO_MANAGER: "Contul pentru care cauți nu are un manager alocat.",
  REACTION_MANAGER_ONLY: "Doar managerul desemnat poate evalua profiluri.",
  TARGET_HAS_NO_MANAGER: "Profilul evaluat nu are un manager alocat.",
  SAME_MANAGER_NOT_ALLOWED: "Nu poți potrivi doi utilizatori cu același manager.",
  REACTION_ALREADY_RECORDED: "Ai evaluat deja acest profil.",
  PROFILE_ALREADY_MATCHED: "Acești utilizatori au deja un match activ.",
  CONVERSATION_BLOCKED: "Conversația este blocată. Nu poți trimite mesaje.",
  INVALID_MESSAGE_TEXT: "Mesajul nu poate fi gol.",
};

export function getFirebaseErrorMessage(
  error: unknown,
  fallbackMessage = "A apărut o problemă. Încearcă din nou.",
): string {
  if (error instanceof Error && LOCAL_ERROR_MESSAGES[error.message]) {
    return LOCAL_ERROR_MESSAGES[error.message];
  }

  if (typeof error !== "object" || error === null || !("code" in error)) {
    return fallbackMessage;
  }

  const errorCode = String(error.code);
  return FIREBASE_ERROR_MESSAGES[errorCode] ?? fallbackMessage;
}
