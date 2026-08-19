import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

export interface FeedPreferences {
  minAge: number;
  maxAge: number;
  genderPreference: 'male' | 'female' | 'everyone';
  interests: string[];
}

export const DEFAULT_PREFERENCES: FeedPreferences = {
  minAge: 18,
  maxAge: 50,
  genderPreference: 'everyone',
  interests: [],
};

export const validatePreferences = (prefs: FeedPreferences): string | null => {
  if (isNaN(prefs.minAge) || isNaN(prefs.maxAge)) {
    return 'Vârsta minimă și vârsta maximă trebuie să fie numere valide.';
  }
  if (prefs.minAge < 18) {
    return 'Vârsta minimă trebuie să fie de cel puțin 18 ani.';
  }
  if (prefs.maxAge < prefs.minAge) {
    return 'Vârsta maximă nu poate fi mai mică decât vârsta minimă.';
  }
  if (prefs.maxAge > 100) {
    return 'Vârsta maximă nu poate depăși 100 de ani.';
  }
  if (!['male', 'female', 'everyone'].includes(prefs.genderPreference)) {
    return 'Genul selectat este invalid.';
  }
  return null;
};

export const preferencesService = {
  async getOwnerPreferences(ownerId: string): Promise<FeedPreferences> {
    if (!ownerId) {
      throw new Error('Owner ID-ul este obligatoriu.');
    }
    const prefRef = doc(db, 'preferences', ownerId);
    const snap = await getDoc(prefRef);
    if (snap.exists()) {
      const data = snap.data() as Partial<FeedPreferences>;
      return {
        minAge: data.minAge ?? DEFAULT_PREFERENCES.minAge,
        maxAge: data.maxAge ?? DEFAULT_PREFERENCES.maxAge,
        genderPreference: data.genderPreference ?? DEFAULT_PREFERENCES.genderPreference,
        interests: Array.isArray(data.interests) ? data.interests : DEFAULT_PREFERENCES.interests,
      };
    }
    return DEFAULT_PREFERENCES;
  },

  async saveOwnerPreferences(ownerId: string, prefs: FeedPreferences): Promise<void> {
    if (!ownerId) {
      throw new Error('Owner ID-ul este obligatoriu.');
    }
    const error = validatePreferences(prefs);
    if (error) {
      throw new Error(error);
    }
    const prefRef = doc(db, 'preferences', ownerId);
    await setDoc(
      prefRef,
      {
        ...prefs,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  },
};