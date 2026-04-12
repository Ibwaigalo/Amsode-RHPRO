"use client";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";

interface ChartsData {
  salaryByDept: { dept: string; masse: number }[];
  deptEmployees: { dept: string; count: number }[];
  totalMass: number;
  contractTypes: { name: string; value: number }[];
  monthlyHeadcount: { month: string; effectif: number; recrutements: number; departs: number }[];
  monthlyLeaves: { month: string; paie: number; maladie: number; autres: number }[];
}

const COLORS: Record<string, string> = {
  CDI: "#1a56cc",
  CDD: "#3b82f6",
  STAGE: "#93c5fd",
  CONSULTANT: "#bfdbfe",
  default: "#94a3b8",
};

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

export default function DashboardCharts({ chartsData }: { chartsData?: ChartsData }) {
  const salaryByDept = chartsData?.salaryByDept?.length ? chartsData.salaryByDept : [
    { dept: "Projet A", masse: 0 },
    { dept: "Projet B", masse: 0 },
    { dept: "Projet C", masse: 0 },
  ];

  const contractTypes = chartsData?.contractTypes?.length ? chartsData.contractTypes : [
    { name: "CDI", value: 0 },
    { name: "CDD", value: 0 },
    { name: "STAGE", value: 0 },
    { name: "CONSULTANT", value: 0 },
  ];

  const monthlyHeadcount = chartsData?.monthlyHeadcount?.length ? chartsData.monthlyHeadcount : [
    { month: "Jan", effectif: 0, recrutements: 0, departs: 0 },
  ];

  const monthlyLeaves = chartsData?.monthlyLeaves?.length ? chartsData.monthlyLeaves : [
    { month: "Jan", paie: 0, maladie: 0, autres: 0 },
  ];

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-3 sm:p-5">
        <div className="flex items-center justify-between mb-2 sm:mb-4">
          <h3 className="font-semibold text-gray-900 dark:text-white text-xs sm:text-sm">Évolution effectif</h3>
          <span className="text-xs text-gray-400 hidden sm:inline">6 derniers mois</span>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={monthlyHeadcount}>
            <defs>
              <linearGradient id="effectifGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1a56cc" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#1a56cc" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="effectif" name="Effectif" stroke="#1a56cc" strokeWidth={2} fill="url(#effectifGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-3 sm:p-5">
        <div className="flex items-center justify-between mb-2 sm:mb-4">
          <h3 className="font-semibold text-gray-900 dark:text-white text-xs sm:text-sm">Masse salariale par projet</h3>
          <span className="text-xs text-gray-400 hidden sm:inline">FCFA</span>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={salaryByDept} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 9 }} axisLine={false} tickLine={false}
              tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
            <YAxis type="category" dataKey="dept" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={50} />
            <Tooltip content={<CustomTooltip />}
              formatter={(v: number) => new Intl.NumberFormat("fr-ML").format(v) + " FCFA"} />
            <Bar dataKey="masse" name="Masse" fill="#1a56cc" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-3 sm:p-5">
        <div className="flex items-center justify-between mb-2 sm:mb-4">
          <h3 className="font-semibold text-gray-900 dark:text-white text-xs sm:text-sm">Répartition contrats</h3>
        </div>
        <div className="flex items-center gap-3 sm:gap-6">
          <ResponsiveContainer width={100} height={100} className="flex-shrink-0">
            <PieChart>
              <Pie data={contractTypes} cx="50%" cy="50%" innerRadius={25} outerRadius={45}
                dataKey="value" paddingAngle={2}>
                {contractTypes.map((entry, i) => (
                  <Cell key={i} fill={COLORS[entry.name] || COLORS.default} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 flex-1 min-w-0">
            {contractTypes.map((ct, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: COLORS[ct.name] || COLORS.default }} />
                  <span className="text-xs text-gray-600 dark:text-gray-400 truncate">{ct.name}</span>
                </div>
                <span className="text-xs font-semibold text-gray-900 dark:text-white flex-shrink-0 ml-2">{ct.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-3 sm:p-5">
        <div className="flex items-center justify-between mb-2 sm:mb-4">
          <h3 className="font-semibold text-gray-900 dark:text-white text-xs sm:text-sm">Jours de congés pris</h3>
          <span className="text-xs text-gray-400 hidden sm:inline">Jours / mois</span>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={monthlyLeaves}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            <Bar dataKey="paie" name="Payés" stackId="a" fill="#1a56cc" />
            <Bar dataKey="maladie" name="Maladie" stackId="a" fill="#93c5fd" />
            <Bar dataKey="autres" name="Autres" stackId="a" fill="#dbeafe" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}