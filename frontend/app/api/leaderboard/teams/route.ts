import { NextRequest } from 'next/server';
import { proxyToBackend } from '@/lib/proxy';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams.toString();
  const endpoint = searchParams
    ? `/leaderboard/teams?${searchParams}`
    : '/leaderboard/teams';
  return proxyToBackend(request, endpoint);
}
