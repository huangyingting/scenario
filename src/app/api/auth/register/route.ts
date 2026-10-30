import { NextResponse } from 'next/server';
import {
  AccountAdmissionError,
  redeemInvitationAndRegister,
} from '@/lib/account-admission';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const ipAddress =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || 'ScenarioWeb/1.0';

    const result = await redeemInvitationAndRegister({
      code: String(body.code || ''),
      email: String(body.email || ''),
      password: String(body.password || ''),
      name: String(body.name || ''),
      workspaceName: body.workspaceName ? String(body.workspaceName) : undefined,
      ipAddress,
      userAgent,
    });

    return NextResponse.json(
      {
        ok: true,
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          role: result.user.role,
          currentTeamId: result.teamId,
          currentProjectId: result.projectId,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    if (err instanceof AccountAdmissionError) {
      return NextResponse.json(
        { ok: false, code: err.code, error: err.message },
        { status: err.status }
      );
    }
    return NextResponse.json(
      { ok: false, code: 'internal_error', error: 'Registration failed.' },
      { status: 500 }
    );
  }
}
