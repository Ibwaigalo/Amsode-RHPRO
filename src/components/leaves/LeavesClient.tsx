"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Plus, CheckCircle, XCircle, Clock, Calendar, X, Loader2, Search, Filter, Download } from "lucide-react";
import * as XLSX from "xlsx";
import { cn } from "@/lib/utils";
import { differenceInBusinessDays, parseISO, format } from "date-fns";

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

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  PENDING: { label: "En attente Manager", color: "badge-pending" },
  PENDING_PRESIDENT: { label: "En attente Président", color: "badge-pending" },
  PENDING_RH: { label: "En attente RH", color: "badge-pending" },
  APPROVED: { label: "Approuvé", color: "badge-approved" },
  REJECTED: { label: "Refusé", color: "badge-rejected" },
  CANCELLED: { label: "Annulé", color: "bg-gray-100 text-gray-700" },
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

interface LeaveBalance {
  employeeId: string;
  used: number;
  remaining: number;
  maxDays: number;
  employeeName?: string;
}

interface Props {
  requests: LeaveRequest[];
  balances: LeaveBalance[];
  userRole: string;
  currentEmployeeId: string | null;
}

export default function LeavesClient({ requests, balances, userRole, currentEmployeeId }: Props) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState("");
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [onLeaveFilter, setOnLeaveFilter] = useState<"all" | "on_leave" | "not_on_leave">("all");

  const myBalance = balances.find(b => b.employeeId === currentEmployeeId) || balances[0];

  const { register, handleSubmit, watch, formState: { errors, isSubmitting }, reset } = useForm<LeaveForm>({
    resolver: zodResolver(leaveSchema),
    mode: "onBlur",
    defaultValues: { leaveType: "CONGE_PAYE" },
  });

  const startDate = watch("startDate");
  const endDate = watch("endDate");
  const leaveType = watch("leaveType");
  const estimatedDays = startDate && endDate
    ? Math.max(0, differenceInBusinessDays(parseISO(endDate), parseISO(startDate)) + 1)
    : 0;

  const isOverLimit = leaveType === "CONGE_PAYE" && myBalance && estimatedDays > myBalance.remaining;

  const onSubmit = async (data: LeaveForm) => {
    if (data.leaveType === "CONGE_PAYE" && myBalance && estimatedDays > myBalance.remaining) {
      toast.error(`Vous ne pouvez pas dépasser ${myBalance.remaining} jours restants`);
      return;
    }
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
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      toast.success(action === "approve" ? "Demande approuvée" : "Demande refusée");
      router.refresh();
    } catch (e: any) {
      toast.error(e.message || "Une erreur est survenue");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleReturnFromLeave = async (employeeId: string, employeeName: string) => {
    if (!confirm(`${employeeName} est de retour de congé ?`)) return;
    try {
      const res = await fetch(`/api/employees/${employeeId}/return`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      toast.success(data.message || "Employé remis comme actif");
      router.refresh();
    } catch (e: any) {
      toast.error(e.message || "Une erreur est survenue");
    }
  };

  const canApprove = (reqStatus: string, role: string) => {
    if (role === "MANAGER") {
      return reqStatus === "PENDING";
    }
    if (role === "ADMIN_RH" || role === "PRESIDENT") {
      return reqStatus === "PENDING_RH";
    }
    return false;
  };

  const filtered = filterStatus ? requests.filter(r => r.status === filterStatus) : requests;
  
  const pendingForManager = requests.filter(r => r.status === "PENDING").length;
  const pendingForRH = requests.filter(r => r.status === "PENDING_RH").length;
  const pending = userRole === "MANAGER" ? pendingForManager : pendingForRH;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const employeesOnLeave = new Set(
    requests
      .filter(r => r.status === "APPROVED")
      .filter(r => {
        const start = parseISO(r.startDate);
        const end = parseISO(r.endDate);
        return start <= today && end >= today;
      })
      .map(r => r.employeeId)
      .filter(Boolean)
  );

  const applyFilters = (req: LeaveRequest) => {
    if (onLeaveFilter === "on_leave" && !employeesOnLeave.has(req.employeeId)) return false;
    if (onLeaveFilter === "not_on_leave" && employeesOnLeave.has(req.employeeId)) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const fullName = `${req.employeeName} ${req.employeeLastName}`.toLowerCase();
      if (!fullName.includes(query)) return false;
    }
    return true;
  };

  const finalFiltered = filtered.filter(applyFilters);

  const exportToExcel = () => {
    const dataToExport = finalFiltered.map((req, index) => {
      const isOnLeave = employeesOnLeave.has(req.employeeId) && req.status === "APPROVED";
      return {
        "#": index + 1,
        "Employé": `${req.employeeName || ""} ${req.employeeLastName || ""}`.trim(),
        "Type": LEAVE_TYPES[req.leaveType] || req.leaveType,
        "Date début": format(parseISO(req.startDate), "dd/MM/yyyy"),
        "Date fin": format(parseISO(req.endDate), "dd/MM/yyyy"),
        "Jours": req.totalDays,
        "Statut": STATUS_CONFIG[req.status as keyof typeof STATUS_CONFIG]?.label || req.status,
        "En congé": isOnLeave ? "Oui" : "Non",
        "Motif": req.reason || "",
      };
    });

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Congés");
    
    const colWidths = [
      { wch: 5 }, { wch: 25 }, { wch: 18 }, { wch: 12 }, { wch: 12 }, { wch: 8 }, { wch: 18 }, { wch: 10 }, { wch: 40 }
    ];
    ws["!cols"] = colWidths;
    
    XLSX.writeFile(wb, `conges_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
    toast.success("Export Excel téléchargé !");
  };

  const displayBalance = userRole === "ADMIN_RH" || userRole === "PRESIDENT" 
    ? balances 
    : [myBalance].filter(Boolean);

  return (
    <div className="space-y-4">
      {(userRole === "ADMIN_RH" || userRole === "PRESIDENT") && balances.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Solde de congés (22 jours/an)</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-48 overflow-y-auto">
            {balances.map(b => {
              const empName = b.employeeName || (requests.find(r => r.employeeId === b.employeeId) 
                ? `${requests.find(r => r.employeeId === b.employeeId)?.employeeName} ${requests.find(r => r.employeeId === b.employeeId)?.employeeLastName}`
                : b.employeeId);
              return (
                <div key={b.employeeId} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm">
                  <span className="font-medium text-gray-700 dark:text-gray-300 truncate">{empName}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-green-600 font-semibold">{b.remaining}</span>
                    <span className="text-gray-400">/ {b.maxDays}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {userRole !== "ADMIN_RH" && userRole !== "PRESIDENT" && myBalance && (
        <div className="flex items-center gap-4 p-4 bg-[#0090D1]/10 dark:bg-[#0090D1]/20 rounded-xl border border-[#0090D1]/30">
          <div className="flex-1">
            <p className="text-sm text-[#0090D1] font-medium">Congés annuels</p>
            <p className="text-xs text-gray-500">Période du contrat</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-[#0090D1]">{myBalance.remaining}</p>
            <p className="text-xs text-gray-500">restant(s) sur {myBalance.maxDays}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "En attente", count: pending, color: "brand" },
          { label: "Approuvés", count: requests.filter(r => r.status === "APPROVED").length, color: "green" },
          { label: "Refusés", count: requests.filter(r => r.status === "REJECTED").length, color: "red" },
          { label: "Total", count: requests.length, color: "brand" },
        ].map((item, i) => (
          <div key={i} className="stat-card text-center">
            <p className={cn("text-2xl font-bold font-outfit",
              item.color === "amber" ? "text-amber-500" :
              item.color === "green" ? "text-green-600" :
              item.color === "red" ? "text-red-500" : "text-blue-600")}>
              {item.count}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">{item.label}</p>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {["ADMIN_RH", "PRESIDENT"].includes(userRole) && (
          <div className="flex flex-wrap items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un employé..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={onLeaveFilter}
                onChange={(e) => setOnLeaveFilter(e.target.value as any)}
                className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tous les employés</option>
                <option value="on_leave">En congés</option>
                <option value="not_on_leave">Pas en congés</option>
              </select>
              {onLeaveFilter !== "all" && (
                <button onClick={() => { setOnLeaveFilter("all"); setSearchQuery(""); }} className="p-1.5 text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            {["", "PENDING", "PENDING_RH", "APPROVED", "REJECTED"].map((s) => (
              <button key={s}
                onClick={() => setFilterStatus(s)}
                className={cn("text-xs px-3 py-1.5 rounded-full font-medium transition-colors",
                  filterStatus === s
                    ? "bg-[#0090D1] text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700")}>
                {s === "" ? "Tous" : STATUS_CONFIG[s as keyof typeof STATUS_CONFIG]?.label}
                {s === "PENDING" && userRole === "MANAGER" && pendingForManager > 0 && (
                  <span className="ml-1.5 bg-white/30 text-current px-1 rounded-full text-xs">{pendingForManager}</span>
                )}
                {s === "PENDING_RH" && (userRole === "ADMIN_RH" || userRole === "PRESIDENT") && pendingForRH > 0 && (
                  <span className="ml-1.5 bg-white/30 text-current px-1 rounded-full text-xs">{pendingForRH}</span>
                )}
              </button>
            ))}
          </div>
          <button onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 bg-[#0090D1] hover:bg-[#007ab8] text-white text-sm font-medium rounded-lg transition-colors shadow-sm">
            <Plus className="w-4 h-4" /> Nouvelle demande
          </button>
          <button onClick={exportToExcel}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm">
            <Download className="w-4 h-4" /> Export Excel
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-blue-200 dark:border-blue-800 p-5">
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
                <div className={cn("inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm",
                  isOverLimit 
                    ? "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300" 
                    : "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300")}>
                  <Calendar className="w-4 h-4" />
                  <span>{estimatedDays} jour(s) ouvrable(s)</span>
                  {isOverLimit && <span className="ml-2 font-medium">- Dépasse le solde!</span>}
                </div>
              </div>
            )}
            {watch("leaveType") === "CONGE_PAYE" && myBalance && (
              <div className="sm:col-span-2">
                <div className="text-xs text-gray-500 mb-1">Solde actuel:</div>
                <div className="flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-900/20 rounded-lg text-sm">
                  <span className="text-green-600 font-semibold">{myBalance.remaining} jours restants</span>
                  <span className="text-gray-400">sur {myBalance.maxDays}</span>
                  <span className="text-gray-400">({myBalance.used} utilisés)</span>
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
              <button type="submit" disabled={isSubmitting || isOverLimit}
                className={cn("flex items-center gap-2 px-4 py-2 text-white text-sm font-medium rounded-lg transition-all",
                  isOverLimit 
                    ? "bg-gray-400 cursor-not-allowed" 
                    : "bg-[#0090D1] hover:bg-[#007ab8]")}>
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Soumettre la demande
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
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
              {finalFiltered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-10 text-gray-400 text-sm">Aucune demande</td></tr>
              ) : finalFiltered.map((req) => {
                const statusCfg = STATUS_CONFIG[req.status as keyof typeof STATUS_CONFIG] || { label: req.status, color: "bg-gray-100 text-gray-700" };
                const isOnLeave = employeesOnLeave.has(req.employeeId) && req.status === "APPROVED";
                return (
                  <tr key={req.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        {isOnLeave && (
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                          </span>
                        )}
                        <div className="w-7 h-7 rounded-full bg-[#0090D1] flex items-center justify-center text-white text-xs font-bold">
                          {(req.employeeName?.[0] || "?")}
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {req.employeeName} {req.employeeLastName}
                          {isOnLeave && <span className="ml-2 text-xs text-green-600 font-medium">En congé</span>}
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
                        {canApprove(req.status, userRole) ? (
                          <div className="flex items-center justify-end gap-1">
                            <button 
                              onClick={() => handleAction(req.id, "approve")}
                              disabled={loadingAction === req.id}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors disabled:opacity-50"
                              title={userRole === "MANAGER" ? "Valider (puis RH validera)" : "Approuver"}
                            >
                              {loadingAction === req.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                            </button>
                            <button 
                              onClick={() => handleAction(req.id, "reject")}
                              disabled={loadingAction === req.id}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                              title="Refuser"
                            >
                              {loadingAction === req.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                            </button>
                          </div>
                        ) : req.status === "PENDING" && userRole === "ADMIN_RH" ? (
                          <span className="text-xs text-gray-400" title="En attente validation manager">En attente manager</span>
                        ) : req.status === "APPROVED" && isOnLeave && userRole === "ADMIN_RH" ? (
                          <button 
                            onClick={() => handleReturnFromLeave(req.employeeId, `${req.employeeName || ""} ${req.employeeLastName || ""}`)}
                            className="px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 rounded-lg transition-colors"
                            title="Marquer comme revenu de congé"
                          >
                            Retour
                          </button>
                        ) : null}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
