import { NextRequest, NextResponse } from 'next/server';
import { proxyToBackend } from '@/lib/proxy';
import { BACKEND_URL } from '@/lib/config';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return proxyToBackend(request, `/challenges/${id}/attachments`);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const accessToken = request.cookies.get('accessToken')?.value;
  try {
    const formData = await request.formData();
    const res = await fetch(`${BACKEND_URL}/challenges/${id}/attachments`, {
      method: 'POST',
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      body: formData,
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Upload failed';
    return NextResponse.json({ message }, { status: 500 });
  }
}
