"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signInAnonymously } from "firebase/auth";
import { doc, onSnapshot, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../lib/firebase";

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        // Real-time listener for user profile/stats
        const unsubDb = onSnapshot(doc(db, 'artifacts', 'flames_quiz_app', 'users', u.uid), (docSnap) => {
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
        return () => unsubDb();
      } else {
        setUserData(null);
        setLoading(false);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  const signInGuest = async () => {
      try { await signInAnonymously(auth); } 
      catch (error) { console.error(error); alert("Connection Error"); }
  };

  return (
    <AuthContext.Provider value={{ user, userData, loading, signInGuest }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);