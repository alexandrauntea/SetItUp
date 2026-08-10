import { getFirebaseErrorMessage } from "../firebaseErrors";

describe("Traducerea erorilor Firebase", () => {
  test.each([
    [
      "auth/email-already-in-use",
      "Există deja un cont cu această adresă de email.",
    ],
    ["auth/invalid-email", "Adresa de email nu este validă."],
    ["auth/weak-password", "Parola este prea slabă."],
    ["auth/invalid-credential", "Emailul sau parola nu sunt corecte."],
    ["auth/user-disabled", "Acest cont a fost dezactivat."],
    [
      "auth/too-many-requests",
      "Au fost prea multe încercări. Încearcă din nou mai târziu.",
    ],
    [
      "auth/network-request-failed",
      "Nu ne-am putut conecta. Verifică legătura la internet.",
    ],
    [
      "storage/unauthorized",
      "Nu ai permisiunea să încarci această fotografie.",
    ],
    [
      "storage/retry-limit-exceeded",
      "Încărcarea fotografiei a durat prea mult. Încearcă din nou.",
    ],
    [
      "storage/unknown",
      "Fotografia nu a putut fi încărcată. Încearcă din nou.",
    ],
  ])("traduce codul %s", (code, expectedMessage) => {
    expect(getFirebaseErrorMessage({ code })).toBe(expectedMessage);
  });

  test("folosește mesajul implicit pentru un cod necunoscut", () => {
    expect(getFirebaseErrorMessage({ code: "auth/cod-necunoscut" })).toBe(
      "A apărut o problemă. Încearcă din nou.",
    );
  });

  test("folosește mesajul primit pentru un cod necunoscut", () => {
    expect(
      getFirebaseErrorMessage(
        { code: "auth/cod-necunoscut" },
        "Nu am putut finaliza operația.",
      ),
    ).toBe("Nu am putut finaliza operația.");
  });

  test.each([null, undefined, "eroare", 123, {}])(
    "tratează în siguranță valoarea %p",
    (error) => {
      expect(getFirebaseErrorMessage(error)).toBe(
        "A apărut o problemă. Încearcă din nou.",
      );
    },
  );

  test("transformă codul erorii în text înainte de căutare", () => {
    expect(
      getFirebaseErrorMessage({
        code: {
          toString: () => "auth/invalid-email",
        },
      }),
    ).toBe("Adresa de email nu este validă.");
  });
});
