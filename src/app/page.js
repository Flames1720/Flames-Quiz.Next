"use client";
import { useAuth } from "../context/AuthContext";
import { useEffect } from 'react';
import { Flame, ArrowRight, LayoutDashboard, User, LogOut, Share2, Edit3, Trophy } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GlassCard, Button } from "../components/ui/Shared";

export default function Home() {
  const { user, signInGuest, signInWithGoogle, signOutUser } = useAuth();
  const router = useRouter();

  // Redirect unauthenticated users to the login page
  useEffect(() => {
    if (user === null) return; // still loading state handled by AuthProvider
    if (!user) router.push('/login');
  }, [user]);

  const handleStart = async () => {
    if (!user) await signInGuest();
    router.push("/dashboard");
  };

  const handleGoogle = async () => {
    await signInWithGoogle();
  };

  if (!user) return null;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center p-6">
      {/* Nav */}
      <nav className="absolute top-0 w-full p-6 flex justify-between items-center max-w-7xl">
        <div className="flex items-center gap-2 font-extrabold text-xl cursor-pointer text-white"><Flame className="text-orange-400"/> Flames</div>
           {user ? (
             <div className="flex gap-2">
              <Button variant="ghost" onClick={() => router.push('/dashboard')} className="p-2"><LayoutDashboard size={20}/></Button>
              <Button variant="ghost" onClick={signOutUser} className="p-2"><LogOut size={20}/></Button>
             </div>
        ) : (
             <div className="flex items-center gap-3">
            <Button onClick={() => router.push('/login')} className="px-4 py-2 flex items-center gap-2"><User size={16}/> Login</Button>
            <Link href="/dashboard" className="text-sm text-slate-300 underline">Browse</Link>
             </div>
        )}
      </nav>

      <div className="relative mb-6 w-full max-w-3xl">
         <div className="absolute inset-0 -z-10">
            <div className="absolute -left-40 -top-20 w-[420px] h-[420px] bg-red-600 rounded-full blur-[120px] opacity-20 float-slow"></div>
            <div className="absolute right-[-80px] top-24 w-[360px] h-[360px] bg-orange-500 rounded-full blur-[120px] opacity-18 float-slow animation-delay-2000"></div>
         </div>
         <div className="flex items-center justify-center">
           <div className="relative z-10 flex items-center justify-center">
             <div className="p-6 rounded-full bg-gradient-to-br from-orange-600/20 to-orange-400/10 glass-refined pulse-flame">
               <Flame size={120} className="text-orange-300 drop-shadow-xl" />
             </div>
           </div>
         </div>
      </div>

      <h1 className="text-5xl md:text-6xl font-extrabold text-white tracking-tight mb-4 leading-tight">
        IGNITE YOUR MIND
      </h1>
      <p className="max-w-2xl text-slate-300 mb-6">Fast, beautiful quizzes with LaTeX support, downloadable result cards, and an authoring studio for creators.</p>

      <div className="flex gap-4 justify-center mb-12">
        <Button onClick={handleStart} className="px-8 py-4 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg font-bold shadow-lg hover:scale-105 transition-transform flex items-center gap-2">
          Available Quizzes <ArrowRight size={20}/>
        </Button>
        <Button variant="secondary" onClick={() => router.push('/dashboard')}>Library</Button>
      </div>

      <div className="w-full max-w-5xl grid md:grid-cols-3 gap-6 px-4">
         <GlassCard className="flex flex-col items-start p-6">
             <div className="flex items-center gap-3 mb-4"><Trophy className="text-cyan-400"/> <h3 className="text-lg font-bold">Play</h3></div>
             <p className="text-sm text-slate-300">Timed and untimed quizzes, study & test modes, and instant insights.</p>
         </GlassCard>
         <GlassCard className="flex flex-col items-start p-6">
             <div className="flex items-center gap-3 mb-4"><Edit3 className="text-orange-400"/> <h3 className="text-lg font-bold">Create</h3></div>
             <p className="text-sm text-slate-300">Fast authoring with plaintext parser and one-click publish to your library.</p>
         </GlassCard>
         <GlassCard className="flex flex-col items-start p-6">
             <div className="flex items-center gap-3 mb-4"><Share2 className="text-purple-400"/> <h3 className="text-lg font-bold">Share</h3></div>
             <p className="text-sm text-slate-300">Export results as an image and share deep links for instant play.</p>
         </GlassCard>
      </div>
    </div>
  );
}