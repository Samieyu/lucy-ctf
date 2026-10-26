'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || loading) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        setSubmitted(true);
      } else {
        setError(data.message || 'Error processing password reset request.');
      }
    } catch {
      setError('Network error. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-950 px-4">
      <div className="w-full max-w-sm">
        <h1 className="mb-1 text-center text-2xl font-bold text-white">Lucy CTF</h1>
        <p className="mb-8 text-center text-sm text-neutral-400">Account Recovery</p>

        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6 space-y-4">
          {submitted ? (
            <div className="space-y-4 text-center">
              <div className="w-12 h-12 mx-auto rounded-full bg-emerald-950 border border-emerald-700 text-emerald-400 flex items-center justify-center text-xl">
                ✓
              </div>
              <h2 className="text-base font-bold text-white">Recovery Email Sent</h2>
              <p className="text-xs text-neutral-300 leading-relaxed font-sans">
                If an account exists for <strong className="text-emerald-400">{email}</strong>, we have dispatched a password reset link. Check your inbox and follow the instructions.
              </p>
              <div className="pt-2">
                <Link
                  href="/login"
                  className="inline-block px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-mono text-neutral-200"
                >
                  Return to Login
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-xs text-neutral-400 leading-relaxed">
                Enter your registered email address and we will send you a secure link to reset your password.
              </p>

              {error && (
                <div className="p-3 rounded-lg bg-red-950/60 border border-red-800 text-xs text-red-300 font-mono">
                  {error}
                </div>
              )}

              <div>
                <label className="mb-1 block text-xs font-mono text-neutral-300 uppercase">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-white outline-none focus:border-emerald-600 font-sans text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="w-full rounded-md bg-emerald-700 px-3 py-2 font-medium text-white transition hover:bg-emerald-600 disabled:opacity-50 text-sm"
              >
                {loading ? 'Sending Instructions...' : 'Send Reset Link'}
              </button>

              <div className="text-center pt-2">
                <Link
                  href="/login"
                  className="text-xs font-mono text-neutral-400 hover:text-white"
                >
                  &larr; Back to login
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
