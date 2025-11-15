"use client";

import { ReactNode } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { LoginScreen } from '@/components/auth/LoginScreen';

export function AuthGate({ children }: { children: ReactNode }) {
  const { authenticated, hydrated } = useAuth();

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
