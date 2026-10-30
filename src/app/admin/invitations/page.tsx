import { redirect } from 'next/navigation';

export default function AdminInvitationsShortcutPage() {
  redirect('/settings/invitations');
}
