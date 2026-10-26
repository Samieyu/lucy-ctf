'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface TeamRecord {
  id: string;
  name: string;
  captain: { id: string; username: string };
  members: Array<{ id: string; username: string }>;
  score?: { points: number; lastScoredAt: string } | null;
  submissionsCount?: number;
  createdAt: string;
}

export default function AdminTeamsPage() {
  const [teams, setTeams] = useState<TeamRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchTeams = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: String(page),
        limit: '20',
        search: search.trim(),
      });
      const res = await fetch(`/api/admin/teams?${query}`);
      if (res.ok) {
        const data = await res.json();
        setTeams(data.teams || []);
        setTotal(data.total || 0);
      }
    } catch {
      // Ignored
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchTeams();
  };

  const handleResetScore = async (team: TeamRecord) => {
    const confirm = window.confirm(
      `Are you sure you want to RESET the score of team "${team.name}" to 0? This cannot be undone.`,
    );
    if (!confirm) return;

    try {
      const res = await fetch(`/api/admin/teams/${team.id}/reset-score`, {
        method: 'POST',
      });
      if (res.ok) {
        alert(`Score for "${team.name}" has been reset to 0.`);
        fetchTeams();
      } else {
        alert('Failed to reset score.');
      }
    } catch {
      alert('Error resetting team score.');
    }
  };

  const handleDeleteTeam = async (team: TeamRecord) => {
    const confirm = window.confirm(
      `DANGER: Are you sure you want to permanently delete team "${team.name}"? All members will be disbanded and submissions cleared.`,
    );
    if (!confirm) return;

    try {
      const res = await fetch(`/api/admin/teams/${team.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchTeams();
      } else {
        alert('Failed to delete team.');
      }
    } catch {
      alert('Error deleting team.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Team Administration</h1>
          <p className="text-xs text-neutral-400 font-mono mt-1">
            Oversee registered CTF teams, manage membership, and adjust standings.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/users"
            className="px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-xs font-mono text-neutral-300 hover:text-white"
          >
            &larr; Manage Users
          </Link>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search teams by name..."
            className="flex-1 px-4 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-amber-500"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-mono text-neutral-200 transition-colors"
          >
            Search
          </button>
        </form>
      </div>

      {/* Teams table */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 overflow-hidden backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-neutral-950/80 border-b border-neutral-800 text-neutral-400 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Team Name</th>
                <th className="px-4 py-3">Captain</th>
                <th className="px-4 py-3">Members</th>
                <th className="px-4 py-3">Score</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-neutral-500">
                    Loading teams...
                  </td>
                </tr>
              ) : teams.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-neutral-500">
                    No teams found.
                  </td>
                </tr>
              ) : (
                teams.map((t) => (
                  <tr key={t.id} className="hover:bg-neutral-900/30 transition-colors">
                    <td className="px-4 py-3.5 font-bold text-white">
                      {t.name}
                    </td>
                    <td className="px-4 py-3.5 text-neutral-300">
                      {t.captain?.username || '—'}
                    </td>
                    <td className="px-4 py-3.5 text-neutral-400">
                      {t.members?.length || 0} / 4
                    </td>
                    <td className="px-4 py-3.5 font-bold text-emerald-400">
                      {t.score ? t.score.points : 0} pts
                    </td>
                    <td className="px-4 py-3.5 text-right space-x-2">
                      <button
                        onClick={() => handleResetScore(t)}
                        className="px-2 py-1 rounded bg-amber-950/70 border border-amber-800 hover:bg-amber-900 text-amber-300 text-[11px]"
                      >
                        Reset Score
                      </button>
                      <button
                        onClick={() => handleDeleteTeam(t)}
                        className="px-2 py-1 rounded bg-rose-950/70 border border-rose-800 hover:bg-rose-900 text-rose-300 text-[11px]"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-3 bg-neutral-950/60 border-t border-neutral-800 flex items-center justify-between text-xs font-mono text-neutral-400">
          <span>Total: {total} teams</span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-2 py-1 rounded bg-neutral-900 border border-neutral-800 disabled:opacity-40"
            >
              Prev
            </button>
            <span className="px-2 py-1">Page {page}</span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={teams.length < 20}
              className="px-2 py-1 rounded bg-neutral-900 border border-neutral-800 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
