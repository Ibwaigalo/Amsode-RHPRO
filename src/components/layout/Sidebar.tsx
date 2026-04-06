'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '../../lib/utils/cn';
import {
  LayoutDashboard, Users, DollarSign, Calendar, Briefcase,
  Star, BookOpen, FileText, Settings, LogOut, ChevronLeft, Menu
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const navItems = [
  { href: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard, roles: ['ADMIN_RH', 'MANAGER', 'EMPLOYE'] },
  { href: '/employees', label: 'Membres', icon: Users, roles: ['ADMIN_RH', 'MANAGER'] },
  { href: '/payroll', label: 'Paie', icon: DollarSign, roles: ['ADMIN_RH'] },
  { href: '/leaves', label: 'Congés', icon: Calendar, roles: ['ADMIN_RH', 'MANAGER', 'EMPLOYE'] },
  { href: '/recruitment', label: 'Recrutement', icon: Briefcase, roles: ['ADMIN_RH', 'MANAGER'] },
  { href: '/evaluations', label: 'Évaluations', icon: Star, roles: ['ADMIN_RH', 'MANAGER', 'EMPLOYE'] },
  { href: '/training', label: 'Formations', icon: BookOpen, roles: ['ADMIN_RH', 'MANAGER', 'EMPLOYE'] },
  { href: '/documents', label: 'Documents', icon: FileText, roles: ['ADMIN_RH', 'MANAGER', 'EMPLOYE'] },
  { href: '/settings', label: 'Paramètres', icon: Settings, roles: ['ADMIN_RH'] },
];

interface SidebarProps { userRole: string; }

export default function Sidebar({ userRole }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const visible = navItems.filter(item => item.roles.includes(userRole));

  return (
    <motion.aside 
      className={cn(
        'flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800',
        collapsed ? 'w-16' : 'w-64'
      )}
      animate={{ width: collapsed ? 64 : 256 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
    >
      {/* Brand */}
      <div className="flex items-center justify-between px-3 py-4 border-b border-gray-200 dark:border-gray-800">
        <AnimatePresence mode="wait">
          {!collapsed ? (
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
        <motion.button 
          onClick={() => setCollapsed(!collapsed)}
          className="text-gray-400 hover:text-[#0090D1] p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          {collapsed ? <Menu className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </motion.button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto scrollbar-thin">
        {visible.map(item => {
          const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                active 
                  ? 'bg-[#0090D1] text-white shadow-sm' 
                  : 'text-gray-700 dark:text-gray-300 hover:bg-[#e6f7fd] dark:hover:bg-[#0090D1]/10 hover:text-[#0090D1]',
                collapsed && 'justify-center px-2'
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-2 border-t border-gray-200 dark:border-gray-800">
        <button onClick={() => signOut({ callbackUrl: '/auth/login' })}
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all duration-200 w-full',
            collapsed && 'justify-center px-2'
          )}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>Déconnexion</span>}
        </button>
      </div>
    </motion.aside>
  );
}
