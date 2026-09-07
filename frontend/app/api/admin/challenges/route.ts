import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_URL } from '@/lib/config';

export async function GET(request: NextRequest) {
    const accessToken = request.cookies.get('accessToken')?.value;
    if (!accessToken) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const backendRes = await fetch(`${BACKEND_URL}/challenges/admin/all`, {
        headers: { Authorization: `Bearer ${accessToken}` },
    });

    const text = await backendRes.text();
    const data = text ? JSON.parse(text) : [];
    return NextResponse.json(data, { status: backendRes.status });
}

export async function POST(request: NextRequest) {
    const accessToken = request.cookies.get('accessToken')?.value;
    if (!accessToken) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();

    const backendRes = await fetch(`${BACKEND_URL}/challenges`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(body),
    });

    const data = await backendRes.json();
    return NextResponse.json(data, { status: backendRes.status });
}