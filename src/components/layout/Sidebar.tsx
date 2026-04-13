'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '../../lib/utils/cn';
import {
  LayoutDashboard, Users, DollarSign, Calendar, Briefcase,
  Star, BookOpen, FileText, Settings, LogOut, ChevronLeft, Menu, X, UserMinus
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSidebar } from './DashboardClientLayout';

const navItems = [
  { href: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard, roles: ['ADMIN_RH', 'MANAGER', 'EMPLOYE', 'PRESIDENT'] },
  { href: '/employees', label: 'Membres', icon: Users, roles: ['ADMIN_RH', 'MANAGER', 'PRESIDENT'] },
  { href: '/employees/exits', label: 'Sorties', icon: UserMinus, roles: ['ADMIN_RH', 'PRESIDENT'] },
  { href: '/payroll', label: 'Paie', icon: DollarSign, roles: ['ADMIN_RH', 'PRESIDENT'] },
  { href: '/leaves', label: 'Congés', icon: Calendar, roles: ['ADMIN_RH', 'MANAGER', 'EMPLOYE', 'PRESIDENT'] },
  { href: '/recruitment', label: 'Recrutement', icon: Briefcase, roles: ['ADMIN_RH', 'MANAGER', 'PRESIDENT'] },
  { href: '/evaluations', label: 'Évaluations', icon: Star, roles: ['ADMIN_RH', 'MANAGER', 'EMPLOYE', 'PRESIDENT'] },
  { href: '/training', label: 'Formations', icon: BookOpen, roles: ['ADMIN_RH', 'MANAGER', 'EMPLOYE', 'PRESIDENT'] },
  { href: '/documents', label: 'Documents', icon: FileText, roles: ['ADMIN_RH', 'MANAGER', 'EMPLOYE', 'PRESIDENT'] },
  { href: '/settings', label: 'Paramètres', icon: Settings, roles: ['ADMIN_RH', 'PRESIDENT'] },
];

interface SidebarProps { userRole: string; }

export default function Sidebar({ userRole }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { isOpen, setIsOpen } = useSidebar();
  const visible = navItems.filter(item => item.roles.includes(userRole));

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }, [isOpen]);

  const sidebarContent = (
    <motion.aside 
      className={cn(
        'flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800',
        isMobile && isOpen ? 'fixed inset-y-0 left-0 z-50 w-64' : '',
        !isMobile && collapsed ? 'w-16' : 'w-64'
      )}
      animate={{ width: isMobile ? 256 : (collapsed ? 64 : 256) }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
    >
      <div className="flex items-center justify-between px-3 py-4 border-b border-gray-200 dark:border-gray-800">
        <AnimatePresence mode="wait">
          {(isMobile && isOpen) || !collapsed ? (
            <motion.div 
              key="expanded"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 shadow-sm bg-white">
                <img src="/logo.png" alt="AMSODE" className="w-full h-full object-contain" />
              </div>
              <div>
                <p className="font-bold text-sm text-[#0090D1]">AMSODE</p>
                <p className="text-xs text-[#86C440]">RH PRO</p>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="collapsed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-10 h-10 rounded-lg overflow-hidden mx-auto shadow-sm bg-white"
            >
              <img src="/logo.png" alt="AMSODE" className="w-full h-full object-contain" />
            </motion.div>
          )}
        </AnimatePresence>
        {isMobile && isOpen ? (
          <button onClick={() => setIsOpen(false)}
            className="text-gray-400 hover:text-[#0090D1] p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
            <X className="w-5 h-5" />
          </button>
        ) : !isMobile ? (
          <motion.button 
            onClick={() => setCollapsed(!collapsed)}
            className="text-gray-400 hover:text-[#0090D1] p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            {collapsed ? <Menu className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </motion.button>
        ) : null}
      </div>

      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto scrollbar-thin">
        {visible.map(item => {
          const pathnameWithoutSlash = pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
          const itemHrefWithoutSlash = item.href.endsWith('/') ? item.href.slice(0, -1) : item.href;
          const active = pathnameWithoutSlash === itemHrefWithoutSlash || 
                        (item.href !== '/dashboard' && pathname.startsWith(item.href) && pathname.charAt(item.href.length) === '/');
          return (
            <Link key={item.href} href={item.href}
              onClick={() => isMobile && setIsOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                active 
                  ? 'bg-[#0090D1] text-white shadow-sm' 
                  : 'text-gray-700 dark:text-gray-300 hover:bg-[#e6f7fd] dark:hover:bg-[#0090D1]/10 hover:text-[#0090D1]',
                collapsed && !isMobile && 'justify-center px-2'
              )}
              title={collapsed && !isMobile ? item.label : undefined}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {(isMobile || !collapsed) && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="p-2 border-t border-gray-200 dark:border-gray-800">
        <button onClick={() => signOut({ callbackUrl: '/auth/login' })}
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all duration-200 w-full',
            collapsed && !isMobile && 'justify-center px-2'
          )}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {(isMobile || !collapsed) && <span>Déconnexion</span>}
        </button>
      </div>
    </motion.aside>
  );

  return (
    <>
      {isMobile && !isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          className="fixed top-4 left-4 z-40 w-10 h-10 bg-white dark:bg-gray-900 rounded-lg shadow-md flex items-center justify-center text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 md:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>
      )}
      
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {isMobile ? isOpen && sidebarContent : sidebarContent}
    </>
  );
}