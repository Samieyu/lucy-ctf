import { NextRequest } from 'next/server';
import { proxyToBackend } from '@/lib/proxy';

export async function GET(request: NextRequest) {
  const category = request.nextUrl.searchParams.get('category');
  const endpoint = category
    ? `/challenges?category=${encodeURIComponent(category)}`
    : '/challenges';

  return proxyToBackend(request, endpoint);
}
