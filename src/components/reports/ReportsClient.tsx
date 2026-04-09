"use client";
// src/components/reports/ReportsClient.tsx
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Download, FileText, Table } from "lucide-react";
import { formatXOF } from "@/lib/payroll-engine";

interface Props {
  empStats: { total: number; active: number; avgSalary: number; totalMass: number };
  deptStats: { name: string; count: number; avgSalary: number }[];
  leaveStats: { status: string; count: number; totalDays: number }[];
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: "En attente", APPROVED: "Approuvés", REJECTED: "Refusés", CANCELLED: "Annulés",
};
const STATUS_COLORS: Record<string, string> = {
  PENDING: "#f59e0b", APPROVED: "#22c55e", REJECTED: "#ef4444", CANCELLED: "#9ca3af",
};

const handleExportExcel = async (type: string) => {
  const res = await fetch(`/api/reports/export?type=${type}`);
  if (!res.ok) return;
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `rapport-${type}-${new Date().toISOString().slice(0, 10)}.xlsx`;
  a.click();
};

export function ReportsClient({ empStats, deptStats, leaveStats }: Props) {
  const kpis = [
    { label: "Effectif total", value: empStats.total, sub: `${empStats.active} actifs` },
    { label: "Masse salariale", value: formatXOF(empStats.totalMass), sub: "Mensuelle" },
    { label: "Salaire moyen", value: formatXOF(empStats.avgSalary), sub: "Par employé" },
    { label: "Taux d'occupation", value: `${Math.round((empStats.active / Math.max(empStats.total, 1)) * 100)}%`, sub: "Employés actifs" },
  ];

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k, i) => (
          <div key={i} className="stat-card">
            <p className="text-xs text-gray-500 uppercase tracking-wide">{k.label}</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white mt-1 font-outfit">{k.value}</p>
            <p className="text-xs text-gray-400 mt-1">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Export buttons */}
      <div className="flex flex-wrap gap-2">
        {[
          { label: "Rapport employés", type: "employees", icon: Table },
          { label: "Rapport paie", type: "payroll", icon: FileText },
          { label: "Rapport congés", type: "leaves", icon: FileText },
        ].map((btn, i) => (
          <button key={i} onClick={() => handleExportExcel(btn.type)}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-300">
            <Download className="w-4 h-4" />
            <btn.icon className="w-4 h-4" />
            {btn.label}
          </button>
        ))}
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Effectif par département */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-4">Effectif par département</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={deptStats} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={80} />
              <Tooltip formatter={(v) => [`${v} employés`]} />
              <Bar dataKey="count" name="Effectif" fill="#1a56cc" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Salaire moyen par département */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-4">Salaire moyen par département</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={deptStats} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10 }} axisLine={false} tickLine={false}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={80} />
              <Tooltip formatter={(v: number) => [formatXOF(v)]} />
              <Bar dataKey="avgSalary" name="Salaire moyen" fill="#3b82f6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Congés par statut */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-4">Répartition des congés</h3>
          <div className="flex items-center gap-6">
            <ResponsiveContainer width={150} height={150}>
              <PieChart>
                <Pie data={leaveStats} cx="50%" cy="50%" outerRadius={65} dataKey="count" paddingAngle={2}>
                  {leaveStats.map((entry, i) => (
                    <Cell key={i} fill={STATUS_COLORS[entry.status] || "#9ca3af"} />
                  ))}
                </Pie>
                <Tooltip formatter={(v, name: string) => [v, STATUS_LABELS[name] || name]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2">
              {leaveStats.map((s, i) => (
                <div key={i} className="flex items-center justify-between gap-6">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: STATUS_COLORS[s.status] }} />
                    <span className="text-xs text-gray-600 dark:text-gray-400">{STATUS_LABELS[s.status]}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-gray-900 dark:text-white">{s.count}</span>
                    <span className="text-xs text-gray-400 ml-1">({s.totalDays}j)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Summary table */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-4">Récapitulatif départements</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <th className="text-left py-2 font-semibold text-gray-500 uppercase tracking-wide">Département</th>
                  <th className="text-right py-2 font-semibold text-gray-500 uppercase tracking-wide">Effectif</th>
                  <th className="text-right py-2 font-semibold text-gray-500 uppercase tracking-wide">Sal. moy.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {deptStats.map((d, i) => (
                  <tr key={i}>
                    <td className="py-2 text-gray-700 dark:text-gray-300">{d.name}</td>
                    <td className="py-2 text-right font-medium text-gray-900 dark:text-white">{d.count}</td>
                    <td className="py-2 text-right text-gray-600 dark:text-gray-400">{formatXOF(d.avgSalary)}</td>
                  </tr>
                ))}
                <tr className="border-t-2 border-gray-200 dark:border-gray-700">
                  <td className="py-2 font-bold text-gray-900 dark:text-white">Total</td>
                  <td className="py-2 text-right font-bold text-gray-900 dark:text-white">{empStats.total}</td>
                  <td className="py-2 text-right font-bold text-blue-600">{formatXOF(empStats.avgSalary)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
