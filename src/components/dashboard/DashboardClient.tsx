'use client';
import { Users, Calendar, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';

const DashboardCharts = dynamic(
  () => import('./DashboardCharts'),
  {
    loading: () => (
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5 h-64 animate-pulse" />
    ),
    ssr: false,
  }
);

interface Stats { activeEmployees: number; pendingLeaves: number; openJobs?: number; pendingEvals?: number; teamCount?: number; teamLeaves?: number; myLeaves?: number; }

interface ChartsData {
  salaryByDept: { dept: string; masse: number }[];
  deptEmployees: { dept: string; count: number }[];
  totalMass: number;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};

export default function DashboardClient({ stats, user, role, chartsData }: { stats: Stats; user: any; role?: string; chartsData?: ChartsData }) {
  const isAdmin = role === 'ADMIN_RH' || role === 'PRESIDENT';
  const isManager = role === 'MANAGER';

  const kpis = [
    { label: isManager ? 'Mon Équipe' : isAdmin ? 'Membres Actifs' : 'Mon Profil', value: stats.activeEmployees || 0, icon: Users, color: 'brand' },
    { label: isAdmin ? 'Congés en Attente' : isManager ? 'Équipe - En Attente' : 'Mes Congés', value: stats.pendingLeaves || 0, icon: Calendar, color: 'green' },
  ];

  const colorMap: Record<string, string> = {
    brand: 'bg-[#0090D1]/10 text-[#0090D1] dark:bg-[#0090D1]/20 dark:text-[#0090D1]',
    green: 'bg-[#86C440]/10 text-[#86C440] dark:bg-[#86C440]/20 dark:text-[#86C440]',
  };

  return (
    <motion.div 
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Welcome */}
      <motion.div 
        className="flex items-center gap-4"
        variants={itemVariants}
      >
        <div className="w-12 h-12 rounded-xl overflow-hidden shadow-sm bg-white">
          <img src="/logo.png" alt="AMSODE" className="w-full h-full object-contain" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Bonjour, {user?.name?.split(' ')[0] || 'Utilisateur'} 👋
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <motion.div 
        className="grid grid-cols-1 sm:grid-cols-2 gap-4"
        variants={itemVariants}
      >
        {kpis.map(kpi => (
          <motion.div 
            key={kpi.label} 
            className="card group hover:shadow-md transition-shadow"
            whileHover={{ scale: 1.02, y: -2 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorMap[kpi.color]}`}>
                <kpi.icon className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{kpi.value}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{kpi.label}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Charts - only for Admin/President */}
      {(role === 'ADMIN_RH' || role === 'PRESIDENT') && chartsData && chartsData.salaryByDept && (
        <motion.div variants={itemVariants}>
          <DashboardCharts chartsData={chartsData} />
        </motion.div>
      )}

      {/* For Manager - show team info */}
      {isManager && stats.teamCount !== undefined && (
        <motion.div 
          className="card"
          variants={itemVariants}
        >
          <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-4">Mon Équipe</h2>
          <p className="text-gray-600 dark:text-gray-300">
            Vous avez <strong>{stats.teamCount}</strong> membre(s) dans votre équipe.
          </p>
        </motion.div>
      )}

      {/* Actions section */}
      <motion.div 
        className="grid grid-cols-1 xl:grid-cols-2 gap-6"
        variants={itemVariants}
      >
        {isAdmin && (
          <motion.div 
            className="card"
            whileHover={{ scale: 1.01 }}
            transition={{ duration: 0.2 }}
          >
            <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-4">Actions Requises</h2>
            <div className="space-y-3">
              <a href="/leaves" className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group">
                <AlertCircle className="w-4 h-4 text-[#86C440] flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-[#0090D1] transition-colors">Demandes de congé en attente</p>
              </a>
            </div>
          </motion.div>
        )}

        {!isAdmin && (
          <motion.div 
            className="card"
            whileHover={{ scale: 1.01 }}
            transition={{ duration: 0.2 }}
          >
            <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-4">Mes Actions</h2>
            <div className="space-y-3">
              <a href="/leaves" className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group">
                <Calendar className="w-4 h-4 text-[#0090D1] flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-[#0090D1] transition-colors">Voir mes demandes de congés</p>
              </a>
            </div>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}
