export const getFirebaseErrorMessage = (errorCode: string): string => {
    const errorMessages: Record<string, string> = {
        'auth/email-already-in-use': 'This email address is already in use.',
        'auth/invalid-email': 'The email address is not valid.',
        'auth/weak-password': 'The password is too weak.',
        'auth/invalid-credential': 'Email or password is incorrect.',
        'auth/too-many-requests': 'Too many requests. Please try again later.'
    };
    return errorMessages[errorCode] || 'An unknown error occurred.';
};
