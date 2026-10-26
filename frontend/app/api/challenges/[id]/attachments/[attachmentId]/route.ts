import { NextRequest, NextResponse } from 'next/server';
import { proxyToBackend } from '@/lib/proxy';
import { BACKEND_URL } from '@/lib/config';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; attachmentId: string }> },
) {
  const { id, attachmentId } = await params;
  const accessToken = request.cookies.get('accessToken')?.value;

  try {
    const res = await fetch(`${BACKEND_URL}/challenges/${id}/attachments/${attachmentId}`, {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    });

    if (!res.ok) {
      return new NextResponse('Attachment not found or access denied', { status: res.status });
    }

    const headers = new Headers();
    headers.set('Content-Type', res.headers.get('Content-Type') || 'application/octet-stream');
    const contentDisposition = res.headers.get('Content-Disposition');
    if (contentDisposition) {
      headers.set('Content-Disposition', contentDisposition);
    }

    return new NextResponse(res.body, {
      status: 200,
      headers,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Download failed';
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; attachmentId: string }> },
) {
  const { id, attachmentId } = await params;
  return proxyToBackend(request, `/challenges/${id}/attachments/${attachmentId}`, {
    method: 'DELETE',
  });
}
