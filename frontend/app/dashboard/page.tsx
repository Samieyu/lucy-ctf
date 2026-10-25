'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-neutral-400">
        Loading...
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
      <div className="border-b border-neutral-800 pb-6 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Welcome back, <span className="text-emerald-400">{user.username}</span>
          </h1>
          <p className="mt-1 text-sm text-neutral-400">
            {user.isAdmin
              ? 'Administrator account with challenge creation & management access.'
              : 'Compete, solve challenges, and climb the scoreboard with your team.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-300">
            Role: <span className="text-amber-400">{user.isAdmin ? 'Admin' : 'Competitor'}</span>
          </span>
          {user.teamId && (
            <span className="text-xs font-mono px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-800/40 text-emerald-400">
              Team Member
            </span>
          )}
        </div>
      </div>

      {/* Quick Action Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Link
          href="/challenges"
          className="group p-6 rounded-xl border border-neutral-800 bg-neutral-900/40 hover:bg-neutral-900/80 hover:border-emerald-600/40 transition-all shadow-sm"
        >
          <div className="w-10 h-10 rounded-lg bg-emerald-950 border border-emerald-800/50 flex items-center justify-center text-emerald-400 text-lg mb-4 group-hover:scale-105 transition-transform">
            🎯
          </div>
          <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors">
            Challenges
          </h3>
          <p className="mt-1 text-xs text-neutral-400 leading-relaxed">
            Browse challenge categories, decrypt ciphers, find vulnerabilities, and submit flags.
          </p>
          <div className="mt-4 text-xs font-mono text-emerald-400 flex items-center gap-1">
            Open Challenges &rarr;
          </div>
        </Link>

        <Link
          href="/leaderboard"
          className="group p-6 rounded-xl border border-neutral-800 bg-neutral-900/40 hover:bg-neutral-900/80 hover:border-amber-600/40 transition-all shadow-sm"
        >
          <div className="w-10 h-10 rounded-lg bg-amber-950 border border-amber-800/50 flex items-center justify-center text-amber-400 text-lg mb-4 group-hover:scale-105 transition-transform">
            🏆
          </div>
          <h3 className="text-lg font-bold text-white group-hover:text-amber-400 transition-colors">
            Leaderboard
          </h3>
          <p className="mt-1 text-xs text-neutral-400 leading-relaxed">
            Live team standings and individual solver rankings updated in real-time.
          </p>
          <div className="mt-4 text-xs font-mono text-amber-400 flex items-center gap-1">
            View Scoreboard &rarr;
          </div>
        </Link>

        <Link
          href="/team"
          className="group p-6 rounded-xl border border-neutral-800 bg-neutral-900/40 hover:bg-neutral-900/80 hover:border-neutral-700 transition-all shadow-sm"
        >
          <div className="w-10 h-10 rounded-lg bg-neutral-800 border border-neutral-700 flex items-center justify-center text-neutral-300 text-lg mb-4 group-hover:scale-105 transition-transform">
            👥
          </div>
          <h3 className="text-lg font-bold text-white group-hover:text-neutral-200 transition-colors">
            Team Hub
          </h3>
          <p className="mt-1 text-xs text-neutral-400 leading-relaxed">
            Create or join a team, manage invite codes, view teammates, and captain succession.
          </p>
          <div className="mt-4 text-xs font-mono text-neutral-400 group-hover:text-neutral-300 flex items-center gap-1">
            Manage Team &rarr;
          </div>
        </Link>
      </div>

      {user.isAdmin && (
        <div className="p-6 rounded-xl border border-amber-900/40 bg-amber-950/20 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-amber-300 flex items-center gap-2">
              <span>⚡</span> Admin Management Portal
            </h3>
            <p className="text-xs text-amber-400/80 mt-1">
              Create, update, activate/deactivate, or delete challenges for Lucy CTF.
            </p>
          </div>
          <Link
            href="/admin/challenges"
            className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-neutral-950 font-bold font-mono text-xs whitespace-nowrap"
          >
            Manage Challenges &rarr;
          </Link>
        </div>
      )}
    </div>
  );
}
