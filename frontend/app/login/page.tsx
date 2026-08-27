'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const result = await login(email, password);

    setSubmitting(false);
    if (result.error) {
      setError(result.error);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-950 px-4">
      <div className="w-full max-w-sm">
        <h1 className="mb-1 text-center text-2xl font-bold text-white">
          Lucy CTF
        </h1>
        <p className="mb-8 text-center text-sm text-neutral-400">
          Welcome back
        </p>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-xl border border-neutral-800 bg-neutral-900 p-6"
        >
          {error && (
            <div className="rounded-md border border-red-900 bg-red-950 px-3 py-2 text-sm text-red-300">
              {error}
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm text-neutral-300">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-white outline-none focus:border-emerald-600"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-neutral-300">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-white outline-none focus:border-emerald-600"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-emerald-700 px-3 py-2 font-medium text-white transition hover:bg-emerald-600 disabled:opacity-50"
          >
            {submitting ? 'Logging in...' : 'Log in'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-neutral-400">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-emerald-500 hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
