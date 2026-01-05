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

  return (
    <AuthContext.Provider value={{ user, userData, loading, signInGuest }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);