"use client";
// src/components/payroll/PayrollClient.tsx
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Plus, Download, FileText, TrendingUp, Users, DollarSign, CheckCircle, Clock, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { simulatePayroll, formatXOF } from "@/lib/payroll-engine";
import dynamic from "next/dynamic";

const PayslipsViewer = dynamic(() => import("./PayslipsViewer"), {
  loading: () => <div className="fixed inset-0 bg-black/50 flex items-center justify-center"><div className="bg-white p-6 rounded-lg"><Loader2 className="w-6 h-6 animate-spin" /></div></div>,
  ssr: false,
});

const MONTHS_FR = ["", "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

interface Period {
  id: string;
  month: number;
  year: number;
  status: string;
  totalGross: string | null;
  totalNet: string | null;
  processedAt: Date | null;
}

interface Props {
  periods: Period[];
  employeeCount: number;
}

export default function PayrollClient({ periods, employeeCount }: Props) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [viewingPeriod, setViewingPeriod] = useState<{ id: string; label: string } | null>(null);
  const [simSalary, setSimSalary] = useState("300000");
  const simResult = simulatePayroll(parseFloat(simSalary) || 0);

  const now = new Date();
  const [newMonth, setNewMonth] = useState(now.getMonth() + 1);
  const [newYear, setNewYear] = useState(now.getFullYear());

  const createPeriod = async () => {
    setCreating(true);
    try {
      const res = await fetch("/api/payroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month: newMonth, year: newYear }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      const data = await res.json();
      toast.success(`Paie ${MONTHS_FR[newMonth]} ${newYear} créée — ${data.count} bulletins générés`);
      router.refresh();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setCreating(false);
    }
  };

  const latestPeriod = periods[0];
  const totalMasse = periods.slice(0, 3).reduce((s, p) => s + parseFloat(p.totalGross || "0"), 0);

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card flex items-center gap-4">
          <div className="p-3 rounded-xl bg-[#0090D1]/10 dark:bg-[#0090D1]/20">
            <Users className="w-6 h-6 text-[#0090D1]" />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Membres actifs</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white font-outfit">{employeeCount}</p>
          </div>
        </div>
        <div className="stat-card flex items-center gap-4">
          <div className="p-3 rounded-xl bg-green-50 dark:bg-green-900/20">
            <DollarSign className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Masse (3 mois)</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white font-outfit">
              {new Intl.NumberFormat("fr-ML", { notation: "compact", currency: "XOF", style: "currency", maximumFractionDigits: 1 }).format(totalMasse)}
            </p>
          </div>
        </div>
        <div className="stat-card flex items-center gap-4">
          <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-900/20">
            <TrendingUp className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Dernière paie</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white font-outfit">
              {latestPeriod ? `${MONTHS_FR[latestPeriod.month]} ${latestPeriod.year}` : "—"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Periods list */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
            <h2 className="font-semibold text-gray-900 dark:text-white">Périodes de paie</h2>
            <div className="flex items-center gap-2">
              <select value={newMonth} onChange={(e) => setNewMonth(+e.target.value)}
                className="text-xs px-2 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
                {MONTHS_FR.slice(1).map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
              </select>
              <select value={newYear} onChange={(e) => setNewYear(+e.target.value)}
                className="text-xs px-2 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
                {[2024, 2025, 2026].map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
              <button onClick={createPeriod} disabled={creating}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0090D1] hover:bg-[#007ab8] text-white text-xs font-medium rounded-lg transition-all disabled:opacity-60">
                {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                Générer
              </button>
            </div>
          </div>

          <div className="divide-y divide-gray-50 dark:divide-gray-800">
            {periods.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Aucune période créée. Générez la première paie !</p>
              </div>
            ) : periods.map((p) => (
              <div key={p.id} className="flex items-center justify-between px-5 py-4 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={cn("p-2 rounded-lg",
                    p.status === "VALIDATED" ? "bg-green-50 dark:bg-green-900/20" : "bg-amber-50 dark:bg-amber-900/20")}>
                    {p.status === "VALIDATED"
                      ? <CheckCircle className="w-4 h-4 text-green-600" />
                      : <Clock className="w-4 h-4 text-amber-500" />}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white text-sm">
                      {MONTHS_FR[p.month]} {p.year}
                    </p>
                    <p className="text-xs text-gray-500">
                      Brut: {p.totalGross ? formatXOF(parseFloat(p.totalGross)) : "—"} |
                      Net: {p.totalNet ? formatXOF(parseFloat(p.totalNet)) : "—"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium",
                    p.status === "VALIDATED" ? "badge-approved" :
                    p.status === "SENT" ? "badge-active" : "badge-pending")}>
                    {p.status === "DRAFT" ? "Brouillon" : p.status === "VALIDATED" ? "Validé" : "Envoyé"}
                  </span>
                  <button onClick={() => setViewingPeriod({ id: p.id, label: `${MONTHS_FR[p.month]} ${p.year}` })}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors" title="Voir bulletins">
                    <FileText className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Salary simulator */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5 h-fit">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Simulateur de Paie</h2>
          <p className="text-xs text-gray-500 mb-4">Calcul selon barèmes Mali (CNSS 3.3% + IRG)</p>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Salaire brut (FCFA)</label>
              <input
                type="number"
                value={simSalary}
                onChange={(e) => setSimSalary(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="300000"
              />
            </div>

            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Salaire brut</span>
                <span className="font-medium">{formatXOF(parseFloat(simSalary) || 0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">CNSS salarié (3.3%)</span>
                <span className="text-red-500">— {formatXOF(Math.round((parseFloat(simSalary) || 0) * 0.033))}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">IRG (impôt)</span>
                <span className="text-red-500">— {formatXOF((parseFloat(simSalary) || 0) - simResult.net - Math.round((parseFloat(simSalary) || 0) * 0.033))}</span>
              </div>
              <div className="border-t border-gray-200 dark:border-gray-700 pt-2 flex justify-between">
                <span className="font-semibold text-gray-900 dark:text-white text-sm">Net à payer</span>
                <span className="font-bold text-green-600 text-sm">{formatXOF(simResult.net)}</span>
              </div>
              <p className="text-xs text-gray-400 text-right">
                Taux de prélèvement: {simResult.deductionRate.toFixed(1)}%
              </p>
            </div>

            {/* CNSS employeur info */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
              <p className="text-xs text-blue-700 dark:text-blue-300 font-medium mb-1">Charges patronales (CNSS)</p>
              <div className="flex justify-between text-xs text-blue-600 dark:text-blue-400">
                <span>Taux employeur (8.25%)</span>
                <span>{formatXOF(Math.round((parseFloat(simSalary) || 0) * 0.0825))}</span>
              </div>
              <p className="text-xs text-blue-500 mt-1">
                Coût total employeur: {formatXOF((parseFloat(simSalary) || 0) + Math.round((parseFloat(simSalary) || 0) * 0.0825))}
              </p>
            </div>
          </div>
        </div>
      </div>

      {viewingPeriod && (
        <PayslipsViewer
          periodId={viewingPeriod.id}
          periodLabel={viewingPeriod.label}
          onClose={() => setViewingPeriod(null)}
        />
      )}
    </div>
  );
}
