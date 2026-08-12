import {
  calculateAgeFromBirthDate,
  normalizeUsername,
} from "../profileData";

describe("Date comune de profil", () => {
  test("normalizează username-ul într-un singur format", () => {
    expect(normalizeUsername("  Andrei_21  ")).toBe("andrei_21");
  });

  test("calculează vârsta înainte de aniversarea din anul curent", () => {
    expect(
      calculateAgeFromBirthDate("20/08/2000", new Date(2026, 7, 12)),
    ).toBe(25);
  });

  test("calculează vârsta după aniversarea din anul curent", () => {
    expect(
      calculateAgeFromBirthDate("10/08/2000", new Date(2026, 7, 12)),
    ).toBe(26);
  });

  test("returnează zero pentru o dată incompletă", () => {
    expect(calculateAgeFromBirthDate("", new Date(2026, 7, 12))).toBe(0);
  });
});
