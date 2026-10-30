import { NextResponse } from 'next/server';
import { validateInvitationCode } from '@/lib/account-admission';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code') || '';
  const email = searchParams.get('email') || undefined;

  const result = await validateInvitationCode(code, email, { logAudit: false });
  return NextResponse.json(result);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = await validateInvitationCode(
      String(body.code || ''),
      body.email ? String(body.email) : undefined,
      { logAudit: false }
    );
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { valid: false, status: 'NOT_FOUND', reason: 'Invalid request.' },
      { status: 400 }
    );
  }
}
