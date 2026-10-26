'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError('Password reset token is missing from the URL.');
      return;
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        setSuccess(true);
      } else {
        setError(data.message || 'Failed to reset password. The token may be expired or invalid.');
      }
    } catch {
      setError('Network error resetting password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm">
      <h1 className="mb-1 text-center text-2xl font-bold text-white">Lucy CTF</h1>
      <p className="mb-8 text-center text-sm text-neutral-400">Set New Password</p>

      <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6 space-y-4">
        {success ? (
          <div className="space-y-4 text-center">
            <div className="w-12 h-12 mx-auto rounded-full bg-emerald-950 border border-emerald-700 text-emerald-400 flex items-center justify-center text-xl">
              ✓
            </div>
            <h2 className="text-base font-bold text-white">Password Updated!</h2>
            <p className="text-xs text-neutral-300 font-sans">
              Your password has been securely reset. You can now log into your account with your new credentials.
            </p>
            <div className="pt-2">
              <Link
                href="/login"
                className="inline-block px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 font-semibold text-xs font-mono text-neutral-950"
              >
                Log In Now
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-950/60 border border-red-800 text-xs text-red-300 font-mono">
                {error}
              </div>
            )}

            <div>
              <label className="mb-1 block text-xs font-mono text-neutral-300 uppercase">
                New Password
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-white outline-none focus:border-emerald-600 font-sans text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-mono text-neutral-300 uppercase">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-white outline-none focus:border-emerald-600 font-sans text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-emerald-700 px-3 py-2 font-medium text-white transition hover:bg-emerald-600 disabled:opacity-50 text-sm"
            >
              {loading ? 'Updating Password...' : 'Save New Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-950 px-4">
      <Suspense fallback={<div className="text-neutral-500 text-xs">Loading...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
