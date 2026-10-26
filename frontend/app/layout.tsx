import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import RealtimeNotifier from '@/components/RealtimeNotifier';

export const metadata: Metadata = {
  title: 'Lucy CTF',
  description: 'Self-hosted Capture-The-Flag platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased dark">
      <body className="min-h-full flex flex-col bg-neutral-950 text-neutral-100 selection:bg-emerald-500/30 selection:text-emerald-300">
        <AuthProvider>
          <Navbar />
          <RealtimeNotifier />
          <main className="flex-1 flex flex-col">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
