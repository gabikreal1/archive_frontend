"use client";

import { FormEvent, useState } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { Button, Card, Input } from '@/components/shared/ui';

const DEFAULT_EMAIL = process.env.NEXT_PUBLIC_DEMO_EMAIL ?? 'user@example.com';

export function LoginScreen() {
  const { signIn, loading } = useAuth();
  const [email, setEmail] = useState(DEFAULT_EMAIL);
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
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-6">
      <Card className="w-full max-w-md space-y-6 bg-slate-900/80 p-6">
        <div>
          <p className="text-sm uppercase tracking-wide text-sky-300/80">Welcome</p>
          <h1 className="text-2xl font-bold text-white">Sign in to continue</h1>
          <p className="text-sm text-white/60">Enter any email and password to begin.</p>
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
              placeholder="you@example.com"
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
              placeholder="••••••••"
            />
            <p className="text-xs text-white/40">Password is not stored and only for appearance.</p>
          </div>
          {error && <p className="text-sm text-rose-300">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Signing in…' : 'Continue'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
