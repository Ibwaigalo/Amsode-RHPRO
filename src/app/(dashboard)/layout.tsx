import { auth } from '../../lib/auth/config';
import { redirect } from 'next/navigation';
import DashboardClientLayout from '../../components/layout/DashboardClientLayout';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  
  if (!session || !session.user) {
    redirect('/auth/signin');
  }

  return (
    <DashboardClientLayout userRole={(session.user as any).role || 'EMPLOYE'} user={session.user}>
      {children}
    </DashboardClientLayout>
  );
}