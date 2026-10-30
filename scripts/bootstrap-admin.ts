import { readFileSync } from 'node:fs';
import { bootstrapAdmin } from '../src/lib/account-admission/bootstrap';
import { issueInvitationCode } from '../src/lib/account-admission/invitations';

function loadEnv() {
  for (const file of ['.env.local', '.env']) {
    try {
      process.loadEnvFile?.(file);
    } catch {
      // ignore missing env file
    }
  }
}

function parseArgs(argv: string[]) {
  let email = process.env.BOOTSTRAP_ADMIN_EMAIL || '';
  let name = process.env.BOOTSTRAP_ADMIN_NAME || '';
  let password = process.env.BOOTSTRAP_ADMIN_PASSWORD || '';
  let passwordStdin = false;
  let issueInvite = false;
  let inviteOnly = false;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--email' && argv[i + 1]) email = argv[++i];
    else if (arg.startsWith('--email=')) email = arg.slice('--email='.length);
    else if (arg === '--name' && argv[i + 1]) name = argv[++i];
    else if (arg.startsWith('--name=')) name = arg.slice('--name='.length);
    else if (arg === '--password' && argv[i + 1]) password = argv[++i];
    else if (arg.startsWith('--password=')) password = arg.slice('--password='.length);
    else if (arg === '--password-stdin') passwordStdin = true;
    else if (arg === '--issue-invite') issueInvite = true;
    else if (arg === '--invite-only') inviteOnly = true;
  }

  return { email, name, password, passwordStdin, issueInvite, inviteOnly };
}

async function main() {
  loadEnv();
  const args = parseArgs(process.argv.slice(2));
  if (args.inviteOnly) {
    const invite = await issueInvitationCode({
      label: args.name || 'Bootstrap Super Admin Invitation',
      role: 'SUPER_ADMIN',
      workspaceRole: 'admin',
      boundEmail: args.email || null,
      maxUses: 1,
      expiresInHours: 168,
    });
    console.log(
      JSON.stringify({
        ok: true,
        inviteOnly: true,
        invitationCode: invite.code,
        role: invite.role,
        expiresAt: invite.expiresAt,
      })
    );
    return;
  }

  const password = args.passwordStdin
    ? readFileSync(0, 'utf8').replace(/\r?\n$/, '')
    : args.password;

  if (!args.email || !password) {
    console.error(
      'Usage: npx tsx scripts/bootstrap-admin.ts --email <email> --password <password> [--name <name>] [--issue-invite]'
    );
    process.exit(2);
  }

  const result = await bootstrapAdmin({
    email: args.email,
    password,
    name: args.name || null,
    issueInvite: args.issueInvite,
  });

  console.log(
    JSON.stringify({
      ok: true,
      created: result.created,
      userId: result.user.id,
      email: result.user.email,
      role: result.user.role,
      teamId: result.teamId,
      projectId: result.projectId,
      invitationCode: result.invitationCode,
    })
  );
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
