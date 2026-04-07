'use client';
import { useState, useEffect, createContext, useContext } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

interface SidebarContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType>({ isOpen: false, setIsOpen: () => {} });

export const useSidebar = () => useContext(SidebarContext);

interface DashboardClientLayoutProps {
  userRole: string;
  user: any;
  children: React.ReactNode;
}

export default function DashboardClientLayout({ children, userRole, user }: DashboardClientLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <SidebarContext.Provider value={{ isOpen: sidebarOpen, setIsOpen: setSidebarOpen }}>
      <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
        <Sidebar userRole={userRole} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header user={user} />
          <main className="flex-1 overflow-y-auto p-4 md:p-6 scrollbar-thin">
            <div className="max-w-7xl mx-auto animate-fade-up">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarContext.Provider>
  );
}