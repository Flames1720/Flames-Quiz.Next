"use client";
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { GlassCard, Button } from '../../components/ui/Shared';
import { Flame } from 'lucide-react';

export default function AuthPage() {
  const { user, loading, signInWithGoogle, signInGuest } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.replace('/dashboard');
  }, [user, loading]);

  const handleGoogle = async () => {
    await signInWithGoogle();
  };

  const handleGuest = async () => {
    await signInGuest();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-950 to-slate-900 p-6 relative overflow-hidden">
      {/* Aurora orbs (subtle behind auth card) */}
      <div aria-hidden className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute -left-52 -top-24 w-[520px] h-[520px] rounded-full blur-[140px] opacity-20 bg-red-600 animate-blob"></div>
        <div className="absolute right-[-120px] top-8 w-[480px] h-[480px] rounded-full blur-[140px] opacity-18 bg-orange-500 animate-blob animation-delay-2000"></div>
      </div>

      <GlassCard className="max-w-md w-full text-center">
        <div className="mx-auto mb-4 inline-flex items-center justify-center p-4 rounded-full bg-orange-600/10">
          <Flame size={36} className="text-orange-300" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Identify Yourself</h1>
        <p className="text-slate-400 mb-6">Sign in to access your library, create quizzes, and track results.</p>

        <div className="space-y-3">
          <Button onClick={handleGoogle} className="w-full bg-white text-slate-900">Sign in with Google</Button>
          <Button variant="secondary" onClick={handleGuest} className="w-full">Continue as Guest</Button>
        </div>
      </GlassCard>
    </div>
  );
}
