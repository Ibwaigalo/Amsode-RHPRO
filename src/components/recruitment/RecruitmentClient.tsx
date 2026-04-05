"use client";
// src/components/recruitment/RecruitmentClient.tsx
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Plus, Briefcase, Users, MapPin, Calendar, X, Loader2, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

const STATUS_LABELS: Record<string, string> = { OUVERT: "Ouvert", FERME: "Fermé", EN_COURS: "En cours", ANNULE: "Annulé" };
const STATUS_COLORS: Record<string, string> = {
  OUVERT: "badge-approved",
  FERME: "badge-rejected",
  EN_COURS: "badge-pending",
  ANNULE: "bg-gray-100 text-gray-700",
};

const jobSchema = z.object({
  title: z.string().min(3),
  departmentId: z.string().uuid().optional(),
  contractType: z.enum(["CDI", "CDD", "STAGE", "CONSULTANT"]),
  description: z.string().min(20),
  requirements: z.string().optional(),
  location: z.string().optional(),
  salaryMin: z.string().optional(),
  salaryMax: z.string().optional(),
  deadline: z.string().optional(),
});
type JobForm = z.infer<typeof jobSchema>;

interface Posting {
  id: string;
  title: string;
  contractType: string | null;
  location: string | null;
  deadline: string | null;
  status: string;
  createdAt: Date;
  departmentName: string | null;
}

interface Props {
  postings: Posting[];
  departments: { id: string; name: string }[];
}

export default function RecruitmentClient({ postings, departments }: Props) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<JobForm>({
    resolver: zodResolver(jobSchema),
    defaultValues: { contractType: "CDI" },
  });

  const onSubmit = async (data: JobForm) => {
    try {
      const res = await fetch("/api/recruitment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast.success("Offre d'emploi publiée !");
      reset();
      setShowForm(false);
      router.refresh();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const openCount = postings.filter(p => p.status === "OPEN").length;

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Postes ouverts", value: openCount, color: "text-green-600" },
          { label: "Total offres", value: postings.length, color: "text-blue-600" },
          { label: "Expirés", value: postings.filter(p => p.deadline && parseISO(p.deadline) < new Date()).length, color: "text-amber-500" },
        ].map((s, i) => (
          <div key={i} className="stat-card text-center">
            <p className={cn("text-2xl font-bold font-outfit", s.color)}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex items-center justify-end">
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-[#0090D1] hover:bg-[#007ab8] text-white text-sm font-medium rounded-lg transition-all shadow-md shadow-[#0090D1]/20">
          <Plus className="w-4 h-4" /> Publier une offre
        </button>
      </div>

      {/* Post job form */}
      {showForm && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-[#0090D1]/30 dark:border-[#0090D1]/50 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">Nouvelle offre d'emploi</h3>
            <button onClick={() => setShowForm(false)}><X className="w-4 h-4 text-gray-400" /></button>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Intitulé du poste *</label>
              <input {...register("title")}
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: Chargé de projet terrain" />
              {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>}
            </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Projet</label>
                <select {...register("departmentId")}
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Sélectionner</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Type de contrat</label>
              <select {...register("contractType")}
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500">
                {["CDI", "CDD", "STAGE", "CONSULTANT"].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Lieu</label>
              <input {...register("location")}
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Bamako, Mali" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Date limite</label>
              <input {...register("deadline")} type="date"
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Description du poste *</label>
              <textarea {...register("description")} rows={4} placeholder="Décrivez les responsabilités et missions..."
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description.message}</p>}
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Prérequis</label>
              <textarea {...register("requirements")} rows={2} placeholder="Diplômes, expériences requises..."
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>
            <div className="sm:col-span-2 flex gap-3">
              <button type="button" onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                Annuler
              </button>
              <button type="submit" disabled={isSubmitting}
                className="flex items-center gap-2 px-4 py-2 bg-[#0090D1] text-white text-sm font-medium rounded-lg hover:bg-[#007ab8] transition-all disabled:opacity-60 shadow-md shadow-[#0090D1]/20">
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Publier l'offre
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Job postings grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {postings.length === 0 ? (
          <div className="md:col-span-2 text-center py-12 text-gray-400 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800">
            <Briefcase className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Aucune offre publiée</p>
          </div>
        ) : postings.map((posting) => (
          <div key={posting.id}
            className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5 hover:shadow-md transition-all">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{posting.title}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{posting.departmentName || "Département non spécifié"}</p>
              </div>
              <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", STATUS_COLORS[posting.status])}>
                {STATUS_LABELS[posting.status]}
              </span>
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-gray-500">
              {posting.contractType && (
                <span className="flex items-center gap-1">
                  <Briefcase className="w-3 h-3" /> {posting.contractType}
                </span>
              )}
              {posting.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {posting.location}
                </span>
              )}
              {posting.deadline && (
                <span className={cn("flex items-center gap-1", parseISO(posting.deadline) < new Date() ? "text-red-500" : "")}>
                  <Calendar className="w-3 h-3" />
                  Limite: {format(parseISO(posting.deadline), "dd/MM/yyyy")}
                </span>
              )}
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50 dark:border-gray-800">
              <span className="text-xs text-gray-400">
                Publiée le {format(new Date(posting.createdAt), "dd/MM/yyyy")}
              </span>
              <button className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium">
                <Users className="w-3.5 h-3.5" /> Candidatures
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
