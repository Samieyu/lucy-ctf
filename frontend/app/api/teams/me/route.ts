import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_URL } from '@/lib/config';

export async function GET(request: NextRequest) {
  const accessToken = request.cookies.get('accessToken')?.value;
  if (!accessToken) {
    return NextResponse.json({ team: null }, { status: 200 });
  }

  try {
    const backendRes = await fetch(`${BACKEND_URL}/teams/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const text = await backendRes.text();
    const data = text ? JSON.parse(text) : null;

    if (!backendRes.ok) {
      return NextResponse.json({ team: null }, { status: 200 });
    }

    return NextResponse.json({ team: data });
  } catch (err) {
    console.error('Failed to fetch team:', err);
    return NextResponse.json({ team: null }, { status: 200 });
  }
}