import {
  formatBirthDateInput,
  getFirstValidationError,
  validateBirthDate,
  validateEmail,
  validateLoginForm,
  validatePassword,
  validateRegisterForm,
  validateUsername,
  type RegisterFormData,
} from "../validation";

describe("Validarea emailului", () => {
  test("acceptă un email valid", () => {
    expect(validateEmail("andrei@email.com")).toBe(true);
  });

  test("acceptă un email cu subdomeniu", () => {
    expect(validateEmail("andrei@students.unibuc.ro")).toBe(true);
  });

  test("acceptă un email cu semnul plus", () => {
    expect(validateEmail("andrei+test@email.com")).toBe(true);
  });

  test("ignoră spațiile de la început și sfârșit", () => {
    expect(validateEmail("  andrei@email.com  ")).toBe(true);
  });

  test("respinge un email fără caracterul @", () => {
    expect(validateEmail("andreiemail.com")).toBe(false);
  });

  test("respinge un email fără domeniu", () => {
    expect(validateEmail("andrei@")).toBe(false);
  });

  test("respinge un email fără extensie", () => {
    expect(validateEmail("andrei@email")).toBe(false);
  });

  test("respinge un email care conține spații", () => {
    expect(validateEmail("andrei barb@email.com")).toBe(false);
  });

  test("respinge un email gol", () => {
    expect(validateEmail("")).toBe(false);
  });
});

describe("Validarea username-ului", () => {
  test("acceptă un username cu litere", () => {
    expect(validateUsername("andrei")).toBe(true);
  });

  test("acceptă litere, cifre și underscore", () => {
    expect(validateUsername("andrei_21")).toBe(true);
  });

  test("acceptă un username cu exact 3 caractere", () => {
    expect(validateUsername("abc")).toBe(true);
  });

  test("acceptă un username cu exact 20 de caractere", () => {
    expect(validateUsername("abcdefghijklmnopqrst")).toBe(true);
  });

  test("ignoră spațiile de la început și sfârșit", () => {
    expect(validateUsername("  andrei  ")).toBe(true);
  });

  test("respinge un username mai scurt de 3 caractere", () => {
    expect(validateUsername("ab")).toBe(false);
  });

  test("respinge un username mai lung de 20 de caractere", () => {
    expect(validateUsername("abcdefghijklmnopqrstu")).toBe(false);
  });

  test("respinge spațiile din interior", () => {
    expect(validateUsername("andrei barb")).toBe(false);
  });

  test("respinge caracterele speciale", () => {
    expect(validateUsername("andrei!")).toBe(false);
  });

  test("respinge cratima", () => {
    expect(validateUsername("andrei-barb")).toBe(false);
  });

  test("respinge un username gol", () => {
    expect(validateUsername("")).toBe(false);
  });
});

describe("Validarea parolei", () => {
  test("acceptă o parolă cu exact 8 caractere", () => {
    expect(validatePassword("12345678")).toBe(true);
  });

  test("acceptă o parolă mai lungă", () => {
    expect(validatePassword("parolaFoarteLunga")).toBe(true);
  });

  test("acceptă litere, cifre și caractere speciale", () => {
    expect(validatePassword("Parola1!")).toBe(true);
  });

  test("respinge o parolă cu 7 caractere", () => {
    expect(validatePassword("1234567")).toBe(false);
  });

  test("respinge parola goală", () => {
    expect(validatePassword("")).toBe(false);
  });
});

describe("Formatarea datei de naștere", () => {
  test("păstrează valoarea goală", () => {
    expect(formatBirthDateInput("")).toBe("");
  });

  test("păstrează primele două cifre ca zi", () => {
    expect(formatBirthDateInput("02")).toBe("02");
  });

  test("formatează ziua și o cifră din lună", () => {
    expect(formatBirthDateInput("020")).toBe("02/0");
  });

  test("formatează ziua și luna", () => {
    expect(formatBirthDateInput("0208")).toBe("02/08");
  });

  test("formatează data completă", () => {
    expect(formatBirthDateInput("02082005")).toBe("02/08/2005");
  });

  test("elimină literele introduse", () => {
    expect(formatBirthDateInput("02ab082005")).toBe("02/08/2005");
  });

  test("elimină separatorii introduși manual", () => {
    expect(formatBirthDateInput("02-08-2005")).toBe("02/08/2005");
  });

  test("nu permite mai mult de 8 cifre", () => {
    expect(formatBirthDateInput("020820051234")).toBe("02/08/2005");
  });
});

describe("Validarea datei de naștere", () => {
  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 7, 3, 12, 0, 0));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  test("acceptă data unei persoane adulte", () => {
    expect(validateBirthDate("02/08/2000")).toBe(true);
  });

  test("acceptă o persoană care împlinește 18 ani astăzi", () => {
    expect(validateBirthDate("03/08/2008")).toBe(true);
  });

  test("respinge o persoană care împlinește 18 ani mâine", () => {
    expect(validateBirthDate("04/08/2008")).toBe(false);
  });

  test("acceptă o zi reală dintr-un an bisect", () => {
    expect(validateBirthDate("29/02/2000")).toBe(true);
  });

  test("respinge 29 februarie într-un an care nu este bisect", () => {
    expect(validateBirthDate("29/02/2001")).toBe(false);
  });

  test("respinge o dată fără slash-uri", () => {
    expect(validateBirthDate("02082000")).toBe(false);
  });

  test("respinge formatul an-lună-zi", () => {
    expect(validateBirthDate("2000/08/02")).toBe(false);
  });

  test("respinge o dată cu an format din două cifre", () => {
    expect(validateBirthDate("02/08/00")).toBe(false);
  });

  test("respinge o lună inexistentă", () => {
    expect(validateBirthDate("10/13/2000")).toBe(false);
  });

  test("respinge luna zero", () => {
    expect(validateBirthDate("10/00/2000")).toBe(false);
  });

  test("respinge ziua zero", () => {
    expect(validateBirthDate("00/08/2000")).toBe(false);
  });

  test("respinge o zi inexistentă", () => {
    expect(validateBirthDate("31/04/2000")).toBe(false);
  });

  test("respinge o persoană mai mică de 18 ani", () => {
    expect(validateBirthDate("01/01/2015")).toBe(false);
  });

  test("respinge o dată goală", () => {
    expect(validateBirthDate("")).toBe(false);
  });

  test("ignoră spațiile de la început și sfârșit", () => {
    expect(validateBirthDate("  02/08/2000  ")).toBe(true);
  });
});

describe("Validarea formularului de înregistrare", () => {
  const validRegisterData: RegisterFormData = {
    username: "andrei_21",
    email: "andrei@email.com",
    birthDate: "02/08/2000",
    password: "parola123",
    confirmPassword: "parola123",
    gdprConsent: true,
  };

  test("acceptă un formular complet și corect", () => {
    const result = validateRegisterForm(validRegisterData);

    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual({});
  });

  test("respinge un username invalid", () => {
    const result = validateRegisterForm({
      ...validRegisterData,
      username: "a!",
    });

    expect(result.isValid).toBe(false);
    expect(result.errors.username).toBe(
      "Numele de utilizator trebuie să aibă între 3 și 20 de caractere și poate conține doar litere, cifre și underscore (_).",
    );
  });

  test("respinge un email invalid", () => {
    const result = validateRegisterForm({
      ...validRegisterData,
      email: "andrei",
    });

    expect(result.isValid).toBe(false);
    expect(result.errors.email).toBe("Introdu o adresă de email validă.");
  });

  test("respinge o dată de naștere invalidă", () => {
    const result = validateRegisterForm({
      ...validRegisterData,
      birthDate: "31/02/2000",
    });

    expect(result.isValid).toBe(false);
    expect(result.errors.birthDate).toBe(
      "Introdu data în formatul ZZ/LL/AAAA. Trebuie să ai cel puțin 18 ani.",
    );
  });

  test("respinge o parolă prea scurtă", () => {
    const result = validateRegisterForm({
      ...validRegisterData,
      password: "123",
      confirmPassword: "123",
    });

    expect(result.isValid).toBe(false);
    expect(result.errors.password).toBe(
      "Parola trebuie să conțină cel puțin 8 caractere.",
    );
  });

  test("respinge parolele care nu coincid", () => {
    const result = validateRegisterForm({
      ...validRegisterData,
      confirmPassword: "altaParola",
    });

    expect(result.isValid).toBe(false);
    expect(result.errors.confirmPassword).toBe("Parolele nu se potrivesc.");
  });

  test("cere acceptarea GDPR", () => {
    const result = validateRegisterForm({
      ...validRegisterData,
      gdprConsent: false,
    });

    expect(result.isValid).toBe(false);
    expect(result.errors.gdprConsent).toBe(
      "Trebuie să accepți termenii și politica GDPR.",
    );
  });

  test("nu adaugă erori pentru câmpurile valide", () => {
    const result = validateRegisterForm({
      ...validRegisterData,
      email: "email-gresit",
    });

    expect(result.errors).toHaveProperty("email");
    expect(result.errors).not.toHaveProperty("username");
    expect(result.errors).not.toHaveProperty("password");
    expect(result.errors).not.toHaveProperty("confirmPassword");
    expect(result.errors).not.toHaveProperty("gdprConsent");
  });

  test("returnează toate erorile formularului invalid", () => {
    const result = validateRegisterForm({
      username: "a",
      email: "email-gresit",
      birthDate: "31/02/2020",
      password: "123",
      confirmPassword: "456",
      gdprConsent: false,
    });

    expect(result.isValid).toBe(false);
    expect(Object.keys(result.errors)).toHaveLength(6);
    expect(result.errors).toHaveProperty("username");
    expect(result.errors).toHaveProperty("email");
    expect(result.errors).toHaveProperty("birthDate");
    expect(result.errors).toHaveProperty("password");
    expect(result.errors).toHaveProperty("confirmPassword");
    expect(result.errors).toHaveProperty("gdprConsent");
  });
});

describe("Validarea formularului de login", () => {
  test("acceptă date de autentificare valide", () => {
    const result = validateLoginForm({
      email: "andrei@email.com",
      password: "parola123",
    });

    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual({});
  });

  test("respinge un email invalid", () => {
    const result = validateLoginForm({
      email: "andrei",
      password: "parola123",
    });

    expect(result.isValid).toBe(false);
    expect(result.errors.email).toBe("Introdu o adresă de email validă.");
  });

  test("respinge o parolă prea scurtă", () => {
    const result = validateLoginForm({
      email: "andrei@email.com",
      password: "123",
    });

    expect(result.isValid).toBe(false);
    expect(result.errors.password).toBe(
      "Parola trebuie să conțină cel puțin 8 caractere.",
    );
  });

  test("returnează ambele erori când formularul este gol", () => {
    const result = validateLoginForm({
      email: "",
      password: "",
    });

    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveProperty("email");
    expect(result.errors).toHaveProperty("password");
    expect(Object.keys(result.errors)).toHaveLength(2);
  });

  test("nu returnează eroare pentru parola validă dacă emailul este greșit", () => {
    const result = validateLoginForm({
      email: "email-gresit",
      password: "parola123",
    });

    expect(result.errors).toHaveProperty("email");
    expect(result.errors).not.toHaveProperty("password");
  });
});

describe("Alegerea mesajului de eroare", () => {
  test("returnează primul mesaj existent", () => {
    const message = getFirstValidationError({
      email: "Email invalid.",
      password: "Parolă invalidă.",
    });

    expect(message).toBe("Email invalid.");
  });

  test("returnează singurul mesaj existent", () => {
    const message = getFirstValidationError({
      password: "Parolă invalidă.",
    });

    expect(message).toBe("Parolă invalidă.");
  });

  test("returnează mesajul implicit când nu există erori", () => {
    expect(getFirstValidationError({})).toBe("Verifică datele introduse.");
  });
});
