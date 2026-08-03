import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

import { app } from "./firebaseApp";

const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
