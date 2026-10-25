'use client';

import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';

interface Challenge {
  id: string;
  title: string;
  description: string;
  category: string;
  points: number;
  solved: boolean;
  solveCount: number;
  filePath?: string | null;
}

const CATEGORIES = [
  'ALL',
  'WEB',
  'CRYPTO',
  'FORENSICS',
  'REVERSE_ENGINEERING',
  'MISC',
  'PWN',
];

export default function ChallengesPage() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const fetchChallenges = async (category: string) => {
    setLoading(true);
    setError(null);
    try {
      const url =
        category === 'ALL'
          ? '/api/challenges'
          : `/api/challenges?category=${encodeURIComponent(category)}`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error('Failed to fetch challenges');
      }
      const data = await res.json();
      setChallenges(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error loading challenges');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChallenges(selectedCategory);
  }, [selectedCategory]);

  const handleCategoryChange = (category: string) => {
    startTransition(() => {
      setSelectedCategory(category);
    });
  };

  const totalPoints = challenges.reduce((acc, c) => acc + c.points, 0);
  const solvedCount = challenges.filter((c) => c.solved).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-neutral-800 pb-6 mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            Challenges
            <span className="text-xs font-mono font-normal px-2.5 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800/40">
              {solvedCount}/{challenges.length} solved
            </span>
          </h1>
          <p className="mt-1 text-sm text-neutral-400">
            Capture flags and earn points for your team across diverse security domains.
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono text-neutral-400 bg-neutral-900/60 px-4 py-2 rounded-lg border border-neutral-800">
          <div>
            Total Pool:{' '}
            <span className="text-emerald-400 font-semibold">{totalPoints} pts</span>
          </div>
        </div>
      </div>

      {/* Category filter chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 scrollbar-thin scrollbar-thumb-neutral-800">
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => handleCategoryChange(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium font-mono uppercase tracking-wider transition-all whitespace-nowrap ${
                isSelected
                  ? 'bg-emerald-500 text-neutral-950 shadow-md shadow-emerald-500/20 font-bold'
                  : 'bg-neutral-900 text-neutral-400 hover:text-white hover:bg-neutral-800 border border-neutral-800'
              }`}
            >
              {cat.replace('_', ' ')}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {error && (
        <div className="p-4 rounded-lg bg-red-950/40 border border-red-900/60 text-red-300 text-sm mb-6 flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={() => fetchChallenges(selectedCategory)}
            className="text-xs underline hover:text-red-200"
          >
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div
              key={n}
              className="h-48 rounded-xl bg-neutral-900/40 border border-neutral-800/60 animate-pulse p-6 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="h-4 bg-neutral-800 rounded w-1/3"></div>
                <div className="h-6 bg-neutral-800 rounded w-3/4"></div>
                <div className="h-3 bg-neutral-800 rounded w-full"></div>
              </div>
              <div className="h-4 bg-neutral-800 rounded w-1/4"></div>
            </div>
          ))}
        </div>
      ) : challenges.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-neutral-800 rounded-xl bg-neutral-900/20">
          <div className="w-12 h-12 rounded-full bg-neutral-900 border border-neutral-800 mx-auto flex items-center justify-center text-neutral-500 text-xl font-mono mb-3">
            ∅
          </div>
          <h3 className="text-base font-medium text-neutral-200">No challenges found</h3>
          <p className="mt-1 text-sm text-neutral-500 max-w-sm mx-auto">
            {selectedCategory === 'ALL'
              ? 'No active challenges are currently available in the CTF.'
              : `No challenges found in category "${selectedCategory.replace('_', ' ')}".`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {challenges.map((c) => (
            <Link
              key={c.id}
              href={`/challenges/${c.id}`}
              className={`group relative rounded-xl border p-6 flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 ${
                c.solved
                  ? 'bg-neutral-900/80 border-emerald-600/40 shadow-sm shadow-emerald-950/50'
                  : 'bg-neutral-900/40 border-neutral-800/80 hover:border-neutral-700 hover:bg-neutral-900/70'
              }`}
            >
              <div>
                {/* Top row: Category & Solved badge */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-mono font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-neutral-800/80 text-amber-400/90 border border-neutral-700/60">
                    {c.category.replace('_', ' ')}
                  </span>

                  {c.solved ? (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-700/60">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                      Solved
                    </span>
                  ) : (
                    <span className="text-[11px] font-mono text-neutral-500">
                      {c.solveCount} {c.solveCount === 1 ? 'solve' : 'solves'}
                    </span>
                  )}
                </div>

                {/* Challenge Title */}
                <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors">
                  {c.title}
                </h3>

                {/* Description Excerpt */}
                <p className="mt-2 text-xs text-neutral-400 line-clamp-2 leading-relaxed">
                  {c.description}
                </p>
              </div>

              {/* Bottom row: Points & solve info */}
              <div className="mt-6 pt-4 border-t border-neutral-800/60 flex items-center justify-between text-xs font-mono">
                <span className="text-emerald-400 font-bold text-sm">
                  {c.points} <span className="text-[11px] font-normal text-neutral-500">pts</span>
                </span>

                <span className="text-neutral-400 group-hover:text-emerald-400 transition-colors flex items-center gap-1">
                  View Challenge &rarr;
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
