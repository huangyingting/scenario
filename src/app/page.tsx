import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { MarketingLanding } from '@/components/marketing/MarketingLanding';
import { AuthenticatedDashboard } from '@/components/dashboard/AuthenticatedDashboard';

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  if (session?.user) {
    return <AuthenticatedDashboard />;
  }
  return <MarketingLanding />;
}
