'use client';
import { useState } from 'react';
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