import type { User, UserCredential } from "firebase/auth";
import {
  createUserWithEmailAndPassword,
  deleteUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";

jest.mock("firebase/auth", () => ({
  createUserWithEmailAndPassword: jest.fn(),
  deleteUser: jest.fn(),
  onAuthStateChanged: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
}));

jest.mock("../firebase", () => ({
  auth: {
    currentUser: null,
  },
}));

import { auth } from "../firebase";
import {
  deleteCurrentUserAccount,
  loginUser,
  logoutUser,
  registerUser,
  subscribeToAuthChanges,
} from "../authService";

const mockedCreateUser = jest.mocked(createUserWithEmailAndPassword);
const mockedDeleteUser = jest.mocked(deleteUser);
const mockedOnAuthStateChanged = jest.mocked(onAuthStateChanged);
const mockedSignIn = jest.mocked(signInWithEmailAndPassword);
const mockedSignOut = jest.mocked(signOut);

const fakeUser = {
  uid: "user-123",
  email: "andrei@email.com",
} as User;

const fakeCredential = {
  user: fakeUser,
} as UserCredential;

function setCurrentUser(user: User | null) {
  (auth as typeof auth & { currentUser: User | null }).currentUser = user;
}

describe("Serviciul de autentificare", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setCurrentUser(null);
  });

  test("înregistrează utilizatorul și returnează contul creat", async () => {
    mockedCreateUser.mockResolvedValue(fakeCredential);

    const result = await registerUser("andrei@email.com", "parola123");

    expect(mockedCreateUser).toHaveBeenCalledTimes(1);
    expect(mockedCreateUser).toHaveBeenCalledWith(
      auth,
      "andrei@email.com",
      "parola123",
    );
    expect(result).toBe(fakeUser);
  });

  test("transmite eroarea primită la înregistrare", async () => {
    const firebaseError = { code: "auth/email-already-in-use" };
    mockedCreateUser.mockRejectedValue(firebaseError);

    await expect(
      registerUser("andrei@email.com", "parola123"),
    ).rejects.toBe(firebaseError);
  });

  test("autentifică utilizatorul și returnează contul", async () => {
    mockedSignIn.mockResolvedValue(fakeCredential);

    const result = await loginUser("andrei@email.com", "parola123");

    expect(mockedSignIn).toHaveBeenCalledTimes(1);
    expect(mockedSignIn).toHaveBeenCalledWith(
      auth,
      "andrei@email.com",
      "parola123",
    );
    expect(result).toBe(fakeUser);
  });

  test("transmite eroarea primită la autentificare", async () => {
    const firebaseError = { code: "auth/invalid-credential" };
    mockedSignIn.mockRejectedValue(firebaseError);

    await expect(
      loginUser("andrei@email.com", "parola-gresita"),
    ).rejects.toBe(firebaseError);
  });

  test("deconectează utilizatorul", async () => {
    mockedSignOut.mockResolvedValue(undefined);

    await logoutUser();

    expect(mockedSignOut).toHaveBeenCalledTimes(1);
    expect(mockedSignOut).toHaveBeenCalledWith(auth);
  });

  test("șterge utilizatorul autentificat", async () => {
    setCurrentUser(fakeUser);
    mockedDeleteUser.mockResolvedValue(undefined);

    await deleteCurrentUserAccount();

    expect(mockedDeleteUser).toHaveBeenCalledTimes(1);
    expect(mockedDeleteUser).toHaveBeenCalledWith(fakeUser);
  });

  test("nu încearcă ștergerea dacă nu există utilizator autentificat", async () => {
    await deleteCurrentUserAccount();

    expect(mockedDeleteUser).not.toHaveBeenCalled();
  });

  test("se abonează la schimbările autentificării", () => {
    const callback = jest.fn();
    const unsubscribe = jest.fn();
    mockedOnAuthStateChanged.mockReturnValue(unsubscribe);

    const result = subscribeToAuthChanges(callback);

    expect(mockedOnAuthStateChanged).toHaveBeenCalledTimes(1);
    expect(mockedOnAuthStateChanged).toHaveBeenCalledWith(auth, callback);
    expect(result).toBe(unsubscribe);
  });
});
