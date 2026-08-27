import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_URL } from '@/lib/config';

const ACCESS_TOKEN_MAX_AGE = 15 * 60; // 15 minutes, matches backend access token expiry
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60; // 7 days, matches backend refresh token expiry

export async function POST(request: NextRequest) {
  const body = await request.json();

  const backendRes = await fetch(`${BACKEND_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await backendRes.json();

  if (!backendRes.ok) {
    return NextResponse.json(data, { status: backendRes.status });
  }

  const response = NextResponse.json({ success: true });

  response.cookies.set('accessToken', data.accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: ACCESS_TOKEN_MAX_AGE,
  });

  response.cookies.set('refreshToken', data.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: REFRESH_TOKEN_MAX_AGE,
  });

  return response;
}
