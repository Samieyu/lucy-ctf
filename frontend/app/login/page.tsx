'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [needs2FA, setNeeds2FA] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const result = await login(email, password, needs2FA ? twoFactorCode.trim() : undefined);

    setSubmitting(false);
    if (result.requires2FA) {
      setNeeds2FA(true);
    } else if (result.error) {
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

          {!needs2FA ? (
            <>
              <div>
                <label className="mb-1 block text-sm text-neutral-300">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-white outline-none focus:border-emerald-600 font-sans text-sm"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm text-neutral-300">
                    Password
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-xs text-neutral-400 hover:text-emerald-400 font-mono"
                  >
                    Forgot password?
                  </Link>
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-white outline-none focus:border-emerald-600 font-sans text-sm"
                  placeholder="••••••••"
                />
              </div>
            </>
          ) : (
            <div className="space-y-2">
              <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-800 text-xs text-emerald-300">
                Two-factor authentication is active on this account. Enter your 6-digit authenticator code or backup key.
              </div>
              <label className="mb-1 block text-sm text-neutral-300 font-mono">
                2FA Verification Code
              </label>
              <input
                type="text"
                required
                autoFocus
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value)}
                className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-white font-mono text-center tracking-widest text-lg outline-none focus:border-emerald-600"
                placeholder="123456"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-emerald-700 px-3 py-2 font-medium text-white transition hover:bg-emerald-600 disabled:opacity-50"
          >
            {submitting ? 'Authenticating...' : needs2FA ? 'Verify 2FA & Log in' : 'Log in'}
          </button>

          {needs2FA && (
            <button
              type="button"
              onClick={() => {
                setNeeds2FA(false);
                setTwoFactorCode('');
              }}
              className="w-full text-center text-xs text-neutral-400 hover:text-white"
            >
              &larr; Back to login
            </button>
          )}
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
