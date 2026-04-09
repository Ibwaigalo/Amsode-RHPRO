"use client";
// src/components/leaves/LeavesClient.tsx
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Plus, CheckCircle, XCircle, Clock, Calendar, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { differenceInBusinessDays, parseISO, format } from "date-fns";
import { fr } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";

const LEAVE_TYPES: Record<string, string> = {
  CONGE_PAYE: "Congés annuels",
  MALADIE: "Maladie",
  MATERNITE: "Maternité",
  PATERNITE: "Paternité",
  SANS_SOLDE: "Sans solde",
  AUTRE: "Autre",
};

const TYPE_COLORS: Record<string, string> = {
  CONGE_PAYE: "bg-[#0090D1]/10 text-[#0090D1] dark:bg-[#0090D1]/20",
  MALADIE: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  MATERNITE: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300",
  PATERNITE: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
  SANS_SOLDE: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300",
  AUTRE: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
};

const STATUS_CONFIG = {
  PENDING: { label: "En attente Manager", icon: Clock, color: "badge-pending" },
  PENDING_PRESIDENT: { label: "En attente Président", icon: Clock, color: "badge-pending" },
  PENDING_RH: { label: "En attente RH", icon: Clock, color: "badge-pending" },
  APPROVED: { label: "Approuvé", icon: CheckCircle, color: "badge-approved" },
  REJECTED: { label: "Refusé", icon: XCircle, color: "badge-rejected" },
  CANCELLED: { label: "Annulé", icon: XCircle, color: "bg-gray-100 text-gray-700" },
};

const leaveSchema = z.object({
  leaveType: z.enum(["CONGE_PAYE", "MALADIE", "MATERNITE", "PATERNITE", "SANS_SOLDE", "AUTRE"]),
  startDate: z.string().min(1, "Date requise"),
  endDate: z.string().min(1, "Date requise"),
  reason: z.string().min(10, "Motif trop court (min. 10 caractères)"),
});
type LeaveForm = z.infer<typeof leaveSchema>;

interface LeaveRequest {
  id: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  totalDays: string | number;
  reason: string | null;
  status: string;
  createdAt: Date;
  employeeName: string | null;
  employeeLastName: string | null;
  employeeId: string | null;
}

interface Props {
  requests: LeaveRequest[];
  balances: any[];
  userRole: string;
}

export default function LeavesClient({ requests, balances, userRole }: Props) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState<"list" | "calendar">("list");
  const [filterStatus, setFilterStatus] = useState("");
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const { register, handleSubmit, watch, formState: { errors, isSubmitting }, reset } = useForm<LeaveForm>({
    resolver: zodResolver(leaveSchema),
    mode: "onBlur",
    defaultValues: { leaveType: "CONGE_PAYE" },
  });

  const startDate = watch("startDate");
  const endDate = watch("endDate");
  const estimatedDays = startDate && endDate
    ? Math.max(0, differenceInBusinessDays(parseISO(endDate), parseISO(startDate)) + 1)
    : 0;

  const onSubmit = async (data: LeaveForm) => {
    try {
      const res = await fetch("/api/leaves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, totalDays: estimatedDays }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast.success("Demande de congé soumise avec succès !");
      reset();
      setShowForm(false);
      router.refresh();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleAction = async (id: string, action: "approve" | "reject") => {
    if (loadingAction) return;
    setLoadingAction(id);
    try {
      const res = await fetch(`/api/leaves/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) throw new Error();
      toast.success(action === "approve" ? "Demande approuvée" : "Demande refusée");
      router.refresh();
    } catch {
      toast.error("Une erreur est survenue");
    } finally {
      setLoadingAction(null);
    }
  };

  const filtered = filterStatus ? requests.filter(r => r.status === filterStatus) : requests;
  const pending = requests.filter(r => r.status === "PENDING" || r.status === "PENDING_PRESIDENT" || r.status === "PENDING_RH").length;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      className="space-y-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Summary cards */}
      <motion.div 
        className="grid grid-cols-2 sm:grid-cols-4 gap-3"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {[
          { label: "En attente", count: pending, color: "brand" },
          { label: "Approuvés", count: requests.filter(r => r.status === "APPROVED").length, color: "green" },
          { label: "Refusés", count: requests.filter(r => r.status === "REJECTED").length, color: "red" },
          { label: "Total", count: requests.length, color: "brand" },
        ].map((item, i) => (
          <motion.div 
            key={i} 
            variants={itemVariants}
            className="stat-card text-center"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <p className={cn("text-2xl font-bold font-outfit",
              item.color === "amber" ? "text-amber-500" :
              item.color === "green" ? "text-green-600" :
              item.color === "red" ? "text-red-500" : "text-blue-600")}>
              {item.count}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">{item.label}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Controls */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          {["", "PENDING", "PENDING_PRESIDENT", "PENDING_RH", "APPROVED", "REJECTED"].map((s) => (
            <button key={s}
              onClick={() => setFilterStatus(s)}
              className={cn("text-xs px-3 py-1.5 rounded-full font-medium transition-colors",
                filterStatus === s
                  ? "bg-[#0090D1] text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700")}>
              {s === "" ? "Tous" : STATUS_CONFIG[s as keyof typeof STATUS_CONFIG]?.label}
              {s === "PENDING" && pending > 0 && (
                <span className="ml-1.5 bg-white/30 text-current px-1 rounded-full text-xs">{pending}</span>
              )}
            </button>
          ))}
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-[#0090D1] hover:bg-[#007ab8] text-white text-sm font-medium rounded-lg transition-colors shadow-sm">
          <Plus className="w-4 h-4" /> Nouvelle demande
        </button>
      </div>

      {/* Leave request form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="bg-white dark:bg-gray-900 rounded-xl border border-blue-200 dark:border-blue-800 p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">Nouvelle demande de congé</h3>
              <button onClick={() => setShowForm(false)}>
                <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
              </button>
            </div>
          <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Type de congé</label>
              <select {...register("leaveType")}
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500">
                {Object.entries(LEAVE_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Du</label>
                <input {...register("startDate")} type="date"
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Au</label>
                <input {...register("endDate")} type="date"
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            {estimatedDays > 0 && (
              <div className="sm:col-span-2">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg text-sm">
                  <Calendar className="w-4 h-4" />
                  <span>{estimatedDays} jour(s) ouvrable(s)</span>
                </div>
              </div>
            )}
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Motif *</label>
              <textarea {...register("reason")} rows={3}
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Décrivez le motif de votre demande..." />
              {errors.reason && <p className="text-xs text-red-500 mt-1">{errors.reason.message}</p>}
            </div>
            <div className="sm:col-span-2 flex gap-3">
              <button type="button" onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                Annuler
              </button>
              <button type="submit" disabled={isSubmitting}
                className="flex items-center gap-2 px-4 py-2 bg-[#0090D1] hover:bg-[#007ab8] text-white text-sm font-medium rounded-lg transition-all disabled:opacity-60">
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Soumettre la demande
              </button>
            </div>
          </form>
        </motion.div>
        )}
      </AnimatePresence>

      {/* Requests table */}
      <motion.div 
        className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <div className="overflow-x-auto">
          <table className="w-full data-table">
            <thead>
              <tr>
                <th className="text-left">Membre</th>
                <th className="text-left">Type</th>
                <th className="text-left">Période</th>
                <th className="text-left">Durée</th>
                <th className="text-left">Statut</th>
                {["ADMIN_RH", "MANAGER"].includes(userRole) && <th className="text-right">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-10 text-gray-400 text-sm">Aucune demande</td></tr>
              ) : filtered.map((req) => {
                const statusCfg = STATUS_CONFIG[req.status as keyof typeof STATUS_CONFIG] || { label: req.status, color: "bg-gray-100 text-gray-700" };
                return (
                  <tr key={req.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#0090D1] flex items-center justify-center text-white text-xs font-bold">
                          {(req.employeeName?.[0] || "?")}
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {req.employeeName} {req.employeeLastName}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", TYPE_COLORS[req.leaveType])}>
                        {LEAVE_TYPES[req.leaveType]}
                      </span>
                    </td>
                    <td className="text-sm text-gray-600 dark:text-gray-400">
                      {format(parseISO(req.startDate), "dd/MM/yyyy")} → {format(parseISO(req.endDate), "dd/MM/yyyy")}
                    </td>
                    <td className="text-sm font-medium text-gray-900 dark:text-white">
                      {req.totalDays}j
                    </td>
                    <td>
                      <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", statusCfg.color)}>
                        {statusCfg.label}
                      </span>
                    </td>
                      {["ADMIN_RH", "MANAGER", "PRESIDENT"].includes(userRole) && (
                      <td>
                        {["PENDING", "PENDING_PRESIDENT", "PENDING_RH"].includes(req.status) && (
                          <div className="flex items-center justify-end gap-1">
                            <button 
                              onClick={() => handleAction(req.id, "approve")}
                              disabled={loadingAction === req.id}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors disabled:opacity-50"
                            >
                              {loadingAction === req.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                            </button>
                            <button 
                              onClick={() => handleAction(req.id, "reject")}
                              disabled={loadingAction === req.id}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                            >
                              {loadingAction === req.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                            </button>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
}
