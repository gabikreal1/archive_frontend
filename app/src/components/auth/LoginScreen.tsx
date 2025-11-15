"use client";

import Image from 'next/image';
import { FormEvent, useState } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { Button, Card, Input } from '@/components/shared/ui';

export function LoginScreen() {
  const { signIn, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    try {
      await signIn(email);
    } catch (err) {
      console.error('Login failed', err);
      setError('Unable to sign in. Please try again.');
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 p-6 text-center">
      <div className="flex flex-1 flex-col items-center justify-center gap-6 -translate-y-24 sm:-translate-y-32 md:-translate-y-40 lg:-translate-y-56">
        <div className="flex flex-col items-center gap-3">
          <Image
            src="/images/icon-512-removebg-preview.png"
            alt="ArcHive icon"
            width={160}
            height={160}
            priority
          />
          <p className="text-2xl font-semibold text-white">Welcome to ArcHive!</p>
        </div>
        <Card className="w-full max-w-md space-y-6 bg-slate-900/80 p-6 text-left">
          <div>
            <h1 className="text-2xl font-bold text-white">Sign in to continue</h1>
            <p className="text-sm text-white/60">Enter your email and password to begin.</p>
          </div>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-xs font-medium uppercase text-white/60" htmlFor="login-email">
                Email
              </label>
              <Input
                id="login-email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium uppercase text-white/60" htmlFor="login-password">
                Password
              </label>
              <Input
                id="login-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
            {error && <p className="text-sm text-rose-300">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in…' : 'Continue'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
