'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

interface TwoFactorSetup {
  secret: string;
  otpauthUrl: string;
  qrCodeUrl: string;
}

export default function ProfilePage() {
  const { user } = useAuth();

  // 2FA state
  const [setupData, setSetupData] = useState<TwoFactorSetup | null>(null);
  const [verifyCode, setVerifyCode] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);
  const [twoFactorError, setTwoFactorError] = useState<string | null>(null);
  const [twoFactorSuccess, setTwoFactorSuccess] = useState<string | null>(null);

  const handleStart2FASetup = async () => {
    setTwoFactorLoading(true);
    setTwoFactorError(null);
    try {
      const res = await fetch('/api/auth/2fa/generate', { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setSetupData(data);
      } else {
        setTwoFactorError(data.message || 'Failed to initialize 2FA setup.');
      }
    } catch {
      setTwoFactorError('Network error starting 2FA setup.');
    } finally {
      setTwoFactorLoading(false);
    }
  };

  const handleConfirm2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyCode.trim() || twoFactorLoading) return;
    setTwoFactorLoading(true);
    setTwoFactorError(null);

    try {
      const res = await fetch('/api/auth/2fa/enable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: verifyCode.trim() }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        setSetupData(null);
        setVerifyCode('');
        setRecoveryCodes(data.recoveryCodes || []);
        setTwoFactorSuccess('Two-factor authentication has been enabled on your account!');
      } else {
        setTwoFactorError(data.message || 'Invalid verification code. Please check your authenticator app.');
      }
    } catch {
      setTwoFactorError('Error verifying 2FA code.');
    } finally {
      setTwoFactorLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    const code = prompt('Enter a current 6-digit 2FA code or recovery key to confirm disabling:');
    if (!code) return;

    setTwoFactorLoading(true);
    try {
      const res = await fetch('/api/auth/2fa/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setTwoFactorSuccess('Two-factor authentication has been disabled.');
        setRecoveryCodes(null);
      } else {
        alert(data.message || 'Failed to disable 2FA.');
      }
    } catch {
      alert('Error disabling 2FA.');
    } finally {
      setTwoFactorLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white tracking-tight">Account & Security</h1>
        <p className="text-xs text-neutral-400 font-mono mt-1">
          Manage your credentials, team association, and multi-factor authentication.
        </p>
      </div>

      <div className="space-y-6">
        {/* User Info Card */}
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-6 backdrop-blur-sm">
          <h2 className="text-sm font-mono font-semibold text-neutral-300 uppercase tracking-wider mb-4">
            Profile Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
            <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800">
              <div className="text-neutral-500 text-[10px] uppercase">Username</div>
              <div className="text-white font-semibold mt-1">{user?.username || '—'}</div>
            </div>
            <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800">
              <div className="text-neutral-500 text-[10px] uppercase">Email</div>
              <div className="text-white font-semibold mt-1">{user?.email || '—'}</div>
            </div>
            <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800">
              <div className="text-neutral-500 text-[10px] uppercase">Role</div>
              <div className="text-emerald-400 font-semibold mt-1">
                {user?.isAdmin ? 'Platform Administrator' : 'Competitor'}
              </div>
            </div>
          </div>
        </div>

        {/* 2FA Security Card */}
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-6 backdrop-blur-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-mono font-semibold text-neutral-300 uppercase tracking-wider">
                Two-Factor Authentication (TOTP)
              </h2>
              <p className="text-xs text-neutral-400 mt-1">
                Add an extra layer of security using Google Authenticator, 1Password, or any RFC 6238 TOTP client.
              </p>
            </div>
          </div>

          {twoFactorSuccess && (
            <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-700 text-xs text-emerald-300 font-mono">
              {twoFactorSuccess}
            </div>
          )}

          {twoFactorError && (
            <div className="p-3 rounded-lg bg-red-950/60 border border-red-800 text-xs text-red-300 font-mono">
              {twoFactorError}
            </div>
          )}

          {/* Recovery codes display */}
          {recoveryCodes && recoveryCodes.length > 0 && (
            <div className="p-4 rounded-lg bg-neutral-950 border border-amber-600/50 space-y-3">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase font-mono">
                <span>⚠️</span> Save Your Emergency Recovery Codes
              </div>
              <p className="text-xs text-neutral-300">
                Each single-use recovery code can be used to log in if you lose access to your authenticator app. Store them somewhere safe.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs text-emerald-300 bg-neutral-900 p-3 rounded border border-neutral-800">
                {recoveryCodes.map((code, idx) => (
                  <div key={idx} className="p-1 text-center bg-neutral-950 rounded border border-neutral-800 select-all">
                    {code}
                  </div>
                ))}
              </div>
            </div>
          )}

          {!setupData ? (
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleStart2FASetup}
                disabled={twoFactorLoading}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-neutral-950 font-mono text-xs font-semibold disabled:opacity-50 transition-colors"
              >
                {twoFactorLoading ? 'Loading...' : 'Set Up Two-Factor Authentication'}
              </button>
              <button
                onClick={handleDisable2FA}
                disabled={twoFactorLoading}
                className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-mono text-xs transition-colors"
              >
                Disable 2FA
              </button>
            </div>
          ) : (
            <div className="p-4 rounded-lg bg-neutral-950 border border-neutral-800 space-y-4">
              <h3 className="text-xs font-mono font-bold text-white uppercase">
                Step 1: Scan QR Code in your Authenticator
              </h3>
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="p-3 bg-white rounded-lg">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={setupData.qrCodeUrl}
                    alt="2FA QR Code"
                    className="w-40 h-40"
                  />
                </div>
                <div className="space-y-2 text-xs font-mono">
                  <div className="text-neutral-400">Manual Setup Key:</div>
                  <div className="p-2 bg-neutral-900 rounded border border-neutral-800 text-emerald-400 font-bold select-all break-all">
                    {setupData.secret}
                  </div>
                  <p className="text-[11px] text-neutral-500">
                    If you cannot scan the QR code, manually type the secret key into your authenticator app.
                  </p>
                </div>
              </div>

              <h3 className="text-xs font-mono font-bold text-white uppercase pt-2">
                Step 2: Enter 6-digit Code to Activate
              </h3>
              <form onSubmit={handleConfirm2FA} className="flex gap-2 max-w-sm">
                <input
                  type="text"
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value)}
                  placeholder="000000"
                  className="flex-1 px-3 py-2 rounded bg-neutral-900 border border-neutral-700 text-xs font-mono text-center tracking-widest text-white focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="submit"
                  disabled={twoFactorLoading || !verifyCode.trim()}
                  className="px-4 py-2 rounded bg-emerald-600 hover:bg-emerald-500 text-neutral-950 font-bold text-xs font-mono disabled:opacity-50"
                >
                  {twoFactorLoading ? 'Verifying...' : 'Enable 2FA'}
                </button>
                <button
                  type="button"
                  onClick={() => setSetupData(null)}
                  className="px-3 py-2 rounded bg-neutral-800 text-neutral-300 text-xs font-mono"
                >
                  Cancel
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Team shortcut */}
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-6 backdrop-blur-sm flex items-center justify-between">
          <div>
            <h2 className="text-sm font-mono font-semibold text-neutral-300 uppercase tracking-wider">
              CTF Team Membership
            </h2>
            <p className="text-xs text-neutral-400 mt-1">
              Join, manage, or transfer captaincy of your CTF squad.
            </p>
          </div>
          <Link
            href="/team"
            className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-mono text-xs transition-colors"
          >
            Manage Team &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
