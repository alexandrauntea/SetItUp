import { doc, getDoc, setDoc } from 'firebase/firestore';
import { DEFAULT_PREFERENCES, preferencesService, validatePreferences } from '../preferencesService';

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
}));

jest.mock('../firebase', () => ({
  db: {},
}));

describe('preferencesService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validatePreferences', () => {
    it('returns error when minAge is less than 18', () => {
      const err = validatePreferences({ minAge: 16, maxAge: 25, genderPreference: 'everyone', interests: [] });
      expect(err).toBe('Vârsta minimă trebuie să fie de cel puțin 18 ani.');
    });

    it('returns error when maxAge is smaller than minAge', () => {
      const err = validatePreferences({ minAge: 30, maxAge: 20, genderPreference: 'everyone', interests: [] });
      expect(err).toBe('Vârsta maximă nu poate fi mai mică decât vârsta minimă.');
    });

    it('returns error when maxAge exceeds 100', () => {
      const err = validatePreferences({ minAge: 20, maxAge: 105, genderPreference: 'everyone', interests: [] });
      expect(err).toBe('Vârsta maximă nu poate depăși 100 de ani.');
    });

    it('returns null for valid preferences', () => {
      const err = validatePreferences({ minAge: 20, maxAge: 30, genderPreference: 'female', interests: ['sport'] });
      expect(err).toBeNull();
    });
  });

  describe('getOwnerPreferences', () => {
    it('throws error if ownerId is missing', async () => {
      await expect(preferencesService.getOwnerPreferences('')).rejects.toThrow('Owner ID-ul este obligatoriu.');
    });

    it('returns saved preferences if document exists', async () => {
      (doc as jest.Mock).mockReturnValue('docRef');
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        data: () => ({ minAge: 22, maxAge: 35, genderPreference: 'male', interests: ['music'] }),
      });

      const prefs = await preferencesService.getOwnerPreferences('owner123');
      expect(prefs).toEqual({
        minAge: 22,
        maxAge: 35,
        genderPreference: 'male',
        interests: ['music'],
      });
    });

    it('returns default preferences if document does not exist', async () => {
      (doc as jest.Mock).mockReturnValue('docRef');
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => false,
      });

      const prefs = await preferencesService.getOwnerPreferences('owner123');
      expect(prefs).toEqual(DEFAULT_PREFERENCES);
    });
  });

  describe('saveOwnerPreferences', () => {
    it('throws error if ownerId is missing', async () => {
      await expect(
        preferencesService.saveOwnerPreferences('', { minAge: 20, maxAge: 30, genderPreference: 'everyone', interests: [] })
      ).rejects.toThrow('Owner ID-ul este obligatoriu.');
    });

    it('saves preferences successfully when valid', async () => {
      (doc as jest.Mock).mockReturnValue('docRef');
      (setDoc as jest.Mock).mockResolvedValue(undefined);

      const validPrefs = { minAge: 20, maxAge: 30, genderPreference: 'female' as const, interests: ['reading'] };
      await preferencesService.saveOwnerPreferences('owner123', validPrefs);

      expect(setDoc).toHaveBeenCalledWith('docRef', expect.objectContaining(validPrefs), { merge: true });
    });
  });
});