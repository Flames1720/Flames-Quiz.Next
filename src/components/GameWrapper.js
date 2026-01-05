"use client";
import { useAuth } from "../context/AuthContext";
import GameEngine from "./GameEngine";
import ResultView from "./ResultView";
import NicknameModal from "./NicknameModal";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { doc, increment, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

export default function GameWrapper({ quiz }) {
  const { user, userData, loading, signInGuest } = useAuth();
  const [gameState, setGameState] = useState('start'); 
  const [result, setResult] = useState(null);
  const [showNickModal, setShowNickModal] = useState(false);

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-orange-500"/></div>;

  if (!user) {
     signInGuest();
     return <div className="text-slate-400 animate-pulse text-center mt-20">Igniting...</div>;
  }

  const handleFinish = async (res) => {
      setResult(res);
      setGameState('result');
      
      if (user && userData) {
          try {
              const userRef = doc(db, 'artifacts', 'flames_quiz_app', 'users', user.uid);
              const isWin = res.accuracy >= 70;
              await updateDoc(userRef, {
                  'stats.totalQuizzes': increment(1),
                  'stats.totalQuestions': increment(res.totalQuestions),
                  'stats.totalScore': increment(res.score),
                  [`stats.categoryWins.${quiz.category || 'General'}`]: increment(isWin ? 1 : 0)
              });
          } catch(e) { console.warn("Stat update failed", e); }
      }
  };

  const startGame = () => {
      if (!userData?.displayName) {
          setShowNickModal(true);
      } else {
          setGameState('playing');
      }
  };

  if (gameState === 'start') {
      return (
          <div className="flex items-center justify-center min-h-[50vh]">
          <div className="bg-slate-900/40 backdrop-blur-md p-8 rounded-xl border border-white/10 max-w-md w-full text-center">
              <h1 className="text-3xl font-bold mb-2">{quiz.title}</h1>
              <p className="text-slate-400 mb-6">{quiz.questions.length} Questions • {quiz.mode || 'Standard'}</p>
              <div className="text-xs text-orange-400 border border-orange-500/20 bg-orange-500/10 p-2 rounded mb-6">
                 Category: {quiz.category || 'General'}
              </div>
              
              <Button onClick={startGame} className="w-full py-3 bg-orange-600 text-white font-bold">IGNITE</Button>
              
              <div className="mt-4 text-xs text-slate-500">
                  <Link href="/dashboard" className="hover:text-white underline">Back to Library</Link>
              </div>
              
              {showNickModal && <NicknameModal user={user} onComplete={() => { setShowNickModal(false); setGameState('playing'); }} />}
          </div>
          </div>
      );
  }

  if (gameState === 'result' && result) {
      return <ResultView result={result} onHome={() => window.location.href = '/dashboard'} />;
  }

  return (
    <GameEngine quiz={quiz} user={user} playerName={userData?.displayName || 'Guest'} onFinish={handleFinish} onExit={() => setGameState('start')} />
  );
}