"use client";
import { useState } from "react";
import { UserMinus, Users, ArrowLeft, Search, Filter, AlertTriangle, CheckCircle, Clock, XCircle } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

const StatusChangeModal = dynamic(
  () => import("./StatusChangeModal").then(m => m.StatusChangeModal),
  { 
    loading: () => <div className="fixed inset-0 bg-black/50 flex items-center justify-center"><div className="bg-white p-6 rounded-lg">Chargement...</div></div>,
    ssr: false 
  }
);

interface Employee {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  workEmail: string | null;
  phone: string | null;
  cin: string | null;
  contractType: string;
  startDate: string;
  endDate: string | null;
  globalSalaryCost?: string | null;
  isActive: boolean;
  workStatus: string | null;
  statusDate: string | null;
  statusReason: string | null;
  departureReason: string | null;
  noticePeriodEnd: string | null;
  exitInterviewDone: boolean | null;
  department?: { id: string; name: string; location: string | null };
  departmentId?: string | null;
  position?: { id: string; title: string };
  positionId?: string | null;
}

interface Props {
  exitedEmployees: Employee[];
  employeesOnLeave: Employee[];
  activeEmployees: Employee[];
  departments: { id: string; name: string; location: string | null }[];
  positions: { id: string; title: string; departmentId: string | null }[];
  userRole: string;
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string; icon: any }> = {
  ACTIVE: { label: "Actif", color: "text-green-600", bgColor: "bg-green-100", icon: CheckCircle },
  ON_TRIAL: { label: "Période d'essai", color: "text-yellow-600", bgColor: "bg-yellow-100", icon: Clock },
  EN_CONGE: { label: "En congé", color: "text-blue-600", bgColor: "bg-blue-100", icon: Clock },
  SUSPENDED: { label: "Suspendu", color: "text-orange-600", bgColor: "bg-orange-100", icon: AlertTriangle },
  RESIGNED: { label: "Démission", color: "text-red-600", bgColor: "bg-red-100", icon: UserMinus },
  TERMINATED: { label: "Renvoyé", color: "text-red-700", bgColor: "bg-red-200", icon: XCircle },
  CONTRACT_ENDED: { label: "Fin contrat", color: "text-gray-600", bgColor: "bg-gray-100", icon: UserMinus },
  JOB_ABANDONMENT: { label: "Abandon poste", color: "text-purple-600", bgColor: "bg-purple-100", icon: AlertTriangle },
  MUTUAL_AGREEMENT: { label: "Rupture conv.", color: "text-indigo-600", bgColor: "bg-indigo-100", icon: UserMinus },
  RETIRED: { label: "Retraité", color: "text-teal-600", bgColor: "bg-teal-100", icon: CheckCircle },
};

const exitStatuses = ["RESIGNED", "TERMINATED", "CONTRACT_ENDED", "JOB_ABANDONMENT", "MUTUAL_AGREEMENT", "RETIRED"];

export default function ExitsClient({ exitedEmployees, employeesOnLeave, activeEmployees, departments, positions, userRole }: Props) {
  const [activeTab, setActiveTab] = useState<"exits" | "leaves" | "manage">("exits");
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [statusModalEmployee, setStatusModalEmployee] = useState<Employee | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const router = useRouter();

  const handleStatusChange = async (employeeId: string, newStatus: string, data: any) => {
    try {
      const res = await fetch(`/api/employees/${employeeId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, workStatus: newStatus }),
      });
      
      const result = await res.json();
      
      if (!res.ok) {
        toast.error(result.error || "Erreur lors du changement de statut");
        return false;
      }
      
      toast.success(result.message || "Statut mis à jour avec succès");
      router.refresh();
      setStatusModalEmployee(null);
      return true;
    } catch (e: any) {
      toast.error("Erreur: " + (e.message || "Une erreur est survenue"));
      return false;
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("fr-FR");
  };

  const allEmployees = [...exitedEmployees, ...activeEmployees];
  
  const filteredEmployees = allEmployees.filter((emp) => {
    const matchesSearch = search === "" || 
      `${emp.firstName} ${emp.lastName} ${emp.employeeNumber}`
        .toLowerCase()
        .includes(search.toLowerCase());
    
    const matchesStatus = filterStatus === "" || emp.workStatus === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const exitedFiltered = filteredEmployees.filter((emp) => exitStatuses.includes(emp.workStatus || ""));
  const activeFiltered = activeEmployees.filter((emp) => 
    search === "" || `${emp.firstName} ${emp.lastName} ${emp.employeeNumber}`.toLowerCase().includes(search.toLowerCase())
  );

  const statusCounts = exitStatuses.reduce((acc, status) => {
    acc[status] = exitedEmployees.filter(e => e.workStatus === status).length;
    return acc;
  }, {} as Record<string, number>);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  if (statusModalEmployee) {
    return (
      <StatusChangeModal
        employee={statusModalEmployee}
        onClose={() => setStatusModalEmployee(null)}
        onConfirm={handleStatusChange}
      />
    );
  }

  return (
    <motion.div 
      className="p-6 space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div className="flex items-center justify-between" variants={itemVariants}>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestion des sorties</h1>
          <p className="text-gray-500 text-sm mt-1">Gérez les départs et changements de statut des employés</p>
        </div>
        <button
          onClick={() => router.push("/employees")}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour aux employés
        </button>
      </motion.div>

      <motion.div variants={itemVariants}>
        <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg w-fit">
          <button
            onClick={() => setActiveTab("exits")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === "exits"
                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            Employés sortis ({exitedEmployees.length})
          </button>
          <button
            onClick={() => setActiveTab("leaves")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === "leaves"
                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            En congé ({employeesOnLeave.length})
          </button>
          <button
            onClick={() => setActiveTab("manage")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === "manage"
                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            Changer le statut ({activeEmployees.length})
          </button>
        </div>
      </motion.div>

      {activeTab === "exits" && (
        <>
          <motion.div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4" variants={itemVariants}>
            {exitStatuses.map((status) => {
              const config = statusConfig[status];
              const Icon = config.icon;
              return (
                <div 
                  key={status}
                  className={`p-4 rounded-lg ${config.bgColor} border border-opacity-20`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className={`w-4 h-4 ${config.color}`} />
                    <span className={`text-sm font-medium ${config.color}`}>{config.label}</span>
                  </div>
                  <p className={`text-2xl font-bold ${config.color}`}>{statusCounts[status] || 0}</p>
                </div>
              );
            })}
          </motion.div>

          <motion.div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700" variants={itemVariants}>
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Rechercher par nom, numéro..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0090D1] focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                  />
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0090D1] focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                >
                  <option value="">Tous les statuts</option>
                  {exitStatuses.map((status) => (
                    <option key={status} value={status}>{statusConfig[status].label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Employé</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Département</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Poste</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Statut sortie</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date sortie</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Motif</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {exitedFiltered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                        Aucun employé trouvé avec ces critères
                      </td>
                    </tr>
                  ) : (
                    exitedFiltered.map((emp) => {
                      const config = statusConfig[emp.workStatus || ""] || statusConfig.ACTIVE;
                      return (
                        <tr key={emp.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-[#0090D1]/10 flex items-center justify-center">
                                <span className="text-sm font-medium text-[#0090D1]">
                                  {emp.firstName[0]}{emp.lastName[0]}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">{emp.firstName} {emp.lastName}</p>
                                <p className="text-xs text-gray-500">{emp.employeeNumber}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{emp.department?.name || "—"}</td>
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{emp.position?.title || "—"}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.color}`}>
                              <config.icon className="w-3 h-3" />
                              {config.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{formatDate(emp.statusDate)}</td>
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 max-w-xs truncate">{emp.statusReason || emp.departureReason || "—"}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        </>
      )}

      {activeTab === "leaves" && (
        <motion.div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700" variants={itemVariants}>
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Employés en congé</h3>
                <p className="text-sm text-gray-500 mt-1">Ces employés sont automatiquement remis actifs à la fin de leur congé</p>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                <span className="text-2xl font-bold text-blue-600">{employeesOnLeave.length}</span>
              </div>
            </div>
          </div>
          
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {employeesOnLeave.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                Aucun employé en congé actuellement
              </div>
            ) : (
              employeesOnLeave.map((emp) => (
                <div key={emp.id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">
                        {emp.firstName[0]}{emp.lastName[0]}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{emp.firstName} {emp.lastName}</p>
                      <p className="text-xs text-gray-500">{emp.department?.name || "—"} · {emp.position?.title || "—"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-600">
                      <Clock className="w-3 h-3" />
                      En congé
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      )}

      {activeTab === "manage" && userRole === "ADMIN_RH" && (
        <motion.div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700" variants={itemVariants}>
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un employé pour changer son statut..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0090D1] focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
              />
            </div>
          </div>

          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {activeFiltered.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                Aucun employé actif trouvé
              </div>
            ) : (
              activeFiltered.map((emp) => {
                const config = statusConfig[emp.workStatus || "ACTIVE"] || statusConfig.ACTIVE;
                return (
                  <div key={emp.id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#0090D1]/10 flex items-center justify-center">
                        <span className="text-sm font-medium text-[#0090D1]">
                          {emp.firstName[0]}{emp.lastName[0]}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{emp.firstName} {emp.lastName}</p>
                        <p className="text-xs text-gray-500">{emp.department?.name || "—"} · {emp.position?.title || "—"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.color}`}>
                        {config.label}
                      </span>
                      <button
                        onClick={() => setStatusModalEmployee(emp)}
                        className="px-3 py-1.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                      >
                        Changer le statut
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </motion.div>
      )}

      {activeTab === "manage" && userRole !== "ADMIN_RH" && (
        <motion.div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4" variants={itemVariants}>
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              Seul le service RH peut modifier le statut des employés.
            </p>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
