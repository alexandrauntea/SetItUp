export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

export function calculateAgeFromBirthDate(
  birthDate: string,
  today = new Date(),
): number {
  const [day, month, year] = birthDate.split("/").map(Number);

  if (!day || !month || !year) return 0;

  let age = today.getFullYear() - year;
  const birthdayHasPassed =
    today.getMonth() + 1 > month ||
    (today.getMonth() + 1 === month && today.getDate() >= day);

  if (!birthdayHasPassed) age -= 1;

  return Math.max(age, 0);
}
