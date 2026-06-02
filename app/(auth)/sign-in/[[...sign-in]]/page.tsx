'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AuthShell } from '@/components/auth/auth-shell';
import { Button } from '@/components/ui/button';
import { isAdminRole } from '@/lib/roles';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams?.get('error') === 'admin_required') {
      setError('Admin access only. Sign in with your dealership admin account.');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Sign in failed');
      }

      localStorage.setItem('authToken', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      const redirectTo = searchParams?.get('redirect');
      if (redirectTo && redirectTo.startsWith('/')) {
        window.location.assign(redirectTo);
        return;
      }

      window.location.assign(isAdminRole(data.user?.role) ? '/admin' : '/');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle={
        <>
          New here?{' '}
          <Link href="/sign-up" className="font-medium text-primary hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        {error && (
          <div
            className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
            role="alert"
          >
            {error}
          </div>
        )}

        <div>
          <label htmlFor="email" className="auth-label">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="auth-input"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="password" className="auth-label">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="auth-input"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
    </AuthShell>
  );
}
