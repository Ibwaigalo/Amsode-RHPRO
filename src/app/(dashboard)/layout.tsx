import { auth } from '../../lib/auth/config';
import { redirect } from 'next/navigation';
import Sidebar from '../../components/layout/Sidebar';
import Header from '../../components/layout/Header';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  
  if (!session || !session.user) {
    redirect('/auth/signin');
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
      <Sidebar userRole={(session.user as any).role || 'EMPLOYE'} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header user={session.user} />
        <main className="flex-1 overflow-y-auto p-6 scrollbar-thin">
          <div className="max-w-7xl mx-auto animate-fade-up">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
