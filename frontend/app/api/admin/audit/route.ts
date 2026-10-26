import { NextRequest } from 'next/server';
import { proxyToBackend } from '@/lib/proxy';

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.toString();
  return proxyToBackend(request, `/admin/audit?${query}`);
}
