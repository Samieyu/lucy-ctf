'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';

interface FirstBloodInfo {
  teamName: string;
  bonusPoints: number;
  solvedAt: string;
}

interface ChallengeDetail {
  id: string;
  title: string;
  description: string;
  category: string;
  points: number;
  initialPoints?: number;
  minPoints?: number;
  decay?: number;
  scoringMode?: 'STATIC' | 'DYNAMIC';
  solved: boolean;
  solveCount: number;
  firstBlood?: FirstBloodInfo | null;
  hasInstance?: boolean;
}

interface HintItem {
  id: string;
  order: number;
  cost: number;
  isUnlocked: boolean;
  text?: string | null;
}

interface AttachmentItem {
  id: string;
  filename: string;
  fileSize: number;
  sha256: string;
  mimeType: string;
}

interface InstanceInfo {
  id: string;
  host: string;
  port: number;
  expiresAt: string;
  timeLeftSeconds: number;
}

interface SubmissionFeedback {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  link?: { href: string; text: string };
}

export default function ChallengeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [challenge, setChallenge] = useState<ChallengeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Flag Submission state
  const [flagInput, setFlagInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<SubmissionFeedback | null>(null);

  // Hints state
  const [hints, setHints] = useState<HintItem[]>([]);
  const [unlockingHintId, setUnlockingHintId] = useState<string | null>(null);
  const [confirmUnlockHint, setConfirmUnlockHint] = useState<HintItem | null>(null);

  // AI Hint state
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiRemaining, setAiRemaining] = useState<number | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  // Attachments state
  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);

  // Writeup state
  const [writeupContent, setWriteupContent] = useState('');
  const [existingWriteup, setExistingWriteup] = useState<{ content: string; updatedAt: string } | null>(null);
  const [savingWriteup, setSavingWriteup] = useState(false);
  const [writeupMsg, setWriteupMsg] = useState<string | null>(null);

  // Dynamic Instance state
  const [instance, setInstance] = useState<InstanceInfo | null>(null);
  const [instanceEnabled, setInstanceEnabled] = useState(false);
  const [instanceLoading, setInstanceLoading] = useState(false);
  const [instanceMsg, setInstanceMsg] = useState<string | null>(null);

  const fetchChallenge = async () => {
    try {
      const res = await fetch(`/api/challenges/${id}`);
      if (!res.ok) {
        throw new Error('Challenge not found or unavailable');
      }
      const data = await res.json();
      setChallenge(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error fetching challenge');
    } finally {
      setLoading(false);
    }
  };

  const fetchHints = async () => {
    try {
      const res = await fetch(`/api/challenges/${id}/hints`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setHints(data);
      }
    } catch {
      // Ignored
    }
  };

  const fetchAttachments = async () => {
    try {
      const res = await fetch(`/api/challenges/${id}/attachments`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setAttachments(data);
      }
    } catch {
      // Ignored
    }
  };

  const fetchAiStatus = async () => {
    try {
      const res = await fetch(`/api/challenges/${id}/ai-hint/status`);
      if (res.ok) {
        const data = await res.json();
        if (typeof data.remainingUses === 'number') {
          setAiRemaining(data.remainingUses);
        }
      }
    } catch {
      // Ignored
    }
  };

  const fetchWriteup = async () => {
    try {
      const res = await fetch(`/api/challenges/${id}/writeup`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.content) {
          setExistingWriteup(data);
          setWriteupContent(data.content);
        }
      }
    } catch {
      // Ignored
    }
  };

  const fetchInstanceStatus = async () => {
    try {
      const res = await fetch(`/api/challenges/${id}/instance`);
      if (res.ok) {
        const data = await res.json();
        setInstanceEnabled(!!data.enabled);
        setInstance(data.instance || null);
      }
    } catch {
      // Ignored
    }
  };

  useEffect(() => {
    fetchChallenge();
    fetchHints();
    fetchAttachments();
    fetchAiStatus();
    fetchInstanceStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (challenge?.solved) {
      fetchWriteup();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [challenge?.solved, id]);

  const handleSubmitFlag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!flagInput.trim() || submitting) return;

    setSubmitting(true);
    setFeedback(null);

    try {
      const res = await fetch(`/api/challenges/${id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flag: flagInput.trim() }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.status === 200 || res.status === 201) {
        if (data.isCorrect) {
          setFeedback({
            type: 'success',
            message: data.message || 'Correct flag! Points awarded to your team.',
          });
          setFlagInput('');
          await fetchChallenge();
        } else {
          setFeedback({
            type: 'error',
            message: data.message || 'Incorrect flag. Try again!',
          });
        }
      } else if (res.status === 409) {
        setFeedback({
          type: 'warning',
          message: data.message || 'Your team has already solved this challenge.',
        });
        await fetchChallenge();
      } else if (res.status === 400) {
        const isTeamError = data.message && data.message.toLowerCase().includes('team');
        setFeedback({
          type: 'error',
          message: data.message || 'Bad request submitting flag.',
          link: isTeamError ? { href: '/team', text: 'Go to Team Management' } : undefined,
        });
      } else if (res.status === 403) {
        setFeedback({
          type: 'error',
          message: data.message || 'Flag submissions are closed or the CTF is paused.',
        });
      } else if (res.status === 429) {
        setFeedback({
          type: 'warning',
          message: 'Rate limit exceeded: Max 10 submissions per minute. Please wait a moment.',
        });
      } else {
        setFeedback({
          type: 'error',
          message: data.message || 'Submission failed. Please try again.',
        });
      }
    } catch {
      setFeedback({
        type: 'error',
        message: 'Network error submitting flag. Please try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnlockHint = async (hint: HintItem) => {
    setUnlockingHintId(hint.id);
    try {
      const res = await fetch(`/api/hints/${hint.id}/unlock`, {
        method: 'POST',
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        await fetchHints();
        await fetchChallenge(); // Refresh team score
      } else {
        alert(data.message || 'Could not unlock hint.');
      }
    } catch {
      alert('Error unlocking hint.');
    } finally {
      setUnlockingHintId(null);
      setConfirmUnlockHint(null);
    }
  };

  const handleAskAi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiQuestion.trim() || aiLoading) return;
    setAiLoading(true);
    setAiError(null);
    setAiResponse(null);

    try {
      const res = await fetch(`/api/challenges/${id}/ai-hint`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: aiQuestion.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setAiResponse(data.hint || data.message || 'No response.');
        if (typeof data.remainingUses === 'number') {
          setAiRemaining(data.remainingUses);
        }
      } else {
        setAiError(data.message || 'Could not retrieve AI hint.');
      }
    } catch {
      setAiError('Failed to contact AI assistant.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSaveWriteup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!writeupContent.trim() || savingWriteup) return;
    setSavingWriteup(true);
    setWriteupMsg(null);

    try {
      const res = await fetch(`/api/challenges/${id}/writeup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: writeupContent.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setWriteupMsg('Writeup saved successfully!');
        setExistingWriteup(data);
      } else {
        setWriteupMsg(data.message || 'Failed to save writeup.');
      }
    } catch {
      setWriteupMsg('Error saving writeup.');
    } finally {
      setSavingWriteup(false);
    }
  };

  const handleStartInstance = async () => {
    setInstanceLoading(true);
    setInstanceMsg(null);
    try {
      const res = await fetch(`/api/challenges/${id}/instance/start`, { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setInstance(data);
      } else {
        setInstanceMsg(data.message || 'Failed to launch instance.');
      }
    } catch {
      setInstanceMsg('Error connecting to instance manager.');
    } finally {
      setInstanceLoading(false);
    }
  };

  const handleExtendInstance = async () => {
    setInstanceLoading(true);
    try {
      const res = await fetch(`/api/challenges/${id}/instance/extend`, { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setInstance(data);
      } else {
        alert(data.message || 'Could not extend instance.');
      }
    } catch {
      alert('Error extending instance.');
    } finally {
      setInstanceLoading(false);
    }
  };

  const handleStopInstance = async () => {
    setInstanceLoading(true);
    try {
      const res = await fetch(`/api/challenges/${id}/instance/stop`, { method: 'POST' });
      if (res.ok) {
        setInstance(null);
      }
    } catch {
      // Ignored
    } finally {
      setInstanceLoading(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10 w-full animate-pulse">
        <div className="h-4 bg-neutral-800 rounded w-28 mb-6"></div>
        <div className="h-8 bg-neutral-800 rounded w-2/3 mb-4"></div>
        <div className="h-32 bg-neutral-900 rounded-xl mb-6"></div>
        <div className="h-24 bg-neutral-900 rounded-xl"></div>
      </div>
    );
  }

  if (error || !challenge) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 w-full text-center">
        <h2 className="text-xl font-bold text-white mb-2">Challenge Unavailable</h2>
        <p className="text-sm text-neutral-400 mb-6">{error || 'Challenge not found'}</p>
        <Link
          href="/challenges"
          className="px-4 py-2 rounded-lg bg-neutral-900 text-neutral-200 hover:text-white border border-neutral-800 text-sm"
        >
          &larr; Back to Challenges
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
      {/* Back button */}
      <div className="mb-6">
        <Link
          href="/challenges"
          className="text-xs font-mono text-neutral-400 hover:text-emerald-400 transition-colors inline-flex items-center gap-1.5"
        >
          &larr; Back to all challenges
        </Link>
      </div>

      {/* Main card */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-6 md:p-8 backdrop-blur-sm space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-6 border-b border-neutral-800/80">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-xs font-mono font-semibold uppercase px-2.5 py-0.5 rounded bg-neutral-800 text-amber-400 border border-neutral-700">
                {challenge.category.replace('_', ' ')}
              </span>

              {challenge.scoringMode === 'DYNAMIC' && (
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-800">
                  Dynamic Decay
                </span>
              )}

              {challenge.solved && (
                <span className="inline-flex items-center gap-1 text-xs font-mono px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-700/60 font-medium">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                  Solved by your team
                </span>
              )}

              {challenge.firstBlood && (
                <span className="inline-flex items-center gap-1 text-xs font-mono px-2.5 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-800 font-medium">
                  🩸 First Blood: {challenge.firstBlood.teamName} (+{challenge.firstBlood.bonusPoints} bonus)
                </span>
              )}
            </div>

            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              {challenge.title}
            </h1>
          </div>

          <div className="flex md:flex-col items-center md:items-end justify-between md:justify-start gap-1">
            <div className="text-2xl md:text-3xl font-mono font-bold text-emerald-400">
              {challenge.points}{' '}
              <span className="text-xs font-sans font-normal text-neutral-500">pts</span>
            </div>
            <div className="text-xs font-mono text-neutral-400">
              {challenge.solveCount} {challenge.solveCount === 1 ? 'team solve' : 'team solves'}
            </div>
          </div>
        </div>

        {/* Description */}
        <div>
          <h2 className="text-xs font-mono font-semibold text-neutral-400 uppercase tracking-wider mb-2">
            Description
          </h2>
          <div className="prose prose-invert max-w-none text-sm text-neutral-300 leading-relaxed whitespace-pre-wrap font-sans">
            {challenge.description}
          </div>
        </div>

        {/* Attachments Section */}
        {attachments.length > 0 && (
          <div className="p-4 rounded-lg bg-neutral-950/60 border border-neutral-800">
            <h3 className="text-xs font-mono font-semibold text-neutral-400 uppercase tracking-wider mb-3">
              Attachments ({attachments.length})
            </h3>
            <div className="space-y-2">
              {attachments.map((att) => (
                <div
                  key={att.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 rounded bg-neutral-900 border border-neutral-800 text-xs font-mono gap-2"
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className="text-amber-400">📎</span>
                    <span className="text-neutral-200 truncate font-semibold">{att.filename}</span>
                    <span className="text-neutral-500">({formatBytes(att.fileSize)})</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-neutral-500 text-[10px] hidden md:inline truncate max-w-xs" title={att.sha256}>
                      SHA256: {att.sha256.substring(0, 12)}...
                    </span>
                    <a
                      href={`/api/challenges/${id}/attachments/${att.id}`}
                      download
                      className="px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-emerald-400 hover:text-emerald-300 transition-colors"
                    >
                      Download
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dynamic Challenge Instance Section */}
        {instanceEnabled && (
          <div className="p-4 rounded-lg bg-neutral-950/60 border border-neutral-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono font-semibold text-sky-400 uppercase tracking-wider">
                Dynamic Instance Environment
              </h3>
              {instance && (
                <span className="text-xs font-mono text-emerald-400 animate-pulse">
                  ● Running
                </span>
              )}
            </div>

            {instanceMsg && (
              <p className="text-xs text-rose-400 font-mono">{instanceMsg}</p>
            )}

            {!instance ? (
              <div>
                <p className="text-xs text-neutral-400 mb-3">
                  This challenge runs in an isolated container instance. Each team gets a dedicated 30-minute container.
                </p>
                <button
                  onClick={handleStartInstance}
                  disabled={instanceLoading}
                  className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-mono text-xs font-semibold disabled:opacity-50 transition-colors"
                >
                  {instanceLoading ? 'Spawning Container...' : 'Start Instance'}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3 rounded bg-neutral-900 border border-neutral-700 font-mono text-xs text-neutral-300">
                  <div className="text-neutral-400 text-[10px] uppercase">Connection Host & Port:</div>
                  <div className="text-emerald-400 font-bold select-all mt-0.5">
                    {instance.host}:{instance.port}
                  </div>
                  <div className="text-neutral-500 text-[11px] mt-1">
                    Expires in: {Math.max(0, Math.floor(instance.timeLeftSeconds / 60))}m {instance.timeLeftSeconds % 60}s
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleExtendInstance}
                    disabled={instanceLoading}
                    className="px-3 py-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-mono"
                  >
                    Extend (+15m)
                  </button>
                  <button
                    onClick={handleStopInstance}
                    disabled={instanceLoading}
                    className="px-3 py-1.5 rounded bg-rose-950/60 hover:bg-rose-900/80 border border-rose-800 text-rose-200 text-xs font-mono"
                  >
                    Terminate
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Hints Section */}
        {hints.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-mono font-semibold text-neutral-400 uppercase tracking-wider">
              Hints ({hints.length})
            </h3>
            <div className="space-y-2">
              {hints.map((hint, idx) => (
                <div
                  key={hint.id}
                  className="p-3.5 rounded-lg border border-neutral-800 bg-neutral-950/50"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-semibold text-neutral-300">
                      Hint #{idx + 1}
                    </span>
                    {hint.isUnlocked ? (
                      <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                        Unlocked
                      </span>
                    ) : (
                      <button
                        onClick={() => setConfirmUnlockHint(hint)}
                        className="text-xs font-mono px-3 py-1 rounded bg-amber-950/60 text-amber-300 border border-amber-800 hover:bg-amber-900 transition-colors"
                      >
                        Unlock ({hint.cost} pts)
                      </button>
                    )}
                  </div>
                  {hint.isUnlocked && hint.text && (
                    <div className="mt-2 text-xs font-sans text-neutral-300 bg-neutral-900 p-2.5 rounded border border-neutral-800">
                      {hint.text}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Confirmation Modal for Hint Unlock */}
        {confirmUnlockHint && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-4">
              <h3 className="text-base font-bold text-white">Unlock Hint #{confirmUnlockHint.order}?</h3>
              <p className="text-sm text-neutral-300">
                Unlocking this hint costs <strong className="text-amber-400">{confirmUnlockHint.cost} points</strong>.
                This amount will be deducted directly from your team&apos;s score.
              </p>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setConfirmUnlockHint(null)}
                  className="px-4 py-2 rounded-lg bg-neutral-800 text-neutral-300 hover:bg-neutral-700 text-xs font-mono"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleUnlockHint(confirmUnlockHint)}
                  disabled={unlockingHintId === confirmUnlockHint.id}
                  className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-neutral-950 font-bold text-xs font-mono"
                >
                  {unlockingHintId === confirmUnlockHint.id ? 'Unlocking...' : `Confirm & Deduct ${confirmUnlockHint.cost} pts`}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* AI Hint Assistant Section */}
        <div className="p-4 rounded-lg bg-neutral-950/60 border border-neutral-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <span>🤖</span> Ask AI For A Nudge
            </h3>
            {aiRemaining !== null && (
              <span className="text-[11px] font-mono text-neutral-400">
                {aiRemaining} of 5 nudges remaining
              </span>
            )}
          </div>
          <p className="text-xs text-neutral-400">
            Stuck? Ask the AI tutor for a subtle nudge. The AI will never reveal the flag or provide full code.
          </p>

          <form onSubmit={handleAskAi} className="space-y-2">
            <input
              type="text"
              value={aiQuestion}
              onChange={(e) => setAiQuestion(e.target.value)}
              placeholder="e.g., What encryption mode is commonly vulnerable to padding oracle attacks?"
              disabled={aiLoading || aiRemaining === 0}
              className="w-full px-3 py-2 rounded bg-neutral-900 border border-neutral-700 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-emerald-500 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={aiLoading || !aiQuestion.trim() || aiRemaining === 0}
              className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-neutral-950 font-mono text-xs font-semibold disabled:opacity-50 transition-colors"
            >
              {aiLoading ? 'Thinking (8s timeout)...' : 'Get AI Nudge'}
            </button>
          </form>

          {aiError && (
            <div className="p-2.5 rounded bg-red-950/50 border border-red-800 text-xs text-red-300 font-mono">
              {aiError}
            </div>
          )}

          {aiResponse && (
            <div className="p-3 rounded bg-neutral-900 border border-emerald-500/40 text-xs text-neutral-200 font-sans space-y-1">
              <div className="text-[10px] font-mono uppercase text-emerald-400 font-bold">AI Nudge:</div>
              <p className="leading-relaxed">{aiResponse}</p>
            </div>
          )}
        </div>

        {/* Flag Submission Form */}
        <div className="pt-6 border-t border-neutral-800">
          <h2 className="text-xs font-mono font-semibold text-neutral-400 uppercase tracking-wider mb-3">
            Submit Flag
          </h2>

          <form onSubmit={handleSubmitFlag} className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={flagInput}
                  onChange={(e) => setFlagInput(e.target.value)}
                  placeholder="LUCY{example_flag_here}"
                  disabled={submitting}
                  className="w-full px-4 py-2.5 rounded-lg bg-neutral-950 border border-neutral-700 text-white placeholder-neutral-500 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 disabled:opacity-50"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={submitting || !flagInput.trim()}
                className="px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-neutral-950 font-semibold font-mono text-sm shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-1 h-4 w-4 text-neutral-950"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Checking...
                  </>
                ) : (
                  'Submit Flag'
                )}
              </button>
            </div>

            {/* Submission Feedback alert */}
            {feedback && (
              <div
                className={`p-4 rounded-lg text-sm border flex items-start justify-between gap-3 ${
                  feedback.type === 'success'
                    ? 'bg-emerald-950/60 border-emerald-600 text-emerald-300'
                    : feedback.type === 'warning'
                    ? 'bg-amber-950/60 border-amber-600 text-amber-300'
                    : 'bg-red-950/60 border-red-600 text-red-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>
                    {feedback.type === 'success'
                      ? '🎉'
                      : feedback.type === 'warning'
                      ? '⚠️'
                      : '❌'}
                  </span>
                  <span>{feedback.message}</span>
                </div>

                {feedback.link && (
                  <Link
                    href={feedback.link.href}
                    className="text-xs font-mono underline hover:text-white shrink-0 font-bold"
                  >
                    {feedback.link.text} &rarr;
                  </Link>
                )}
              </div>
            )}
          </form>
        </div>

        {/* Writeup Section (Team Only when solved) */}
        {challenge.solved && (
          <div className="pt-6 border-t border-neutral-800 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-mono font-semibold text-neutral-400 uppercase tracking-wider">
                Team Writeup (Markdown)
              </h2>
              {existingWriteup && (
                <span className="text-[10px] font-mono text-neutral-500">
                  Last updated: {new Date(existingWriteup.updatedAt).toLocaleDateString()}
                </span>
              )}
            </div>
            <p className="text-xs text-neutral-400">
              Document your solution methodology. Writeups are visible only to your team members and contest administrators.
            </p>

            <form onSubmit={handleSaveWriteup} className="space-y-3">
              <textarea
                value={writeupContent}
                onChange={(e) => setWriteupContent(e.target.value)}
                rows={6}
                placeholder="## Vulnerability Analysis&#10;&#10;Explain step-by-step how you solved this challenge..."
                className="w-full p-3 rounded-lg bg-neutral-950 border border-neutral-700 text-xs font-mono text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
              />
              <div className="flex items-center justify-between">
                <button
                  type="submit"
                  disabled={savingWriteup || !writeupContent.trim()}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-neutral-950 font-mono text-xs font-semibold disabled:opacity-50 transition-colors"
                >
                  {savingWriteup ? 'Saving Writeup...' : 'Save Writeup'}
                </button>
                {writeupMsg && (
                  <span className="text-xs font-mono text-emerald-400">{writeupMsg}</span>
                )}
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
