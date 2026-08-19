export interface RegisterFormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  birthDate: string;
  gdprConsent: boolean;
}

export interface LoginFormData {
  email: string;
  password: string;
}

export type ValidationResult = {
  isValid: boolean;
  errors: Record<string, string>;
};

export function validateUsername(username: string): boolean {
  return /^[a-zA-Z0-9_]{3,20}$/.test(username.trim());
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function validatePassword(password: string): boolean {
  return password.length >= 8;
}

export function formatBirthDateInput(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 8);

  if (digits.length <= 2) {
    return digits;
  }

  if (digits.length <= 4) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }

  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

export function validateBirthDate(dateString: string): boolean {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(dateString.trim());

  if (!match) return false;

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const birthDate = new Date(year, month - 1, day);

  const isRealDate =
    birthDate.getFullYear() === year &&
    birthDate.getMonth() === month - 1 &&
    birthDate.getDate() === day;

  if (!isRealDate) return false;

  return calculateAgeFromBirthDate(dateString) >= 18;
}

export function validateRegisterForm(
  formData: RegisterFormData,
): ValidationResult {
  const errors: Record<string, string> = {};

  if (!validateUsername(formData.username)) {
    errors.username =
      "Numele de utilizator trebuie să aibă între 3 și 20 de caractere și poate conține doar litere, cifre și linie joasă (_).";
  }

  if (!validateEmail(formData.email)) {
    errors.email = "Introdu o adresă de email validă.";
  }

  if (!validateBirthDate(formData.birthDate)) {
    errors.birthDate =
      "Introdu data în formatul ZZ/LL/AAAA. Trebuie să ai cel puțin 18 ani.";
  }

  if (!validatePassword(formData.password)) {
    errors.password = "Parola trebuie să conțină cel puțin 8 caractere.";
  }

  if (formData.password !== formData.confirmPassword) {
    errors.confirmPassword = "Parolele nu se potrivesc.";
  }

  if (!formData.gdprConsent) {
    errors.gdprConsent = "Trebuie să accepți termenii și politica GDPR.";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateLoginForm(data: LoginFormData): ValidationResult {
  const errors: Record<string, string> = {};

  if (!validateEmail(data.email)) {
    errors.email = "Introdu o adresă de email validă.";
  }

  if (!validatePassword(data.password)) {
    errors.password = "Parola trebuie să conțină cel puțin 8 caractere.";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function getFirstValidationError(
  errors: Record<string, string>,
): string {
  return Object.values(errors)[0] ?? "Verifică datele introduse.";
}
import { calculateAgeFromBirthDate } from "@/utils/profileData";
