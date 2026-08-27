'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function DashboardPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-950 text-neutral-400">
        Loading...
      </div>
    );
  }

  if (!user) {
    return null; // redirecting
  }

  return (
    <div className="min-h-screen bg-neutral-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Lucy CTF Dashboard</h1>
          <button
            onClick={logout}
            className="rounded-md border border-neutral-700 px-3 py-1.5 text-sm text-neutral-300 hover:bg-neutral-800"
          >
            Log out
          </button>
        </div>

        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
          <p className="text-neutral-400">Logged in as</p>
          <p className="mt-1 text-lg font-medium">{user.username}</p>
          <p className="text-sm text-neutral-500">{user.email}</p>
          <p className="mt-4 text-xs text-neutral-600">
            User ID: {user.id}
          </p>
        </div>

        <p className="mt-6 text-sm text-neutral-500">
          Challenge listing, leaderboard, and team management are coming in
          later phases.
        </p>
      </div>
    </div>
  );
}
