'use client';
import { useState, useEffect } from 'react';
import { Bell, Search, Sun, Moon, User, Menu, Settings, LogOut, KeyRound } from 'lucide-react';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { useSidebar } from './DashboardClientLayout';
import { signOut } from 'next-auth/react';
import { toast } from 'sonner';

const roleLabels: Record<string, string> = {
  ADMIN_RH: 'Administrateur RH',
  MANAGER: 'Manager',
  EMPLOYE: 'Membre',
  PRESIDENT: 'Président',
};

function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success('Mot de passe modifié !');
      onClose();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md p-6">
        <h2 className="text-lg font-bold mb-4">Changer le mot de passe</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Mot de passe actuel</label>
            <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Nouveau mot de passe</label>
            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg" required minLength={6} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Confirmer</label>
            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg" required />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-2 border rounded-lg">Annuler</button>
            <button type="submit" disabled={loading} className="flex-1 py-2 bg-[#0090D1] text-white rounded-lg disabled:opacity-50">
              {loading ? '...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Header({ user }: { user: any }) {
  const { theme, setTheme } = useTheme();
  const [notifOpen, setNotifOpen] = useState(false);
  const { setIsOpen } = useSidebar();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loadingNotif, setLoadingNotif] = useState(false);

  useEffect(() => {
    if (notifOpen && !notifications.length) {
      setLoadingNotif(true);
      fetch('/api/notifications')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setNotifications(data);
          }
        })
        .catch(console.error)
        .finally(() => setLoadingNotif(false));
    }
  }, [notifOpen, notifications.length]);

  const formatTime = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    if (minutes < 60) return `Il y a ${minutes} min`;
    if (hours < 24) return `Il y a ${hours}h`;
    return `Il y a ${days}j`;
  };

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-3 md:px-6 py-3 flex items-center justify-between gap-2 md:gap-4 z-10">
      <div className="flex items-center gap-2">
        <button 
          onClick={() => setIsOpen(true)}
          className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <Menu className="w-5 h-5" />
        </button>
        
        <div className="relative flex-1 max-w-xs md:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500" placeholder="Rechercher..." />
        </div>
      </div>

      <div className="flex items-center gap-1 md:gap-2">
        <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        <div className="relative">
          <button onClick={() => setNotifOpen(!notifOpen)}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors relative">
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          </button>
          {notifOpen && (
            <div className="absolute right-0 mt-2 w-72 md:w-80 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 z-50">
              <div className="p-4 border-b border-gray-100 dark:border-gray-800">
                <h3 className="font-semibold text-sm">Notifications</h3>
              </div>
              <div className="p-2 space-y-1 max-h-64 overflow-y-auto">
                {loadingNotif ? (
                  <div className="p-4 text-center text-sm text-gray-500">Chargement...</div>
                ) : notifications.length === 0 ? (
                  <div className="p-4 text-center text-sm text-gray-500">Aucune notification</div>
                ) : notifications.map((n: any) => (
                  <div key={n.id} className="flex gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${n.isRead ? 'bg-gray-300' : n.type === 'ERROR' ? 'bg-red-400' : n.type === 'SUCCESS' ? 'bg-green-400' : 'bg-amber-400'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 dark:text-gray-200">{n.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">{n.message}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{formatTime(n.createdAt)}</p>
                    </div>
                    {n.link && (
                      <Link href={n.link} onClick={() => setNotifOpen(false)} className="text-xs text-blue-500 hover:underline self-center">
                        Voir
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 pl-2 border-l border-gray-200 dark:border-gray-700 relative">
          <button onClick={() => setMenuOpen(!menuOpen)} className="flex items-center gap-2">
            <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900 rounded-full flex items-center justify-center">
              {user?.image ? <img src={user.image} className="w-8 h-8 rounded-full" alt="" /> : <User className="w-4 h-4 text-amber-700" />}
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200 leading-tight">{user?.name || 'Utilisateur'}</p>
              <p className="text-xs text-gray-500">{roleLabels[(user as any)?.role] || ''}</p>
            </div>
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 py-1 z-50">
              <button onClick={() => { setMenuOpen(false); setShowPasswordModal(true); }}
                className="w-full px-4 py-2 text-left text-sm flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-800">
                <KeyRound className="w-4 h-4" /> Changer mot de passe
              </button>
              <Link href="/settings" onClick={() => setMenuOpen(false)}
                className="w-full px-4 py-2 text-left text-sm flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-800">
                <Settings className="w-4 h-4" /> Paramètres
              </Link>
              <button onClick={() => signOut({ callbackUrl: '/auth/login' })}
                className="w-full px-4 py-2 text-left text-sm flex items-center gap-2 text-red-600 hover:bg-gray-100 dark:hover:bg-gray-800">
                <LogOut className="w-4 h-4" /> Déconnexion
              </button>
            </div>
          )}
        </div>
      </div>

      {showPasswordModal && <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />}
    </header>
  );
}