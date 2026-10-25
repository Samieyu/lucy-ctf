'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';

interface ChallengeDetail {
  id: string;
  title: string;
  description: string;
  category: string;
  points: number;
  solved: boolean;
  solveCount: number;
  filePath?: string | null;
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

  const [flagInput, setFlagInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<SubmissionFeedback | null>(null);

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

  useEffect(() => {
    fetchChallenge();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

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
          // Refresh challenge state to update solved flag & solve count
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
        const isTeamError =
          data.message && data.message.toLowerCase().includes('team');
        setFeedback({
          type: 'error',
          message: data.message || 'Bad request submitting flag.',
          link: isTeamError
            ? { href: '/team', text: 'Go to Team Management' }
            : undefined,
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
      <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-6 md:p-8 backdrop-blur-sm">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-6 border-b border-neutral-800/80">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-mono font-semibold uppercase px-2.5 py-0.5 rounded bg-neutral-800 text-amber-400 border border-neutral-700">
                {challenge.category.replace('_', ' ')}
              </span>

              {challenge.solved && (
                <span className="inline-flex items-center gap-1 text-xs font-mono px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-700/60 font-medium">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                  Solved by your team
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
        <div className="py-6">
          <h2 className="text-xs font-mono font-semibold text-neutral-400 uppercase tracking-wider mb-2">
            Description
          </h2>
          <div className="prose prose-invert max-w-none text-sm text-neutral-300 leading-relaxed whitespace-pre-wrap font-sans">
            {challenge.description}
          </div>

          {/* Attachment download if available */}
          {challenge.filePath && (
            <div className="mt-4 p-3 rounded-lg bg-neutral-950/60 border border-neutral-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-mono text-neutral-300">
                <span className="text-amber-400">📎</span>
                <span>Attachment: {challenge.filePath.split('/').pop()}</span>
              </div>
              <a
                href={challenge.filePath}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-mono text-emerald-400 hover:text-emerald-300 underline"
              >
                Download
              </a>
            </div>
          )}
        </div>

        {/* Solved Status Banner */}
        {challenge.solved && (
          <div className="mb-6 p-4 rounded-lg bg-emerald-950/40 border border-emerald-700/50 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-900/60 text-emerald-300 flex items-center justify-center font-bold">
              ✓
            </div>
            <div>
              <div className="text-sm font-semibold text-emerald-300">
                Challenge Solved!
              </div>
              <div className="text-xs text-emerald-400/80">
                Your team has successfully captured this flag and been awarded {challenge.points} points.
              </div>
            </div>
          </div>
        )}

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
                  placeholder="FLAG{example_flag_here}"
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
      </div>
    </div>
  );
}
