'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

interface LeaderboardItem {
  rank: number;
  name: string;
  username?: string;
  points: number;
  solves: number;
  solveCount?: number;
}

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'teams' | 'users'>('teams');
  const [data, setData] = useState<LeaderboardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [myTeamName, setMyTeamName] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Fetch current user's team name for highlighting
  useEffect(() => {
    if (user?.teamId) {
      fetch('/api/teams/me')
        .then((res) => (res.ok ? res.json() : null))
        .then((teamData) => {
          if (teamData?.name) {
            setMyTeamName(teamData.name);
          }
        })
        .catch(() => {});
    }
  }, [user?.teamId]);

  const fetchLeaderboard = async (tab: 'teams' | 'users', isBackground = false) => {
    if (!isBackground) setLoading(true);
    setError(null);
    try {
      const endpoint =
        tab === 'teams' ? '/api/leaderboard/teams' : '/api/leaderboard/users';
      const res = await fetch(endpoint);
      if (!res.ok) {
        throw new Error('Failed to load leaderboard data');
      }
      const json = await res.json();
      setData(Array.isArray(json) ? json : []);
      setLastUpdated(new Date());
    } catch (err: unknown) {
      if (!isBackground) {
        setError(err instanceof Error ? err.message : 'Error loading leaderboard');
      }
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  // Initial load and tab change
  useEffect(() => {
    fetchLeaderboard(activeTab);
  }, [activeTab]);

  // Polling every 15 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchLeaderboard(activeTab, true);
    }, 15000);

    return () => clearInterval(interval);
  }, [activeTab]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-neutral-800 pb-6 mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            Leaderboard
            <span className="flex items-center gap-1.5 text-xs font-mono font-normal px-2.5 py-0.5 rounded-full bg-neutral-900 text-neutral-400 border border-neutral-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Live (15s polling)
            </span>
          </h1>
          <p className="mt-1 text-sm text-neutral-400">
            Current standings and rankings in the Lucy CTF competition.
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center bg-neutral-900 p-1 rounded-xl border border-neutral-800">
          <button
            onClick={() => setActiveTab('teams')}
            className={`px-4 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
              activeTab === 'teams'
                ? 'bg-emerald-600 text-white font-bold shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Team Standings
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
              activeTab === 'users'
                ? 'bg-emerald-600 text-white font-bold shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Individual Solvers
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-lg bg-red-950/40 border border-red-900/60 text-red-300 text-sm mb-6 flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={() => fetchLeaderboard(activeTab)}
            className="text-xs underline hover:text-red-200"
          >
            Retry
          </button>
        </div>
      )}

      {/* Leaderboard Table */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 overflow-hidden shadow-xl backdrop-blur-sm">
        {loading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3, 4, 5].map((n) => (
              <div
                key={n}
                className="h-12 bg-neutral-900/60 rounded-lg animate-pulse border border-neutral-800/40"
              ></div>
            ))}
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-12 h-12 rounded-full bg-neutral-900 border border-neutral-800 mx-auto flex items-center justify-center text-neutral-500 text-xl font-mono mb-3">
              🏆
            </div>
            <h3 className="text-base font-medium text-neutral-200">
              No points scored yet
            </h3>
            <p className="mt-1 text-sm text-neutral-500 max-w-sm mx-auto">
              Be the first {activeTab === 'teams' ? 'team' : 'player'} to capture a
              flag and take the lead on the scoreboard!
            </p>
            <div className="mt-6">
              <Link
                href="/challenges"
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-neutral-950 font-semibold text-xs font-mono"
              >
                Browse Challenges &rarr;
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-900/80 border-b border-neutral-800 text-neutral-400 font-mono text-xs uppercase tracking-wider">
                <tr>
                  <th scope="col" className="px-6 py-4 w-20">
                    Rank
                  </th>
                  <th scope="col" className="px-6 py-4">
                    {activeTab === 'teams' ? 'Team Name' : 'Username'}
                  </th>
                  <th scope="col" className="px-6 py-4 text-center">
                    Solves
                  </th>
                  <th scope="col" className="px-6 py-4 text-right">
                    Score
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60 font-sans">
                {data.map((item) => {
                  const displayName = item.username || item.name;
                  const isMyTeam =
                    activeTab === 'teams' &&
                    myTeamName &&
                    item.name.toLowerCase() === myTeamName.toLowerCase();
                  const isCurrentUser =
                    activeTab === 'users' &&
                    user &&
                    displayName.toLowerCase() === user.username.toLowerCase();
                  const isHighlighted = isMyTeam || isCurrentUser;

                  return (
                    <tr
                      key={`${item.rank}-${displayName}`}
                      className={`transition-colors ${
                        isHighlighted
                          ? 'bg-emerald-950/30 border-l-4 border-l-emerald-500'
                          : 'hover:bg-neutral-900/50'
                      }`}
                    >
                      {/* Rank */}
                      <td className="px-6 py-4 font-mono font-bold">
                        {item.rank === 1 ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 text-xs">
                            🥇 1
                          </span>
                        ) : item.rank === 2 ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-neutral-300/20 text-neutral-200 border border-neutral-300/40 text-xs">
                            🥈 2
                          </span>
                        ) : item.rank === 3 ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-700/20 text-amber-600 border border-amber-700/40 text-xs">
                            🥉 3
                          </span>
                        ) : (
                          <span className="text-neutral-500 pl-2">#{item.rank}</span>
                        )}
                      </td>

                      {/* Name */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-medium ${
                              isHighlighted ? 'text-emerald-300 font-bold' : 'text-neutral-200'
                            }`}
                          >
                            {displayName}
                          </span>
                          {isHighlighted && (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/60">
                              {isMyTeam ? 'Your Team' : 'You'}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Solves */}
                      <td className="px-6 py-4 text-center font-mono text-neutral-400">
                        {item.solves ?? item.solveCount ?? 0}
                      </td>

                      {/* Points */}
                      <td className="px-6 py-4 text-right font-mono font-bold text-emerald-400 text-base">
                        {item.points}{' '}
                        <span className="text-xs font-normal text-neutral-500">pts</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer info */}
        <div className="px-6 py-3 border-t border-neutral-800/80 bg-neutral-900/60 flex items-center justify-between text-[11px] font-mono text-neutral-500">
          <div>Top {data.length} competitors displayed</div>
          <div>Updated: {lastUpdated.toLocaleTimeString()}</div>
        </div>
      </div>
    </div>
  );
}
