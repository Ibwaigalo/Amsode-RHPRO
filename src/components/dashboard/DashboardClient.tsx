'use client';
import { Users, Calendar, Briefcase, Star, TrendingUp, TrendingDown, AlertCircle, CheckCircle2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const salaryData = [
  { month: 'Jan', brut: 12500000, net: 10200000 },
  { month: 'Fév', brut: 12800000, net: 10450000 },
  { month: 'Mar', brut: 13100000, net: 10700000 },
  { month: 'Avr', brut: 12900000, net: 10550000 },
  { month: 'Mai', brut: 13400000, net: 10950000 },
  { month: 'Jun', brut: 13200000, net: 10800000 },
];

const deptData = [
  { name: 'Direction', value: 3 },
  { name: 'Finance', value: 8 },
  { name: 'Tech', value: 12 },
  { name: 'RH', value: 5 },
  { name: 'Terrain', value: 15 },
  { name: 'Comms', value: 6 },
];

const COLORS = ['#0090D1', '#86C440', '#007ab8', '#6ba32e', '#005577', '#4d8c24'];

interface Stats { activeEmployees: number; pendingLeaves: number; openJobs: number; pendingEvals: number; }

export default function DashboardClient({ stats, user }: { stats: Stats; user: any }) {
  const kpis = [
    { label: 'Membres Actifs', value: stats.activeEmployees || 0, icon: Users, trend: '+2', trendUp: true, color: 'brand' },
    { label: 'Congés en Attente', value: stats.pendingLeaves || 0, icon: Calendar, trend: '-1', trendUp: false, color: 'green' },
    { label: 'Postes Ouverts', value: stats.openJobs || 0, icon: Briefcase, trend: '+1', trendUp: true, color: 'brand' },
    { label: 'Évaluations En Cours', value: stats.pendingEvals || 0, icon: Star, trend: '0', trendUp: null, color: 'green' },
  ];

  const colorMap: Record<string, string> = {
    brand: 'bg-[#0090D1]/10 text-[#0090D1] dark:bg-[#0090D1]/20 dark:text-[#0090D1]',
    green: 'bg-[#86C440]/10 text-[#86C440] dark:bg-[#86C440]/20 dark:text-[#86C440]',
  };

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl overflow-hidden shadow-sm bg-white">
          <img src="/logo.png" alt="AMSODE" className="w-full h-full object-contain" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Bonjour, {user?.name?.split(' ')[0] || 'Administrateur'} 👋
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map(kpi => (
          <div key={kpi.label} className="card group hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorMap[kpi.color]}`}>
                <kpi.icon className="w-5 h-5" />
              </div>
              {kpi.trendUp !== null && (
                <span className={`flex items-center gap-1 text-xs font-medium ${kpi.trendUp ? 'text-[#86C440]' : 'text-red-500'}`}>
                  {kpi.trendUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {kpi.trend}
                </span>
              )}
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{kpi.value}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Payroll trend */}
        <div className="card xl:col-span-2">
          <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-4">Évolution de la Masse Salariale (FCFA)</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={salaryData} barSize={24}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={v => `${(v/1000000).toFixed(1)}M`} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => [`${(v/1000000).toFixed(2)}M FCFA`]} />
              <Bar dataKey="brut" fill="#0090D1" name="Brut" radius={[4,4,0,0]} />
              <Bar dataKey="net" fill="#86C440" name="Net" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Dept distribution */}
        <div className="card">
          <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-4">Répartition par Projet</h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={deptData} cx="50%" cy="50%" outerRadius={75} dataKey="value" label={({name, value}) => `${name} (${value})`} labelLine={false} fontSize={10}>
                {deptData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent activity & Alerts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Pending actions */}
        <div className="card">
          <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-4">Actions Requises</h2>
          <div className="space-y-3">
            {[
              { msg: 'Demandes de congé en attente de validation', type: 'warning', href: '/leaves' },
              { msg: 'Candidatures à shortlister pour le poste Analyste', type: 'info', href: '/recruitment' },
              { msg: 'Paie non encore traitée', type: 'warning', href: '/payroll' },
              { msg: 'Évaluations à finaliser', type: 'info', href: '/evaluations' },
            ].map((a, i) => (
              <a key={i} href={a.href} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group">
                {a.type === 'warning'
                  ? <AlertCircle className="w-4 h-4 text-[#86C440] flex-shrink-0 mt-0.5" />
                  : <CheckCircle2 className="w-4 h-4 text-[#0090D1] flex-shrink-0 mt-0.5" />}
                <p className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-[#0090D1] transition-colors">{a.msg}</p>
              </a>
            ))}
          </div>
        </div>

        {/* Recent hires */}
        <div className="card">
          <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-4">Dernières Activités</h2>
          <div className="space-y-3">
            {[
              { name: 'Fatoumata Coulibaly', role: 'Chargée de Projet', dept: 'Direction', date: '01/06/2026' },
              { name: 'Ibrahim Diallo', role: 'Développeur Backend', dept: 'Technologie', date: '15/05/2026' },
              { name: 'Aminata Traoré', role: 'Comptable Senior', dept: 'Finance', date: '01/05/2026' },
              { name: 'Moussa Keita', role: 'Agent Terrain', dept: 'Terrain', date: '10/04/2026' },
            ].map((e, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#0090D1] flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">{e.name.split(' ').map(n=>n[0]).join('')}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{e.name}</p>
                  <p className="text-xs text-gray-500 truncate">{e.role} · {e.dept}</p>
                </div>
                <span className="text-xs text-gray-400 flex-shrink-0">{e.date}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
