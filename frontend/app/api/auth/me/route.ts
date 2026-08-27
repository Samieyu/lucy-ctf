import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_URL } from '@/lib/config';

export async function GET(request: NextRequest) {
  const accessToken = request.cookies.get('accessToken')?.value;

  if (!accessToken) {
    return NextResponse.json({ user: null }, { status: 200 });
  }

  const backendRes = await fetch(`${BACKEND_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!backendRes.ok) {
    return NextResponse.json({ user: null }, { status: 200 });
  }

  const user = await backendRes.json();
  return NextResponse.json({ user });
}
