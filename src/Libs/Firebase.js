import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Use environment variables for Vercel deployment and local development.
// The variables are exposed to the browser via the NEXT_PUBLIC_ prefix.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Singleton pattern for Next.js to prevent multiple inits
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

let _auth = null;
export async function getAuthInstance() {
  if (_auth) return _auth;
  const { getAuth } = await import('firebase/auth');
  _auth = getAuth(app);
  return _auth;
}

export { app, db };