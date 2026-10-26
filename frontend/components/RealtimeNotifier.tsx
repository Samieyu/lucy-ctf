'use client';

import { useEffect, useState } from 'react';

interface CTFEvent {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  timestamp: string;
}

interface ToastMessage {
  id: string;
  title: string;
  description: string;
  type: 'solve' | 'first_blood' | 'announcement';
}

export default function RealtimeNotifier() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    let eventSource: EventSource | null = null;
    let retryTimeout: NodeJS.Timeout | null = null;

    const connect = () => {
      try {
        eventSource = new EventSource('/api/events/stream');

        eventSource.onmessage = (e) => {
          try {
            const data: CTFEvent = JSON.parse(e.data);
            if (!data || !data.type) return;

            let toast: ToastMessage | null = null;

            if (data.type === 'first_blood') {
              const p = data.payload || {};
              toast = {
                id: `${Date.now()}-${Math.random()}`,
                title: '🩸 FIRST BLOOD!',
                description: `${p.teamName || 'A team'} achieved first blood on "${p.challengeTitle || 'a challenge'}"! (+${p.bonusPoints || 0} bonus)`,
                type: 'first_blood',
              };
            } else if (data.type === 'solve') {
              const p = data.payload || {};
              toast = {
                id: `${Date.now()}-${Math.random()}`,
                title: '🚩 Challenge Solved',
                description: `${p.teamName || 'A team'} solved "${p.challengeTitle || 'a challenge'}" (+${p.points || 0} pts)`,
                type: 'solve',
              };
            } else if (data.type === 'leaderboard_frozen') {
              toast = {
                id: `${Date.now()}-${Math.random()}`,
                title: '❄️ Scoreboard Frozen',
                description: 'The public scoreboard has been frozen until the end of the competition.',
                type: 'announcement',
              };
            }

            if (toast) {
              setToasts((prev) => [toast!, ...prev].slice(0, 5));
              setTimeout(() => {
                setToasts((prev) => prev.filter((t) => t.id !== toast!.id));
              }, 7000);
            }
          } catch {
            // Ignore parse errors on heartbeat
          }
        };

        eventSource.onerror = () => {
          if (eventSource) {
            eventSource.close();
            eventSource = null;
          }
          retryTimeout = setTimeout(connect, 5000);
        };
      } catch {
        retryTimeout = setTimeout(connect, 8000);
      }
    };

    connect();

    return () => {
      if (eventSource) eventSource.close();
      if (retryTimeout) clearTimeout(retryTimeout);
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col space-y-2 pointer-events-none max-w-sm w-full">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto p-4 rounded-lg shadow-xl border backdrop-blur-md transition-all duration-300 animate-slide-up ${
            toast.type === 'first_blood'
              ? 'bg-rose-950/90 border-rose-500/50 text-rose-100 shadow-rose-950/50'
              : toast.type === 'announcement'
              ? 'bg-sky-950/90 border-sky-500/50 text-sky-100 shadow-sky-950/50'
              : 'bg-neutral-900/95 border-emerald-500/40 text-neutral-100 shadow-neutral-950/50'
          }`}
        >
          <div className="flex items-start justify-between">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider font-mono">
                {toast.title}
              </h4>
              <p className="mt-1 text-xs text-neutral-300 font-sans">
                {toast.description}
              </p>
            </div>
            <button
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              className="text-neutral-400 hover:text-white text-xs ml-3"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
