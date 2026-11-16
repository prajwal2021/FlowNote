import { NextResponse } from 'next/server';
import { currentUser, type SessionUser } from './auth';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type, X-FlowNote-Title, X-FlowNote-Kind, X-FlowNote-File-Name',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

export function json(data: unknown, status = 200, headers: Record<string, string> = {}): NextResponse {
  return NextResponse.json(data, { status, headers: { ...CORS, 'Cache-Control': 'no-store', ...headers } });
}

export function fail(status: number, error: string): NextResponse {
  return json({ error }, status);
}

export function preflight(): NextResponse {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function requireUser(): Promise<{ user: SessionUser } | { response: NextResponse }> {
  const user = await currentUser();
  return user ? { user } : { response: fail(401, 'Not signed in.') };
}

export async function requireAdmin(): Promise<{ user: SessionUser } | { response: NextResponse }> {
  const result = await requireUser();
  if ('response' in result) return result;
  return result.user.role === 'admin' ? result : { response: fail(403, 'Admins only.') };
}
