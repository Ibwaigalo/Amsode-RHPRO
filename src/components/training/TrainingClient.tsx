"use client";
// src/components/training/TrainingClient.tsx
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Plus, GraduationCap, Clock, DollarSign, Users, X, Loader2, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";

const schema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  provider: z.string().optional(),
  duration: z.number().positive().optional(),
  durationUnit: z.string().default("hours"),
  cost: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  maxParticipants: z.number().positive().optional(),
});
type TrainingForm = z.infer<typeof schema>;

interface Training {
  id: string;
  title: string;
  description: string | null;
  provider: string | null;
  duration: number | null;
  durationUnit: string | null;
  cost: string | null;
  startDate: string | null;
  endDate: string | null;
  maxParticipants: number | null;
  isActive: boolean | null;
}

interface Props {
  trainings: Training[];
  employees: { id: string; firstName: string; lastName: string }[];
}

const UNIT_LABELS: Record<string, string> = { hours: "h", days: "j", weeks: "sem." };

export function TrainingClient({ trainings, employees }: Props) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<TrainingForm>({
    resolver: zodResolver(schema),
    defaultValues: { durationUnit: "hours" },
  });

  const onSubmit = async (data: TrainingForm) => {
    try {
      const res = await fetch("/api/training", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast.success("Formation ajoutée au catalogue !");
      reset();
      setShowForm(false);
      router.refresh();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const formatCost = (cost: string | null) => {
    if (!cost) return "Gratuit";
    return new Intl.NumberFormat("fr-ML", { style: "currency", currency: "XOF", maximumFractionDigits: 0 }).format(parseFloat(cost));
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="stat-card text-center">
          <p className="text-2xl font-bold text-blue-600 font-outfit">{trainings.length}</p>
          <p className="text-xs text-gray-500 mt-0.5">Formations actives</p>
        </div>
        <div className="stat-card text-center">
          <p className="text-2xl font-bold text-green-600 font-outfit">
            {trainings.filter(t => t.startDate && parseISO(t.startDate) > new Date()).length}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">À venir</p>
        </div>
        <div className="stat-card text-center">
          <p className="text-2xl font-bold text-purple-600 font-outfit">{employees.length}</p>
          <p className="text-xs text-gray-500 mt-0.5">Membres à former</p>
        </div>
      </div>

      <div className="flex justify-end">
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-[#0090D1] hover:bg-[#007ab8] text-white text-sm font-medium rounded-lg transition-all shadow-md shadow-[#0090D1]/20">
          <Plus className="w-4 h-4" /> Ajouter une formation
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-[#0090D1]/30 dark:border-[#0090D1]/50 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">Nouvelle formation</h3>
            <button onClick={() => setShowForm(false)}><X className="w-4 h-4 text-gray-400" /></button>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Intitulé *</label>
              <input {...register("title")} placeholder="Ex: Gestion de projet Agile"
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-[#0090D1]" />
              {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Organisme formateur</label>
              <input {...register("provider")} placeholder="Ex: CFPT Bamako"
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-[#0090D1]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Coût (FCFA)</label>
              <input {...register("cost")} type="number" placeholder="0"
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-[#0090D1]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Date de début</label>
              <input {...register("startDate")} type="date"
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-[#0090D1]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Date de fin</label>
              <input {...register("endDate")} type="date"
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-[#0090D1]" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
              <textarea {...register("description")} rows={2} placeholder="Objectifs et contenu de la formation..."
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-[#0090D1] resize-none" />
            </div>
            <div className="sm:col-span-2 flex gap-3">
              <button type="button" onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 transition-colors">Annuler</button>
              <button type="submit" disabled={isSubmitting}
                className="flex items-center gap-2 px-4 py-2 bg-[#0090D1] text-white text-sm font-medium rounded-lg hover:bg-[#007ab8] transition-all disabled:opacity-60 shadow-md shadow-[#0090D1]/20">
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Créer la formation
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Training catalogue */}
      {trainings.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800">
          <GraduationCap className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
          <p className="text-gray-500 dark:text-gray-400 text-sm">Aucune formation au catalogue</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {trainings.map((t) => {
            const isUpcoming = t.startDate && parseISO(t.startDate) > new Date();
            const isOngoing = t.startDate && t.endDate &&
              parseISO(t.startDate) <= new Date() && parseISO(t.endDate) >= new Date();

            return (
              <div key={t.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5 hover:shadow-md transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                    <BookOpen className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium",
                    isOngoing ? "badge-active" : isUpcoming ? "badge-approved" : "bg-gray-100 text-gray-500 dark:bg-gray-800")}>
                    {isOngoing ? "En cours" : isUpcoming ? "À venir" : "Passée"}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">{t.title}</h3>
                {t.description && <p className="text-xs text-gray-500 mb-3 line-clamp-2">{t.description}</p>}

                <div className="flex flex-wrap gap-3 text-xs text-gray-500 mt-3 pt-3 border-t border-gray-50 dark:border-gray-800">
                  {t.provider && (
                    <span className="flex items-center gap-1">
                      <GraduationCap className="w-3.5 h-3.5" /> {t.provider}
                    </span>
                  )}
                  {t.duration && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {t.duration}{UNIT_LABELS[t.durationUnit || "hours"]}
                    </span>
                  )}
                  {t.cost && (
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5" /> {formatCost(t.cost)}
                    </span>
                  )}
                  {t.maxParticipants && (
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" /> Max {t.maxParticipants}
                    </span>
                  )}
                </div>
                {t.startDate && (
                  <p className="text-xs text-gray-400 mt-2">
                    {format(parseISO(t.startDate), "dd/MM/yyyy")}
                    {t.endDate && ` → ${format(parseISO(t.endDate), "dd/MM/yyyy")}`}
                  </p>
                )}
                <button className="mt-3 w-full py-1.5 text-xs font-medium text-blue-600 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                  S'inscrire / Voir détails
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
