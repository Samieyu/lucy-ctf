import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_URL } from '@/lib/config';

export async function POST(request: NextRequest) {
  const accessToken = request.cookies.get('accessToken')?.value;
  if (!accessToken) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  const backendRes = await fetch(`${BACKEND_URL}/teams/leave`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const data = await backendRes.json();
  return NextResponse.json(data, { status: backendRes.status });
}