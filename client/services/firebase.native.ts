import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FirebaseAuth from "firebase/auth";
import {
  getAuth,
  initializeAuth,
  type Auth,
  type Persistence,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

import { app } from "./firebaseApp";

// Firebase include functia in pachetul React Native, dar nu si in tipurile comune.
const getReactNativePersistence = (
  FirebaseAuth as typeof FirebaseAuth & {
    getReactNativePersistence: (storage: typeof AsyncStorage) => Persistence;
  }
).getReactNativePersistence;

function isAlreadyInitializedError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "auth/already-initialized"
  );
}

function getNativeAuth(): Auth {
  try {
    return initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch (error) {
    // Fast Refresh poate reincarca modulul dupa ce Auth a fost deja initializat.
    if (isAlreadyInitializedError(error)) {
      return getAuth(app);
    }

    throw error;
  }
}

const auth = getNativeAuth();
const db = getFirestore(app);

export { app, auth, db };
