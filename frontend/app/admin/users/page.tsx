'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface UserRecord {
  id: string;
  username: string;
  email: string;
  isAdmin: boolean;
  isBanned: boolean;
  banReason?: string | null;
  twoFactorEnabled: boolean;
  emailVerified: boolean;
  createdAt: string;
  team?: { id: string; name: string } | null;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Ban modal state
  const [banUser, setBanUser] = useState<UserRecord | null>(null);
  const [banReason, setBanReason] = useState('');
  const [banLoading, setBanLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: String(page),
        limit: '20',
        search: search.trim(),
      });
      const res = await fetch(`/api/admin/users?${query}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
        setTotal(data.total || 0);
      }
    } catch {
      // Ignored
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const handleToggleRole = async (user: UserRecord) => {
    const nextRole = !user.isAdmin;
    const confirm = window.confirm(
      `Are you sure you want to ${nextRole ? 'promote' : 'demote'} "${user.username}" ${
        nextRole ? 'to Admin' : 'to Competitor'
      }?`,
    );
    if (!confirm) return;

    try {
      const res = await fetch(`/api/admin/users/${user.id}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAdmin: nextRole }),
      });
      if (res.ok) {
        fetchUsers();
      } else {
        alert('Failed to change user role.');
      }
    } catch {
      alert('Error updating user role.');
    }
  };

  const handleToggleBan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!banUser) return;
    setBanLoading(true);

    try {
      const isBanned = !banUser.isBanned;
      const res = await fetch(`/api/admin/users/${banUser.id}/ban`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isBanned,
          banReason: isBanned ? banReason.trim() : null,
        }),
      });

      if (res.ok) {
        setBanUser(null);
        setBanReason('');
        fetchUsers();
      } else {
        alert('Failed to update ban status.');
      }
    } catch {
      alert('Error toggling ban.');
    } finally {
      setBanLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">User Administration</h1>
          <p className="text-xs text-neutral-400 font-mono mt-1">
            Manage competitors, administer privileges, and review account security.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/teams"
            className="px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-xs font-mono text-neutral-300 hover:text-white"
          >
            Manage Teams &rarr;
          </Link>
        </div>
      </div>

      {/* Search and filter bar */}
      <div className="mb-6">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by username or email..."
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

      {/* Users table */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 overflow-hidden backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-neutral-950/80 border-b border-neutral-800 text-neutral-400 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Team</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Security</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-neutral-500">
                    Loading users...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-neutral-500">
                    No users match your criteria.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-neutral-900/30 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-white">{u.username}</div>
                      <div className="text-[11px] text-neutral-500">{u.email}</div>
                    </td>
                    <td className="px-4 py-3.5 text-neutral-300">
                      {u.team ? u.team.name : <span className="text-neutral-600">—</span>}
                    </td>
                    <td className="px-4 py-3.5">
                      {u.isAdmin ? (
                        <span className="px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800 font-bold">
                          ADMIN
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-neutral-800 text-neutral-400">
                          USER
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            u.twoFactorEnabled ? 'bg-emerald-500' : 'bg-neutral-600'
                          }`}
                          title={u.twoFactorEnabled ? '2FA Enabled' : '2FA Disabled'}
                        />
                        <span className="text-[11px] text-neutral-400">
                          {u.twoFactorEnabled ? '2FA ON' : '2FA OFF'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      {u.isBanned ? (
                        <span className="px-2 py-0.5 rounded bg-red-950/80 text-red-300 border border-red-800 font-bold">
                          BANNED
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-emerald-950/40 text-emerald-400 border border-emerald-800/40">
                          ACTIVE
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right space-x-2">
                      <button
                        onClick={() => handleToggleRole(u)}
                        className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[11px]"
                      >
                        {u.isAdmin ? 'Demote' : 'Promote'}
                      </button>
                      <button
                        onClick={() => {
                          setBanUser(u);
                          setBanReason(u.banReason || '');
                        }}
                        className={`px-2 py-1 rounded text-[11px] ${
                          u.isBanned
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800 hover:bg-emerald-900'
                            : 'bg-red-950 text-red-300 border border-red-800 hover:bg-red-900'
                        }`}
                      >
                        {u.isBanned ? 'Unban' : 'Ban'}
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
          <span>Total: {total} users</span>
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
              disabled={users.length < 20}
              className="px-2 py-1 rounded bg-neutral-900 border border-neutral-800 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Ban / Unban Modal */}
      {banUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <form
            onSubmit={handleToggleBan}
            className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-4"
          >
            <h3 className="text-base font-bold text-white">
              {banUser.isBanned ? `Unban "${banUser.username}"?` : `Ban "${banUser.username}"`}
            </h3>
            {!banUser.isBanned && (
              <div>
                <label className="block text-xs font-mono text-neutral-400 mb-1">
                  Reason for Ban:
                </label>
                <input
                  type="text"
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  placeholder="e.g., Flag sharing, botting, malicious activity"
                  className="w-full px-3 py-2 rounded bg-neutral-950 border border-neutral-700 text-xs text-white font-mono focus:outline-none focus:border-red-500"
                  required
                />
              </div>
            )}
            <p className="text-xs text-neutral-400">
              {banUser.isBanned
                ? 'This will immediately restore platform access and flag submission privileges.'
                : 'Banned users cannot authenticate or submit flags. All current sessions will be terminated.'}
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setBanUser(null)}
                className="px-4 py-2 rounded bg-neutral-800 text-neutral-300 text-xs font-mono"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={banLoading}
                className={`px-4 py-2 rounded font-bold text-xs font-mono ${
                  banUser.isBanned
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-neutral-950'
                    : 'bg-red-600 hover:bg-red-500 text-white'
                }`}
              >
                {banLoading
                  ? 'Saving...'
                  : banUser.isBanned
                  ? 'Confirm Unban'
                  : 'Confirm Ban'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
