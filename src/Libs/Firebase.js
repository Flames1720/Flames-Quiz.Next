import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// 🔴 YOUR OFFICIAL KEYS 🔴
const firebaseConfig = {
  apiKey: "AIzaSyDU1MfXwiC_LVFqu4QR775EQMBGYTfArWg",
  authDomain: "quiz-app-ee0b5.firebaseapp.com",
  projectId: "quiz-app-ee0b5",
  storageBucket: "quiz-app-ee0b5.firebasestorage.app",
  messagingSenderId: "464369151452",
  appId: "1:464369151452:web:fd8260e04610bc1470f319",
  measurementId: "G-KVNHVQV81F"
};

// Singleton pattern for Next.js to prevent multiple inits
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };