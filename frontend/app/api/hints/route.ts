import { NextRequest } from 'next/server';
import { proxyToBackend } from '@/lib/proxy';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  return proxyToBackend(request, '/hints', {
    method: 'POST',
    body,
  });
}
