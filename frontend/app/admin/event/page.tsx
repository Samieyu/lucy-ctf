'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface EventFormState {
  name: string;
  startsAt: string;
  endsAt: string;
  freezeLeaderboardAt: string;
  isPaused: boolean;
}

export default function AdminEventPage() {
  const [formData, setFormData] = useState<EventFormState>({
    name: '',
    startsAt: '',
    endsAt: '',
    freezeLeaderboardAt: '',
    isPaused: false,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const formatIsoForInput = (iso?: string | null) => {
    if (!iso) return '';
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await fetch('/api/event');
        if (res.ok) {
          const data = await res.json();
          setFormData({
            name: data.name || '',
            startsAt: formatIsoForInput(data.startsAt),
            endsAt: formatIsoForInput(data.endsAt),
            freezeLeaderboardAt: formatIsoForInput(data.freezeLeaderboardAt),
            isPaused: !!data.isPaused,
          });
        }
      } catch {
        setStatusMsg({ type: 'error', text: 'Failed to load event settings.' });
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusMsg(null);

    try {
      const payload: Record<string, unknown> = {
        name: formData.name,
        startsAt: new Date(formData.startsAt).toISOString(),
        endsAt: new Date(formData.endsAt).toISOString(),
        isPaused: formData.isPaused,
      };

      if (formData.freezeLeaderboardAt) {
        payload.freezeLeaderboardAt = new Date(formData.freezeLeaderboardAt).toISOString();
      } else {
        payload.freezeLeaderboardAt = null;
      }

      const res = await fetch('/api/event/admin', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        setStatusMsg({ type: 'success', text: 'Event settings updated successfully!' });
      } else {
        setStatusMsg({ type: 'error', text: data.message || 'Failed to update event settings.' });
      }
    } catch {
      setStatusMsg({ type: 'error', text: 'Network error updating event settings.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 animate-pulse space-y-4">
        <div className="h-6 bg-neutral-800 rounded w-48" />
        <div className="h-64 bg-neutral-900 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">CTF Event Control</h1>
          <p className="text-xs text-neutral-400 font-mono mt-1">
            Configure competition window, scoreboard freeze, and emergency pause.
          </p>
        </div>
        <Link
          href="/admin/challenges"
          className="text-xs font-mono text-neutral-400 hover:text-white"
        >
          &larr; Admin Challenges
        </Link>
      </div>

      <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-6 md:p-8 backdrop-blur-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-mono font-medium text-neutral-300 uppercase tracking-wider mb-2">
              Event Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full px-3.5 py-2.5 rounded-lg bg-neutral-950 border border-neutral-700 text-white font-mono text-sm focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono font-medium text-neutral-300 uppercase tracking-wider mb-2">
                Starts At
              </label>
              <input
                type="datetime-local"
                value={formData.startsAt}
                onChange={(e) => setFormData({ ...formData, startsAt: e.target.value })}
                required
                className="w-full px-3.5 py-2.5 rounded-lg bg-neutral-950 border border-neutral-700 text-white font-mono text-sm focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-medium text-neutral-300 uppercase tracking-wider mb-2">
                Ends At
              </label>
              <input
                type="datetime-local"
                value={formData.endsAt}
                onChange={(e) => setFormData({ ...formData, endsAt: e.target.value })}
                required
                className="w-full px-3.5 py-2.5 rounded-lg bg-neutral-950 border border-neutral-700 text-white font-mono text-sm focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono font-medium text-neutral-300 uppercase tracking-wider mb-2">
              Freeze Leaderboard At (Optional)
            </label>
            <input
              type="datetime-local"
              value={formData.freezeLeaderboardAt}
              onChange={(e) => setFormData({ ...formData, freezeLeaderboardAt: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg bg-neutral-950 border border-neutral-700 text-white font-mono text-sm focus:outline-none focus:border-amber-500"
            />
            <p className="text-[11px] text-neutral-500 mt-1 font-mono">
              After this timestamp, public scoreboards serve a frozen snapshot while admins see live solves.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-neutral-950 border border-neutral-800 flex items-center justify-between">
            <div>
              <div className="text-xs font-mono font-bold text-amber-400 uppercase">
                Emergency Pause
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Immediately block all participant flag submissions across the platform.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isPaused}
                onChange={(e) => setFormData({ ...formData, isPaused: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
            </label>
          </div>

          {statusMsg && (
            <div
              className={`p-3 rounded-lg text-xs font-mono border ${
                statusMsg.type === 'success'
                  ? 'bg-emerald-950/60 border-emerald-700 text-emerald-300'
                  : 'bg-red-950/60 border-red-700 text-red-300'
              }`}
            >
              {statusMsg.text}
            </div>
          )}

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-neutral-950 font-bold font-mono text-xs shadow-md shadow-amber-600/20 transition-all disabled:opacity-50"
            >
              {saving ? 'Saving Settings...' : 'Save Event Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
