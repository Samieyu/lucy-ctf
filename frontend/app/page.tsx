import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-16 text-center max-w-4xl mx-auto">
      {/* Badge */}
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-xs font-mono text-amber-400 mb-6 shadow-sm">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        <span>Lucy CTF &bull; Dinkinesh Edition</span>
      </div>

      {/* Hero Headline */}
      <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-tight">
        Discover hidden fragments.{' '}
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300">
          Capture every flag.
        </span>
      </h1>

      {/* Subtitle */}
      <p className="mt-5 max-w-xl text-neutral-400 text-base sm:text-lg leading-relaxed">
        A self-hosted Capture-The-Flag cybersecurity platform. Form teams, decrypt artifacts, analyze systems, and ascend the live scoreboard.
      </p>

      {/* CTAs */}
      <div className="mt-8 flex flex-col sm:flex-row items-center gap-4">
        <Link
          href="/register"
          className="w-full sm:w-auto px-8 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-neutral-950 font-bold font-mono text-sm shadow-lg shadow-emerald-600/25 transition-all"
        >
          Get Started &rarr;
        </Link>
        <Link
          href="/login"
          className="w-full sm:w-auto px-8 py-3 rounded-xl border border-neutral-800 bg-neutral-900/60 hover:bg-neutral-900 text-neutral-300 hover:text-white font-mono text-sm transition-all"
        >
          Sign In
        </Link>
      </div>

      {/* Feature highlights */}
      <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 text-left w-full border-t border-neutral-900 pt-12">
        <div className="p-4 rounded-xl border border-neutral-900 bg-neutral-900/20">
          <div className="text-amber-400 font-mono text-sm font-bold mb-1">01 / Teams</div>
          <div className="text-xs text-neutral-400">
            Compete collaboratively with up to 4 members per team and captain succession.
          </div>
        </div>
        <div className="p-4 rounded-xl border border-neutral-900 bg-neutral-900/20">
          <div className="text-emerald-400 font-mono text-sm font-bold mb-1">02 / Dynamic Challenges</div>
          <div className="text-xs text-neutral-400">
            Web, Crypto, Forensics, Reverse Engineering, and Pwn with atomic scoring.
          </div>
        </div>
        <div className="p-4 rounded-xl border border-neutral-900 bg-neutral-900/20">
          <div className="text-teal-400 font-mono text-sm font-bold mb-1">03 / Live Scoreboard</div>
          <div className="text-xs text-neutral-400">
            Real-time standings with precise tie-breaking and individual solver statistics.
          </div>
        </div>
      </div>
    </div>
  );
}
