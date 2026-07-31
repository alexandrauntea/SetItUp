export interface RegisterFormdata {
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
    birthDate: string;
    gdprConsent: boolean;
}

export interface LoginFormdata {
    email: string;
    password: string;
}

export const validateUsername = (username: string): boolean => {
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  return usernameRegex.test(username);
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): boolean => {
    return password.length >= 8;
};

export const validateBirthDate = (dateString: string): boolean => {
    if (!dateString) return false;
    const birthDate = new Date(dateString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDifference = today.getMonth() - birthDate.getMonth();
    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age >= 18;
};

export const validateRegisterForm = (formData: RegisterFormdata) => {
    const errors: Record<string, string> = {};
    if (!validateUsername(formData.username)) {
        errors.username = 'Username must be 3-20 characters long and can only contain letters, numbers, and underscores.';
    }
    if (!validateEmail(formData.email)) {
        errors.email = 'Invalid email address.';
    }
    if (!validatePassword(formData.password)) {
        errors.password = 'Password must be at least 8 characters long.';
    }
    if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match.';
    }
    if (!validateBirthDate(formData.birthDate)) {
        errors.birthDate = 'You must be at least 18 years old.';
    }
    if (!formData.gdprConsent) {
        errors.gdprConsent = 'You must accept the GDPR consent.';
    }
    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};

export const validateLoginForm = (data: LoginFormdata) => {
    const errors: Record<string, string> = {};
    if (!validateEmail(data.email)) {
        errors.email = 'Invalid email address.';
    }
    if (!validatePassword(data.password)) {
        errors.password = 'Password must be at least 8 characters long.';
    }
    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};
