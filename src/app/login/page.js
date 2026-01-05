"use client";
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { GlassCard, Button } from '../../components/ui/Shared';
import { Flame } from 'lucide-react';

export default function LoginPage() {
  // Redirect legacy /login to /auth
  const router = useRouter();
  useEffect(() => { router.replace('/auth'); }, []);
  return null;
}
