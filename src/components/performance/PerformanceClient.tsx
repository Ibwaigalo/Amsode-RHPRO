"use client";
// src/components/performance/PerformanceClient.tsx
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Plus, Star, TrendingUp, Award, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const CRITERIA = [
  { key: "quality", label: "Qualité du travail" },
  { key: "productivity", label: "Productivité" },
  { key: "teamwork", label: "Travail en équipe" },
  { key: "initiative", label: "Initiative & Innovation" },
  { key: "communication", label: "Communication" },
];

const schema = z.object({
  employeeId: z.string().uuid("Sélectionnez un employé"),
  period: z.string().min(3),
  type: z.string().default("ANNUAL"),
  quality: z.number().min(1).max(5),
  productivity: z.number().min(1).max(5),
  teamwork: z.number().min(1).max(5),
  initiative: z.number().min(1).max(5),
  communication: z.number().min(1).max(5),
  strengths: z.string().min(10),
  improvements: z.string().min(10),
});
type EvalForm = z.infer<typeof schema>;

interface Evaluation {
  id: string;
  period: string;
  type: string | null;
  overallScore: string | null;
  status: string;
  createdAt: Date;
  employeeFirstName: string | null;
  employeeLastName: string | null;
}

interface Props {
  evaluations: Evaluation[];
  employees: { id: string; firstName: string; lastName: string }[];
}

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" onClick={() => onChange(n)}>
          <Star className={cn("w-5 h-5 transition-colors", n <= value ? "fill-amber-400 text-amber-400" : "text-gray-300 dark:text-gray-600")} />
        </button>
      ))}
    </div>
  );
}

function ScoreBadge({ score }: { score: string | null }) {
  if (!score) return <span className="text-gray-400 text-xs">—</span>;
  const n = parseFloat(score);
  const color = n >= 4 ? "text-green-600 bg-green-50 dark:bg-green-900/20" :
    n >= 3 ? "text-amber-600 bg-amber-50 dark:bg-amber-900/20" : "text-red-600 bg-red-50 dark:bg-red-900/20";
  return (
    <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1", color)}>
      <Star className="w-3 h-3 fill-current" /> {n.toFixed(1)}/5
    </span>
  );
}

export function PerformanceClient({ evaluations, employees }: Props) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [scores, setScores] = useState<Record<string, number>>({
    quality: 3, productivity: 3, teamwork: 3, initiative: 3, communication: 3,
  });

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting }, reset } = useForm<EvalForm>({
    resolver: zodResolver(schema),
    defaultValues: { quality: 3, productivity: 3, teamwork: 3, initiative: 3, communication: 3, type: "ANNUAL" },
  });

  const setScore = (key: string, value: number) => {
    setScores(prev => ({ ...prev, [key]: value }));
    setValue(key as any, value);
  };

  const onSubmit = async (data: EvalForm) => {
    try {
      const avgScore = (data.quality + data.productivity + data.teamwork + data.initiative + data.communication) / 5;
      const res = await fetch("/api/performance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          scores: { quality: data.quality, productivity: data.productivity, teamwork: data.teamwork, initiative: data.initiative, communication: data.communication },
          overallScore: avgScore.toFixed(2),
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast.success("Évaluation enregistrée !");
      reset();
      setShowForm(false);
      router.refresh();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const avgScore = evaluations.length
    ? evaluations.filter(e => e.overallScore).reduce((s, e) => s + parseFloat(e.overallScore!), 0) / evaluations.filter(e => e.overallScore).length
    : 0;

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card flex items-center gap-4">
          <div className="p-3 rounded-xl bg-[#0090D1]/10 dark:bg-[#0090D1]/20">
            <Star className="w-6 h-6 text-[#0090D1] fill-[#0090D1]" />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Score moyen</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white font-outfit">{avgScore.toFixed(1)}<span className="text-sm text-gray-400">/5</span></p>
          </div>
        </div>
        <div className="stat-card flex items-center gap-4">
          <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20">
            <TrendingUp className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Évaluations total</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white font-outfit">{evaluations.length}</p>
          </div>
        </div>
        <div className="stat-card flex items-center gap-4">
          <div className="p-3 rounded-xl bg-green-50 dark:bg-green-900/20">
            <Award className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Excellentes (≥4.5)</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white font-outfit">
              {evaluations.filter(e => e.overallScore && parseFloat(e.overallScore) >= 4.5).length}
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-[#0090D1] hover:bg-[#007ab8] text-white text-sm font-medium rounded-lg transition-all shadow-md shadow-[#0090D1]/20">
          <Plus className="w-4 h-4" /> Nouvelle évaluation
        </button>
      </div>

      {/* Evaluation form */}
      {showForm && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-[#0090D1]/30 dark:border-[#0090D1]/50 p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-gray-900 dark:text-white">Nouvelle évaluation</h3>
            <button onClick={() => setShowForm(false)}><X className="w-4 h-4 text-gray-400" /></button>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Membre *</label>
                <select {...register("employeeId")}
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-[#0090D1]">
                  <option value="">Sélectionner</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
                </select>
                {errors.employeeId && <p className="text-xs text-red-500 mt-1">{errors.employeeId.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Période *</label>
                <input {...register("period")} placeholder="Ex: T3 2024, Annuel 2024"
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-[#0090D1]" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
                <select {...register("type")}
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-[#0090D1]">
                  <option value="ANNUAL">Annuelle</option>
                  <option value="QUARTERLY">Trimestrielle</option>
                  <option value="PROBATION">Fin de période d&apos;essai</option>
                  <option value="360">Évaluation 360°</option>
                </select>
              </div>
            </div>

            {/* Criteria scores */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Critères d&apos;évaluation</h4>
              <div className="space-y-3">
                {CRITERIA.map((c) => (
                  <div key={c.key} className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-gray-800 last:border-0">
                    <span className="text-sm text-gray-700 dark:text-gray-300 w-48">{c.label}</span>
                    <StarRating value={scores[c.key]} onChange={(v) => setScore(c.key, v)} />
                    <span className="text-xs font-bold text-gray-500 w-8 text-right">{scores[c.key]}/5</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm font-bold text-blue-700 dark:text-blue-300">
                  Score global : {(Object.values(scores).reduce((a, b) => a + b, 0) / CRITERIA.length).toFixed(2)}/5
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Points forts *</label>
                <textarea {...register("strengths")} rows={3}
                  placeholder="Décrivez les points forts observés..."
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-[#0090D1] resize-none" />
                {errors.strengths && <p className="text-xs text-red-500 mt-1">{errors.strengths.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Axes d&apos;amélioration *</label>
                <textarea {...register("improvements")} rows={3}
                  placeholder="Domaines à améliorer..."
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-[#0090D1] resize-none" />
                {errors.improvements && <p className="text-xs text-red-500 mt-1">{errors.improvements.message}</p>}
              </div>
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 transition-colors">Annuler</button>
              <button type="submit" disabled={isSubmitting}
                className="flex items-center gap-2 px-4 py-2 bg-[#0090D1] text-white text-sm font-medium rounded-lg hover:bg-[#007ab8] transition-all disabled:opacity-60 shadow-md shadow-[#0090D1]/20">
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Enregistrer l&apos;évaluation
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Evaluations table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full data-table">
            <thead>
              <tr>
                <th className="text-left">Membre</th>
                <th className="text-left">Période</th>
                <th className="text-left">Type</th>
                <th className="text-left">Score</th>
                <th className="text-left">Statut</th>
                <th className="text-left">Date</th>
              </tr>
            </thead>
            <tbody>
              {evaluations.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-10 text-gray-400 text-sm">Aucune évaluation</td></tr>
              ) : evaluations.map((ev) => (
                <tr key={ev.id}>
                  <td>
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#0090D1] flex items-center justify-center text-white text-xs font-bold">
                        {(ev.employeeFirstName?.[0] || "?")}
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {ev.employeeFirstName} {ev.employeeLastName}
                      </span>
                    </div>
                  </td>
                  <td className="text-sm text-gray-600 dark:text-gray-400">{ev.period}</td>
                  <td className="text-sm text-gray-600 dark:text-gray-400">{ev.type || "ANNUAL"}</td>
                  <td><ScoreBadge score={ev.overallScore} /></td>
                  <td>
                    <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium",
                      ev.status === "COMPLETED" ? "badge-approved" :
                      ev.status === "SUBMITTED" ? "badge-active" : "badge-pending")}>
                      {ev.status === "COMPLETED" ? "Finalisé" : ev.status === "SUBMITTED" ? "Soumis" : "Brouillon"}
                    </span>
                  </td>
                  <td className="text-xs text-gray-500">{format(new Date(ev.createdAt), "dd/MM/yyyy")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
