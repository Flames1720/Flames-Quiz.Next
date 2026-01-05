"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { doc, onSnapshot, setDoc, serverTimestamp } from "firebase/firestore";
import { db, getAuthInstance } from "../lib/firebase";

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubAuth = null;
    let unsubDb = null;
    let mounted = true;
    (async () => {
      const { onAuthStateChanged } = await import('firebase/auth');
      const auth = await getAuthInstance();
      unsubAuth = onAuthStateChanged(auth, async (u) => {
        if (!mounted) return;
        setUser(u);
        if (u) {
          // Real-time listener for user profile/stats
          unsubDb = onSnapshot(doc(db, 'artifacts', 'flames_quiz_app', 'users', u.uid), (docSnap) => {
            if (docSnap.exists()) {
              setUserData(docSnap.data());
            } else {
              // Init empty profile if missing
              setDoc(doc(db, 'artifacts', 'flames_quiz_app', 'users', u.uid), {
                email: u.email,
                joinedAt: serverTimestamp(),
                stats: { totalQuizzes: 0, totalQuestions: 0, totalScore: 0, categoryWins: {} }
              }, { merge: true });
            }
            setLoading(false);
          });
        } else {
          setUserData(null);
          setLoading(false);
        }
      });
    })();
    return () => { mounted = false; if (unsubAuth) unsubAuth(); if (unsubDb) unsubDb(); };
  }, []);

  const signInGuest = async () => {
      try {
        const { signInAnonymously } = await import('firebase/auth');
        const auth = await getAuthInstance();
        await signInAnonymously(auth);
      } catch (error) { console.error(error); alert("Connection Error"); }
  };

  // Do not render children until auth initialization completes to avoid
  // rendering inconsistent UI (pre-login flashes). Children will receive
  // the finalized `loading` state through context.
  return (
    <AuthContext.Provider value={{ user, userData, loading, signInGuest }}>
      {loading ? (
        <div className="min-h-screen flex items-center justify-center">
          <svg className="animate-spin h-10 w-10 text-orange-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
          </svg>
        </div>
      ) : children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);