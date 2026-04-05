'use client';
import { useState } from 'react';
import { Bell, Search, Sun, Moon, User } from 'lucide-react';
import { useTheme } from 'next-themes';
import Link from 'next/link';

const roleLabels: Record<string, string> = {
  ADMIN_RH: 'Administrateur RH',
  MANAGER: 'Manager',
  EMPLOYE: 'Membre',
};

export default function Header({ user }: { user: any }) {
  const { theme, setTheme } = useTheme();
  const [notifOpen, setNotifOpen] = useState(false);

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-3 flex items-center justify-between gap-4 z-10">
      {/* Search */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500" placeholder="Rechercher un membre, document..." />
      </div>

      <div className="flex items-center gap-2">
        {/* Dark mode toggle */}
        <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button onClick={() => setNotifOpen(!notifOpen)}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors relative">
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          </button>
          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 z-50">
              <div className="p-4 border-b border-gray-100 dark:border-gray-800">
                <h3 className="font-semibold text-sm">Notifications</h3>
              </div>
              <div className="p-2 space-y-1">
                {[
                  { title: 'Demande de congé en attente', time: 'Il y a 5 min', type: 'warning' },
                  { title: 'Nouveau bulletin de paie disponible', time: 'Il y a 1h', type: 'info' },
                  { title: 'Évaluation à compléter', time: 'Il y a 3h', type: 'info' },
                ].map((n, i) => (
                  <div key={i} className="flex gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${n.type === 'warning' ? 'bg-amber-400' : 'bg-blue-400'}`} />
                    <div>
                      <p className="text-sm text-gray-800 dark:text-gray-200">{n.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{n.time}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-3 border-t border-gray-100 dark:border-gray-800 text-center">
                <Link href="/notifications" className="text-xs text-amber-600 hover:underline">Voir toutes les notifications</Link>
              </div>
            </div>
          )}
        </div>

        {/* User menu */}
        <div className="flex items-center gap-2 pl-2 border-l border-gray-200 dark:border-gray-700">
          <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900 rounded-full flex items-center justify-center">
            {user?.image ? <img src={user.image} className="w-8 h-8 rounded-full" alt="" /> : <User className="w-4 h-4 text-amber-700" />}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-gray-800 dark:text-gray-200 leading-tight">{user?.name || 'Utilisateur'}</p>
            <p className="text-xs text-gray-500">{roleLabels[(user as any)?.role] || ''}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
