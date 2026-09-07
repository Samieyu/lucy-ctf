import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_URL } from '@/lib/config';

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    const { id } = await params;
    const accessToken = request.cookies.get('accessToken')?.value;
    if (!accessToken) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();

    const backendRes = await fetch(`${BACKEND_URL}/challenges/${id}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(body),
    });

    const data = await backendRes.json();
    return NextResponse.json(data, { status: backendRes.status });
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    const { id } = await params;
    const accessToken = request.cookies.get('accessToken')?.value;
    if (!accessToken) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const backendRes = await fetch(`${BACKEND_URL}/challenges/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
    });

    const data = await backendRes.json();
    return NextResponse.json(data, { status: backendRes.status });
}