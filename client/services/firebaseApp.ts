import { getApp, getApps, initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyDxUOoGk4JkOQ7kpRrlIHod9Hac0THxr2g",
  authDomain: "setitup-84173.firebaseapp.com",
  projectId: "setitup-84173",
  storageBucket: "setitup-84173.firebasestorage.app",
  messagingSenderId: "877154578492",
  appId: "1:877154578492:web:d8389e43936d0101511339",
};

// Refolosim instanta existenta in timpul Fast Refresh.
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export { app };
