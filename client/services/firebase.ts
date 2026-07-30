import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyDxUOoGk4JkOQ7kpRrlIHod9Hac0THxr2g',
  authDomain: 'setitup-84173.firebaseapp.com',
  projectId: 'setitup-84173',
  storageBucket: 'setitup-84173.firebasestorage.app',
  messagingSenderId: '877154578492',
  appId: '1:877154578492:web:d8389e43936d0101511339',
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };