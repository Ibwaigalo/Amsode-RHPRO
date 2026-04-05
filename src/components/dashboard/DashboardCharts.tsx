"use client";
// src/components/dashboard/DashboardCharts.tsx
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";

const monthlyHeadcount = [
  { month: "Jan", effectif: 42, recrutements: 2, departs: 1 },
  { month: "Fév", effectif: 43, recrutements: 1, departs: 0 },
  { month: "Mar", effectif: 45, recrutements: 3, departs: 1 },
  { month: "Avr", effectif: 46, recrutements: 2, departs: 1 },
  { month: "Mai", effectif: 47, recrutements: 2, departs: 1 },
  { month: "Jun", effectif: 48, recrutements: 2, departs: 1 },
  { month: "Jul", effectif: 50, recrutements: 3, departs: 1 },
];

const salaryByDept = [
  { dept: "Direction", masse: 4500000 },
  { dept: "RH", masse: 2800000 },
  { dept: "Finance", masse: 3200000 },
  { dept: "Terrain", masse: 8500000 },
  { dept: "Comm.", masse: 1900000 },
  { dept: "Log.", masse: 2100000 },
];

const contractTypes = [
  { name: "CDI", value: 62, color: "#1a56cc" },
  { name: "CDD", value: 28, color: "#3b82f6" },
  { name: "Stage", value: 7, color: "#93c5fd" },
  { name: "Consultant", value: 3, color: "#bfdbfe" },
];

const leaveStats = [
  { month: "Jan", payés: 12, maladie: 4, autres: 2 },
  { month: "Fév", payés: 8, maladie: 6, autres: 1 },
  { month: "Mar", payés: 15, maladie: 3, autres: 3 },
  { month: "Avr", payés: 22, maladie: 5, autres: 2 },
  { month: "Mai", payés: 18, maladie: 4, autres: 4 },
  { month: "Jun", payés: 30, maladie: 7, autres: 2 },
  { month: "Jul", payés: 25, maladie: 3, autres: 5 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-lg text-xs">
        <p className="font-semibold text-gray-900 dark:text-white mb-1">{label}</p>
        {payload.map((entry: any, i: number) => (
          <p key={i} style={{ color: entry.color }}>{entry.name}: <strong>{entry.value}</strong></p>
        ))}
      </div>
    );
  }
  return null;
};

export function DashboardCharts() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Évolution effectif */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Évolution de l'effectif</h3>
          <span className="text-xs text-gray-400">7 derniers mois</span>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={monthlyHeadcount}>
            <defs>
              <linearGradient id="effectifGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1a56cc" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#1a56cc" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="effectif" name="Effectif" stroke="#1a56cc" strokeWidth={2} fill="url(#effectifGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Masse salariale par département */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Masse salariale par département</h3>
          <span className="text-xs text-gray-400">FCFA</span>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={salaryByDept} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 10 }} axisLine={false} tickLine={false}
              tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
            <YAxis type="category" dataKey="dept" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={55} />
            <Tooltip content={<CustomTooltip />}
              formatter={(v: number) => new Intl.NumberFormat("fr-ML").format(v) + " FCFA"} />
            <Bar dataKey="masse" name="Masse" fill="#1a56cc" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Types de contrats */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Répartition des contrats</h3>
        </div>
        <div className="flex items-center gap-6">
          <ResponsiveContainer width={140} height={140}>
            <PieChart>
              <Pie data={contractTypes} cx="50%" cy="50%" innerRadius={40} outerRadius={65}
                dataKey="value" paddingAngle={2}>
                {contractTypes.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 flex-1">
            {contractTypes.map((ct, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: ct.color }} />
                  <span className="text-xs text-gray-600 dark:text-gray-400">{ct.name}</span>
                </div>
                <span className="text-xs font-semibold text-gray-900 dark:text-white">{ct.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Congés par mois */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Jours de congés pris</h3>
          <span className="text-xs text-gray-400">Jours / mois</span>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={leaveStats}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="payés" name="Payés" stackId="a" fill="#1a56cc" />
            <Bar dataKey="maladie" name="Maladie" stackId="a" fill="#93c5fd" />
            <Bar dataKey="autres" name="Autres" stackId="a" fill="#dbeafe" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
