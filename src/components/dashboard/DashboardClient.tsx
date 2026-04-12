'use client';
import { Users, Calendar, AlertCircle, AlertTriangle, DollarSign, TrendingUp, User } from 'lucide-react';
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

interface Stats { 
  activeEmployees: number; 
  pendingLeaves: number; 
  openJobs?: number; 
  pendingEvals?: number; 
  teamCount?: number; 
  teamLeaves?: number; 
  myLeaves?: number; 
  femaleCount?: number;
  maleCount?: number;
  totalGlobalCost?: number;
  contractAlerts?: { id: string; name: string; endDate: string; contractType: string }[];
}

interface ChartsData {
  salaryByDept: { dept: string; masse: number }[];
  deptEmployees: { dept: string; count: number }[];
  totalMass: number;
  totalGlobalCost: number;
  contractTypes: { name: string; value: number }[];
  monthlyHeadcount: { month: string; effectif: number; recrutements: number; departs: number }[];
  monthlyLeaves: { month: string; paie: number; maladie: number; autres: number }[];
  femaleCount: number;
  maleCount: number;
  contractAlerts: { id: string; name: string; endDate: string; contractType: string }[];
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-ML', { 
      style: 'currency', 
      currency: 'XOF', 
      maximumFractionDigits: 0 
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const days = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const kpis = [
    { label: isManager ? 'Mon Équipe' : isAdmin ? 'Membres Actifs' : 'Mon Profil', value: stats.activeEmployees || 0, icon: Users, color: 'brand' },
    { label: isAdmin ? 'Congés en Attente' : isManager ? 'Équipe - En Attente' : 'Mes Congés', value: stats.pendingLeaves || 0, icon: Calendar, color: 'green' },
  ];

  const colorMap: Record<string, string> = {
    brand: 'bg-[#0090D1]/10 text-[#0090D1] dark:bg-[#0090D1]/20 dark:text-[#0090D1]',
    green: 'bg-[#86C440]/10 text-[#86C440] dark:bg-[#86C440]/20 dark:text-[#86C440]',
    orange: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
    red: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
    purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
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
            Bonjour, {user?.name || 'Utilisateur'} 👋
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <motion.div 
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
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

        {isAdmin && chartsData && (
          <>
            <motion.div 
              className="card group hover:shadow-md transition-shadow"
              whileHover={{ scale: 1.02, y: -2 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorMap['purple']}`}>
                  <User className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{chartsData.femaleCount}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Femmes</p>
            </motion.div>

            <motion.div 
              className="card group hover:shadow-md transition-shadow"
              whileHover={{ scale: 1.02, y: -2 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorMap['brand']}`}>
                  <User className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{chartsData.maleCount}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Hommes</p>
            </motion.div>
          </>
        )}
      </motion.div>

      {/* Contract Alerts & Global Payroll */}
      {isAdmin && chartsData && chartsData.contractAlerts && chartsData.contractAlerts.length > 0 && (
        <motion.div variants={itemVariants}>
          <div className="card border-red-200 dark:border-red-800/50">
            <h2 className="text-base font-semibold text-red-700 dark:text-red-300 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Alertes Fin de Contrat ({chartsData.contractAlerts.length})
            </h2>
            <div className="space-y-2">
              {chartsData.contractAlerts.map(alert => {
                const daysLeft = getDaysRemaining(alert.endDate);
                return (
                  <div key={alert.id} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{alert.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{alert.contractType} - expire le {formatDate(alert.endDate)}</p>
                    </div>
                    <span className={`text-sm font-medium ${daysLeft <= 30 ? 'text-red-600' : 'text-orange-600'}`}>
                      {daysLeft} jour{daysLeft > 1 ? 's' : ''}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}

      {/* Global Payroll */}
      {isAdmin && chartsData && (
        <motion.div variants={itemVariants}>
          <div className="card bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Masse Salariale Globale</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{formatCurrency(chartsData.totalGlobalCost)}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>
        </motion.div>
      )}

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
