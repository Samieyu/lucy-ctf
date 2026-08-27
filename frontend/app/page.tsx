import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-950 px-4 text-center">
      <h1 className="text-4xl font-bold text-white">Lucy CTF</h1>
      <p className="mt-3 max-w-md text-neutral-400">
        A Capture-The-Flag cybersecurity platform. Dig in, find the flags,
        climb the leaderboard.
      </p>

      <div className="mt-8 flex gap-3">
        <Link
          href="/login"
          className="rounded-md border border-neutral-700 px-4 py-2 text-white hover:bg-neutral-900"
        >
          Log in
        </Link>
        <Link
          href="/register"
          className="rounded-md bg-emerald-700 px-4 py-2 text-white hover:bg-emerald-600"
        >
          Sign up
        </Link>
      </div>
    </div>
  );
}