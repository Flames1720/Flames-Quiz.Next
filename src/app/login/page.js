++ /workspaces/Flames-Quiz.Next/src/app/login/page.js
"use client";
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { GlassCard, Button } from '../../components/ui/Shared';
import { Flame } from 'lucide-react';

export default function LoginPage() {
  const { user, loading, signInGuest, signInWithGoogle } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.replace('/');
  }, [user, loading]);

  const handleGoogle = async () => {
    await signInWithGoogle();
  };

  const handleGuest = async () => {
    await signInGuest();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-950 to-slate-900 p-6">
      <GlassCard className="max-w-md w-full text-center">
        <div className="mx-auto mb-4 inline-flex items-center justify-center p-4 rounded-full bg-orange-600/10">
          <Flame size={36} className="text-orange-300" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Welcome to Flames</h1>
        <p className="text-slate-400 mb-6">Sign in to access your library, create quizzes, and track results.</p>

        <div className="space-y-3">
          <Button onClick={handleGoogle} className="w-full" >Sign in with Google</Button>
          <Button variant="secondary" onClick={handleGuest} className="w-full">Continue as Guest</Button>
        </div>

        <div className="mt-6 text-xs text-slate-500">By continuing you agree to the app's terms.</div>
      </GlassCard>
    </div>
  );
}
