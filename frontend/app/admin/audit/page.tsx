'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface AuditLogRecord {
  id: string;
  userId?: string | null;
  user?: { username: string; email: string } | null;
  action: string;
  targetType?: string | null;
  targetId?: string | null;
  details?: Record<string, unknown> | null;
  ipAddress?: string | null;
  isSuspicious: boolean;
  createdAt: string;
}

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditLogRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [suspiciousOnly, setSuspiciousOnly] = useState(false);
  const [actionFilter, setActionFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: String(page),
        limit: '25',
        ...(suspiciousOnly ? { suspiciousOnly: 'true' } : {}),
        ...(actionFilter ? { action: actionFilter } : {}),
      });

      const res = await fetch(`/api/admin/audit?${query}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
        setTotal(data.total || 0);
      }
    } catch {
      // Ignored
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, suspiciousOnly, actionFilter]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Security & Audit Logs</h1>
          <p className="text-xs text-neutral-400 font-mono mt-1">
            Immutable system audit trail tracking logins, flag attempts, admin actions, and suspicious brute-force signals.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/challenges"
            className="px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-xs font-mono text-neutral-300 hover:text-white"
          >
            &larr; Admin Challenges
          </Link>
        </div>
      </div>

      {/* Filter controls */}
      <div className="mb-6 p-4 rounded-xl border border-neutral-800 bg-neutral-900/40 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-mono text-neutral-300">
            <input
              type="checkbox"
              checked={suspiciousOnly}
              onChange={(e) => {
                setSuspiciousOnly(e.target.checked);
                setPage(1);
              }}
              className="rounded bg-neutral-950 border-neutral-700 text-amber-500 focus:ring-0"
            />
            <span className="text-amber-400 font-semibold">⚠️ Show Suspicious Signals Only</span>
          </label>

          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 rounded-lg bg-neutral-950 border border-neutral-700 text-xs font-mono text-neutral-200 focus:outline-none"
          >
            <option value="">All Actions</option>
            <option value="FLAG_SUBMIT">FLAG_SUBMIT</option>
            <option value="SUSPICIOUS_BRUTE_FORCE">SUSPICIOUS_BRUTE_FORCE</option>
            <option value="USER_BAN">USER_BAN</option>
            <option value="USER_ROLE_CHANGE">USER_ROLE_CHANGE</option>
            <option value="EVENT_SETTINGS_UPDATE">EVENT_SETTINGS_UPDATE</option>
          </select>
        </div>

        <button
          onClick={() => fetchLogs()}
          className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-mono text-neutral-300"
        >
          Refresh Logs
        </button>
      </div>

      {/* Logs Table */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 overflow-hidden backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-neutral-950/80 border-b border-neutral-800 text-neutral-400 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Actor / IP</th>
                <th className="px-4 py-3">Target</th>
                <th className="px-4 py-3">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-neutral-500">
                    Loading audit trail...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-neutral-500">
                    No audit records found.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr
                    key={log.id}
                    className={`transition-colors ${
                      log.isSuspicious
                        ? 'bg-rose-950/20 hover:bg-rose-950/40'
                        : 'hover:bg-neutral-900/30'
                    }`}
                  >
                    <td className="px-4 py-3 text-neutral-400 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-bold">
                      {log.isSuspicious ? (
                        <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 flex items-center gap-1 w-max">
                          <span>🚨</span> {log.action}
                        </span>
                      ) : (
                        <span className="text-neutral-200">{log.action}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-white font-medium">
                        {log.user ? log.user.username : 'System / Unauth'}
                      </div>
                      <div className="text-[10px] text-neutral-500">
                        {log.ipAddress || 'unknown IP'}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-neutral-400">
                      {log.targetType ? `${log.targetType}: ${log.targetId?.slice(0, 8)}...` : '—'}
                    </td>
                    <td className="px-4 py-3 text-neutral-300 max-w-xs truncate">
                      {log.details ? (
                        <span title={JSON.stringify(log.details, null, 2)}>
                          {JSON.stringify(log.details)}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-3 bg-neutral-950/60 border-t border-neutral-800 flex items-center justify-between text-xs font-mono text-neutral-400">
          <span>Total: {total} log entries</span>
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
              disabled={logs.length < 25}
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
