"use client";
import { useAuth } from "../context/AuthContext";
import { Flame, ArrowRight, LayoutDashboard, User, LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";
import { auth } from "../lib/firebase";

export default function Home() {
  const { user, signInGuest } = useAuth();
  const router = useRouter();

  const handleStart = async () => {
    if (!user) await signInGuest();
    router.push("/dashboard");
  };

  const handleGoogle = async () => {
    try { await signInWithPopup(auth, new GoogleAuthProvider()); } catch (e) { alert(e.message); }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center p-6">
      {/* Nav */}
      <nav className="absolute top-0 w-full p-6 flex justify-between items-center max-w-7xl">
        <div className="flex items-center gap-2 font-bold text-xl cursor-pointer"><Flame className="text-orange-500"/> Flames</div>
        {user ? (
             <div className="flex gap-2">
                 <Link href="/dashboard" className="p-2 bg-white/10 rounded-full hover:bg-white/20"><LayoutDashboard size={20}/></Link>
                 <button onClick={() => signOut(auth)} className="p-2 bg-white/10 rounded-full hover:bg-red-500/20"><LogOut size={20}/></button>
             </div>
        ) : (
             <button onClick={handleGoogle} className="text-sm bg-white/10 px-4 py-2 rounded-lg hover:bg-white/20 flex items-center gap-2"><User size={16}/> Login</button>
        )}
      </nav>

      <div className="relative mb-6">
         <div className="absolute inset-0 bg-orange-500 blur-[80px] opacity-20 animate-pulse"></div>
         <Flame size={120} className="text-orange-500 relative z-10 drop-shadow-lg" />
      </div>
      <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-200 via-white to-orange-200 tracking-tight mb-4">
        IGNITE YOUR MIND
      </h1>
      
      <div className="flex gap-4 justify-center">
        <button onClick={handleStart} className="px-8 py-4 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg font-bold shadow-lg hover:scale-105 transition-transform flex items-center gap-2">
          Available Quizzes <ArrowRight size={20}/>
        </button>
      </div>
    </div>
  );
}