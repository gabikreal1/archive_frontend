"use client";

import { ReactNode, useEffect, useState } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { LoginScreen } from '@/components/auth/LoginScreen';

export function AuthGate({ children }: { children: ReactNode }) {
  const { authenticated, hydrated } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <p className="text-sm text-white/70">Loading…</p>
      </div>
    );
  }

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <p className="text-sm text-white/70">Checking session…</p>
      </div>
    );
  }

  if (!authenticated) {
    return <LoginScreen />;
  }

  return <>{children}</>;
}
