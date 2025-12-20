"use client";
import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../lib/firebase";
import { collection, query, where, getDocs, orderBy, doc, getDoc, setDoc, serverTimestamp, updateDoc } from "firebase/firestore"; 
import QuizCreator from "../../components/QuizCreator";
import Link from "next/link";
import { Edit3, Share2, Plus, Loader2, Play, Crown, Clock, Flame, CreditCard, ShieldCheck, Lock, XCircle, Search, BarChart3, BookOpen, User } from "lucide-react";
import { GlassCard, Button } from "../../components/ui/Shared";

// 🔐 SECURE VARIABLES (Loaded from .env.local)
const ADMIN_EMAIL_VAR = process.env.NEXT_PUBLIC_ADMIN_EMAIL || "kingflames200717@gmail.com"; 
const DEV_KEY_VAR = process.env.NEXT_PUBLIC_DEV_KEY || "FLAMES2025"; 

export default function Dashboard() {
  const { user, userData, loading } = useAuth();
  const [quizzes, setQuizzes] = useState([]); 
  const [view, setView] = useState('library'); 
  const [editData, setEditData] = useState(null);
  const [findCode, setFindCode] = useState(""); 
  const [showPay, setShowPay] = useState(false);
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [devKeyInput, setDevKeyInput] = useState("");

  // 1. Fetch Logic
  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
        let q;
        if (view === 'library') {
            q = query(collection(db, 'artifacts', 'flames_quiz_app', 'public', 'data', 'quizzes'), orderBy("createdAt", "desc"));
        } else {
            q = query(collection(db, 'artifacts', 'flames_quiz_app', 'public', 'data', 'quizzes'), where("creatorId", "==", user.uid), orderBy("createdAt", "desc"));
        }

        try {
            const snap = await getDocs(q);
            setQuizzes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch(e) { console.error(e); }
    };
    fetch();
  }, [user, view]);

  const handleBecomeCreator = async () => {
      if(user) {
          await setDoc(doc(db, 'artifacts', 'flames_quiz_app', 'users', user.uid), { 
               isCreator: true, joinedAt: serverTimestamp() 
          }, { merge: true });
          setShowPay(false);
          alert("You are now a Creator!");
          window.location.reload();
      }
  };
  
  const handleDevLogin = (e) => {
      e.preventDefault();
      if(devKeyInput === DEV_KEY_VAR) {
          setShowKeyInput(false);
          // Grant temporary admin view locally or update profile if desired
          alert("Developer Key Accepted. You have admin privileges.");
      } else {
          alert("Invalid Key");
      }
  };

  const handleFindQuiz = async () => {
      if(!findCode) return;
      try {
          const docRef = doc(db, 'artifacts', 'flames_quiz_app', 'public', 'data', 'quizzes', findCode.trim());
          const snap = await getDoc(docRef);
          if(snap.exists()) {
              window.location.href = `/quiz/${findCode}`;
          } else {
              alert("Quiz not found!");
          }
      } catch(e) { alert("Error finding quiz"); }
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-orange-500"/></div>;
  if (!user) return <div className="text-center p-20">Please log in.</div>;

  const isAdmin = user.email === ADMIN_EMAIL_VAR;
  const isCreator = userData?.isCreator || isAdmin;

  return (
    <div className="max-w-5xl mx-auto p-6 min-h-screen">
      {/* HEADER */}
      <header className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-slate-400 text-sm">Welcome, {userData?.displayName || 'Guest'}</p>
        </div>
        
        <div className="flex gap-2 flex-wrap justify-center">
            <Link href="/profile"><Button variant="secondary"><User size={18}/> Profile</Button></Link>
            <Button variant={view==='library'?'primary':'secondary'} onClick={()=>setView('library')}><BookOpen size={18}/> Library</Button>
            {isCreator && <Button variant={view==='create'?'primary':'secondary'} onClick={()=>setView('create')}><Plus size={18}/> Creator</Button>}
            {!isCreator && <Button variant="secondary" className="bg-yellow-600/20 text-yellow-400" onClick={()=>setShowPay(true)}><Crown size={18}/> Upgrade</Button>}
            {isAdmin && <Button variant="secondary" className="bg-purple-900/20 text-purple-400"><BarChart3 size={18}/> Admin</Button>}
            {!isAdmin && !isCreator && <Button variant="ghost" onClick={()=>setShowKeyInput(true)} className="text-xs text-slate-500"><Lock size={14}/></Button>}
        </div>
      </header>

      {/* MODALS */}
      {showPay && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
              <div className="bg-white text-slate-900 rounded-xl p-8 max-w-sm w-full text-center relative">
                  <button onClick={() => setShowPay(false)} className="absolute top-4 right-4 text-slate-400"><XCircle/></button>
                  <h3 className="text-xl font-bold mb-4 flex justify-center items-center gap-2"><CreditCard className="text-green-600"/> Creator Pass</h3>
                  <button onClick={handleBecomeCreator} className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded font-bold flex justify-center gap-2 items-center">Pay ₦5,000 <ShieldCheck size={16}/></button>
              </div>
          </div>
      )}

      {showKeyInput && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
             <GlassCard className="max-w-sm w-full">
                 <h3 className="text-xl font-bold mb-4">Dev Access</h3>
                 <form onSubmit={handleDevLogin}>
                     <input type="password" placeholder="Key" value={devKeyInput} onChange={e=>setDevKeyInput(e.target.value)} className="w-full p-3 rounded mb-4 bg-slate-950/50 border border-white/20 text-white"/>
                     <Button className="w-full">Unlock</Button>
                     <Button type="button" variant="ghost" className="mt-2 w-full" onClick={()=>setShowKeyInput(false)}>Close</Button>
                 </form>
             </GlassCard>
          </div>
      )}
      
      {/* FIND QUIZ BAR */}
      {view === 'library' && (
          <div className="mb-8 flex gap-2">
              <input value={findCode} onChange={e=>setFindCode(e.target.value)} placeholder="Paste Quiz Code / ID" className="flex-1 p-3 rounded-lg bg-slate-900 border border-white/10 text-white" />
              <Button onClick={handleFindQuiz} variant="secondary"><Search size={18}/></Button>
          </div>
      )}

      {/* VIEWS */}
      {view === 'create' ? (
        <QuizCreator user={user} initialData={editData} onPublish={() => setView('library')} />
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizzes.map(q => (
            <div key={q.id} className="bg-slate-900/50 border border-white/10 p-6 rounded-xl backdrop-blur-md hover:border-orange-500 transition-colors relative overflow-hidden group">
               <div className="absolute top-0 right-0 bg-white/5 px-2 py-1 text-[10px] uppercase text-slate-400 rounded-bl-lg">{q.category || 'General'}</div>
               
              <div className="flex justify-between items-start mb-2">
                   <div className="p-2 bg-white/5 rounded-lg">
                       {q.timeLimit ? <Clock size={20} className="text-orange-400"/> : <Flame size={20} className="text-red-400"/>}
                   </div>
              </div>
              <h3 className="font-bold text-xl mb-1">{q.title}</h3>
              <p className="text-xs text-slate-500 mb-4">By {q.creatorName || 'Anonymous'}</p>
              
              <div className="flex items-center justify-between mt-4">
                  <span className="text-xs text-slate-400">{q.questions?.length} Qs</span>
                  <div className="flex gap-2">
                    {(isCreator && q.creatorId === user.uid) && (
                        <button onClick={() => { setEditData(q); setView('create'); }} className="p-2 bg-white/5 rounded hover:bg-white/10"><Edit3 size={16}/></button>
                    )}
                    <button onClick={() => {
                        const url = `${window.location.origin}/quiz/${q.id}`;
                        navigator.clipboard.writeText(url);
                        alert("Link copied! ID: " + q.id);
                    }} className="p-2 bg-white/5 rounded hover:bg-purple-500/20 text-purple-400" title="Copy Link/Code"><Share2 size={16}/></button>
                    <Link href={`/quiz/${q.id}`} className="p-2 bg-white/5 rounded hover:bg-green-500/20 text-green-400"><Play size={16}/></Link>
                  </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}