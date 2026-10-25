import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_URL } from '@/lib/config';

interface ProxyOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
}

export async function proxyToBackend(
  request: NextRequest,
  endpoint: string,
  options: ProxyOptions = {},
) {
  let accessToken = request.cookies.get('accessToken')?.value;
  const refreshToken = request.cookies.get('refreshToken')?.value;

  const makeRequest = async (token?: string) => {
    const headers: Record<string, string> = {
      ...(options.headers || {}),
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (options.body && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    return fetch(`${BACKEND_URL}${endpoint}`, {
      method: options.method || 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
  };

  let backendRes = await makeRequest(accessToken);
  let newAccessToken: string | null = null;

  // On a 401 from the backend in the proxy routes, try the refreshToken cookie once, set the new accessToken cookie, and retry.
  if (backendRes.status === 401 && refreshToken) {
    try {
      const refreshRes = await fetch(`${BACKEND_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (refreshRes.ok) {
        const refreshData = await refreshRes.json();
        if (refreshData?.accessToken) {
          newAccessToken = refreshData.accessToken;
          accessToken = refreshData.accessToken;
          backendRes = await makeRequest(accessToken);
        }
      }
    } catch {
      // Refresh failed, proceed with original response
    }
  }

  // Tolerate empty/non-JSON backend bodies (read text, then JSON.parse if non-empty)
  const rawText = await backendRes.text();
  let responseData: unknown = null;
  if (rawText && rawText.trim().length > 0) {
    try {
      responseData = JSON.parse(rawText);
    } catch {
      responseData = { message: rawText };
    }
  }

  const response = NextResponse.json(responseData ?? {}, {
    status: backendRes.status,
  });

  if (newAccessToken) {
    response.cookies.set('accessToken', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 15 * 60, // 15m
    });
  }

  return response;
}
