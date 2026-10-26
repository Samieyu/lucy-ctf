import { NextRequest } from 'next/server';
import { proxyToBackend } from '@/lib/proxy';

export async function PATCH(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  return proxyToBackend(request, '/event/admin', {
    method: 'PATCH',
    body,
  });
}
