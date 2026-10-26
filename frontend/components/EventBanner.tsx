'use client';

import { useEffect, useState } from 'react';

interface EventData {
  id: string;
  name: string;
  startsAt: string;
  endsAt: string;
  freezeLeaderboardAt?: string | null;
  isPaused: boolean;
}

export default function EventBanner() {
  const [event, setEvent] = useState<EventData | null>(null);
  const [now, setNow] = useState<number>(Date.now());

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await fetch('/api/event');
        if (res.ok) {
          const data = await res.json();
          if (data && data.name) {
            setEvent(data);
          }
        }
      } catch {
        // Event fetch error handled gracefully
      }
    };

    fetchEvent();
    const pollInterval = setInterval(fetchEvent, 60000); // refresh event config every minute
    const tickInterval = setInterval(() => setNow(Date.now()), 1000); // tick countdown every second

    return () => {
      clearInterval(pollInterval);
      clearInterval(tickInterval);
    };
  }, []);

  if (!event) return null;

  const startMs = new Date(event.startsAt).getTime();
  const endMs = new Date(event.endsAt).getTime();
  const freezeMs = event.freezeLeaderboardAt ? new Date(event.freezeLeaderboardAt).getTime() : null;

  const formatCountdown = (diffMs: number) => {
    if (diffMs <= 0) return '00:00:00';
    const totalSeconds = Math.floor(diffMs / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const pad = (n: number) => String(n).padStart(2, '0');
    if (days > 0) {
      return `${days}d ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    }
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  };

  if (event.isPaused) {
    return (
      <div className="bg-amber-950/80 border-b border-amber-600/40 text-amber-200 text-xs px-4 py-1.5 text-center font-mono flex items-center justify-center space-x-2">
        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
        <span className="font-semibold uppercase tracking-wider">COMPETITION PAUSED:</span>
        <span>Flag submissions are temporarily halted.</span>
      </div>
    );
  }

  if (now < startMs) {
    return (
      <div className="bg-neutral-900/90 border-b border-neutral-800 text-neutral-300 text-xs px-4 py-1.5 text-center font-mono flex items-center justify-center space-x-3">
        <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
        <span className="font-semibold text-sky-400 uppercase tracking-wider">{event.name}</span>
        <span>Starts in: <strong className="text-white font-mono">{formatCountdown(startMs - now)}</strong></span>
      </div>
    );
  }

  if (now >= startMs && now <= endMs) {
    const isFrozen = freezeMs && now >= freezeMs;
    return (
      <div className="bg-emerald-950/40 border-b border-emerald-800/40 text-emerald-300 text-xs px-4 py-1.5 text-center font-mono flex items-center justify-center space-x-3">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="font-semibold text-emerald-400 uppercase tracking-wider">{event.name} ACTIVE</span>
        <span>Ends in: <strong className="text-white font-mono">{formatCountdown(endMs - now)}</strong></span>
        {isFrozen && (
          <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-sky-900/70 text-sky-200 border border-sky-500/30">
            ❄️ Scoreboard Frozen
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="bg-neutral-900/70 border-b border-neutral-800 text-neutral-400 text-xs px-4 py-1 text-center font-mono">
      <span>{event.name} has concluded. Scoreboards are final.</span>
    </div>
  );
}
