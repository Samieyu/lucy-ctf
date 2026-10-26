import { NextRequest } from 'next/server';
import { proxyToBackend } from '@/lib/proxy';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return proxyToBackend(request, `/admin/teams/${id}`, {
    method: 'DELETE',
  });
}
