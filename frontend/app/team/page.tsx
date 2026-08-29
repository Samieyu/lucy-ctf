'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

interface TeamMember {
  id: string;
  username: string;
  email: string;
}

interface Team {
  id: string;
  name: string;
  inviteCode: string;
  isCaptain: boolean;
  captainId: string;
  members: TeamMember[];
}

export default function TeamPage() {
  const { user, loading: authLoading, refreshUser } = useAuth();
  const router = useRouter();

  const [team, setTeam] = useState<Team | null>(null);
  const [loadingTeam, setLoadingTeam] = useState(true);
  const [teamName, setTeamName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadTeam = async () => {
    const res = await fetch('/api/teams/me');
    const data = await res.json();
    setTeam(data.team);
    setLoadingTeam(false);
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (user) loadTeam();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user]);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const res = await fetch('/api/teams/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: teamName }),
    });
    const data = await res.json();

    setSubmitting(false);
    if (!res.ok) {
      setError(data.message || 'Failed to create team');
      return;
    }
    await refreshUser();
    await loadTeam();
  };

  const handleJoin = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const res = await fetch('/api/teams/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inviteCode }),
    });
    const data = await res.json();

    setSubmitting(false);
    if (!res.ok) {
      setError(data.message || 'Failed to join team');
      return;
    }
    await refreshUser();
    await loadTeam();
  };

  const handleLeave = async () => {
    setSubmitting(true);
    await fetch('/api/teams/leave', { method: 'POST' });
    setSubmitting(false);
    await refreshUser();
    await loadTeam();
  };

  if (authLoading || loadingTeam) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-950 text-neutral-400">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-lg">
        <h1 className="mb-8 text-2xl font-bold">Team</h1>

        {team ? (
          <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
            <p className="text-lg font-medium">{team.name}</p>
            <p className="mt-1 text-sm text-neutral-500">
              Invite code:{' '}
              <span className="font-mono text-emerald-500">
                {team.inviteCode}
              </span>
            </p>

            <div className="mt-4">
              <p className="mb-2 text-sm text-neutral-400">Members</p>
              <ul className="space-y-1">
                  {team.members.map((m) => (
                    <li key={m.id} className="text-sm text-neutral-300">
                      {m.username}
                      {m.id === team.captainId && (
                        <span className="ml-2 rounded bg-emerald-900 px-1.5 py-0.5 text-xs text-emerald-400">
                          Captain
                        </span>
                      )}
                    </li>
                  ))}
               </ul>
            </div>

            <button
              onClick={handleLeave}
              disabled={submitting}
              className="mt-6 rounded-md border border-red-900 px-3 py-1.5 text-sm text-red-400 hover:bg-red-950 disabled:opacity-50"
            >
              Leave team
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {error && (
              <div className="rounded-md border border-red-900 bg-red-950 px-3 py-2 text-sm text-red-300">
                {error}
              </div>
            )}

            <form
              onSubmit={handleCreate}
              className="space-y-3 rounded-xl border border-neutral-800 bg-neutral-900 p-6"
            >
              <p className="font-medium">Create a team</p>
              <input
                type="text"
                required
                minLength={3}
                maxLength={32}
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="Team name"
                className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-white outline-none focus:border-emerald-600"
              />
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-md bg-emerald-700 px-3 py-2 font-medium text-white hover:bg-emerald-600 disabled:opacity-50"
              >
                Create team
              </button>
            </form>

            <form
              onSubmit={handleJoin}
              className="space-y-3 rounded-xl border border-neutral-800 bg-neutral-900 p-6"
            >
              <p className="font-medium">Join a team</p>
              <input
                type="text"
                required
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder="Invite code"
                className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-white outline-none focus:border-emerald-600"
              />
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-md border border-neutral-700 px-3 py-2 font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
              >
                Join team
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}