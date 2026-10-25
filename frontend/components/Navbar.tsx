'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function Navbar() {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Don't show full nav on landing or login/register pages unless logged in
  const isAuthPage = pathname === '/login' || pathname === '/register';

  const navLinks = [
    { label: 'Challenges', href: '/challenges' },
    { label: 'Leaderboard', href: '/leaderboard' },
    { label: 'Team', href: '/team' },
    { label: 'Dashboard', href: '/dashboard' },
  ];

  return (
    <header className="border-b border-neutral-800 bg-neutral-950/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center space-x-3">
            <Link href={user ? '/dashboard' : '/'} className="flex items-center space-x-2 group">
              <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-600 via-emerald-600 to-emerald-500 flex items-center justify-center font-mono font-bold text-neutral-950 shadow-md group-hover:shadow-emerald-500/20 transition-all">
                L
              </span>
              <div className="flex flex-col">
                <span className="font-bold tracking-tight text-white group-hover:text-emerald-400 transition-colors">
                  Lucy <span className="text-emerald-400 font-mono">CTF</span>
                </span>
                <span className="text-[10px] text-amber-500/80 uppercase tracking-widest font-mono">
                  Dinkinesh
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Nav */}
          {user && !isAuthPage && (
            <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
              {navLinks.map((link) => {
                const isActive = pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-neutral-900 text-emerald-400 border border-emerald-500/30'
                        : 'text-neutral-400 hover:text-white hover:bg-neutral-900/60'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}

              {user.isAdmin && (
                <Link
                  href="/admin/challenges"
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    pathname.startsWith('/admin')
                      ? 'bg-amber-950/50 text-amber-400 border border-amber-500/40'
                      : 'text-amber-400/80 hover:text-amber-300 hover:bg-amber-950/30'
                  }`}
                >
                  Admin
                </Link>
              )}
            </nav>
          )}

          {/* Right section: user info / actions */}
          <div className="hidden md:flex items-center space-x-4">
            {!loading && user ? (
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <div className="text-xs font-medium text-neutral-200">
                    {user.username}
                  </div>
                  <div className="text-[10px] text-neutral-500 font-mono">
                    {user.isAdmin ? 'Admin' : 'Competitor'}
                  </div>
                </div>
                <button
                  onClick={() => logout()}
                  className="px-3 py-1.5 rounded-md text-xs font-medium bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : !loading && !user && !isAuthPage ? (
              <div className="flex items-center space-x-2">
                <Link
                  href="/login"
                  className="px-3 py-1.5 rounded-md text-xs font-medium text-neutral-300 hover:text-white hover:bg-neutral-900"
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  className="px-3 py-1.5 rounded-md text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm"
                >
                  Register
                </Link>
              </div>
            ) : null}
          </div>

          {/* Mobile menu button */}
          {user && !isAuthPage && (
            <div className="flex md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-md text-neutral-400 hover:text-white hover:bg-neutral-900 focus:outline-none"
                aria-label="Toggle navigation menu"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && user && !isAuthPage && (
        <div className="md:hidden border-t border-neutral-900 bg-neutral-950 px-4 pt-2 pb-4 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-neutral-300 hover:text-white hover:bg-neutral-900"
            >
              {link.label}
            </Link>
          ))}
          {user.isAdmin && (
            <Link
              href="/admin/challenges"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-amber-400 hover:bg-amber-950/30"
            >
              Admin Challenges
            </Link>
          )}
          <div className="pt-3 border-t border-neutral-900 flex items-center justify-between">
            <span className="text-xs text-neutral-400">{user.username}</span>
            <button
              onClick={() => logout()}
              className="px-3 py-1.5 rounded-md text-xs font-medium bg-neutral-900 text-neutral-300"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
