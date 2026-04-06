"use client";
// src/components/employees/EmployeesTable.tsx
import { Download, Eye, Edit2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Employee {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  workEmail: string | null;
  phone: string | null;
  personalEmail?: string | null;
  cin?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  nationality?: string | null;
  address?: string | null;
  city?: string | null;
  zone?: string | null;
  photoUrl: string | null;
  contractType: string;
  startDate: string;
  endDate: string | null;
  baseSalary: string;
  isActive: boolean;
  leaveBalance?: number | null;
  emergencyContact?: string | null;
  emergencyPhone?: string | null;
  departmentName: string | null;
  positionTitle: string | null;
  department?: { id: string; name: string; location: string | null };
  departmentId?: string | null;
  position?: { id: string; title: string };
  positionId?: string | null;
  managerId?: string | null;
}

const CONTRACT_COLORS: Record<string, string> = {
  CDI: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  CDD: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  STAGE: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  CONSULTANT: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
};

interface Props {
  employees: Employee[];
  departments: { id: string; name: string; location: string | null }[];
  total: number;
  page: number;
  pageSize: number;
  searchParams: { q?: string; department?: string; contract?: string };
  onViewProfile: (employee: Employee) => void;
  onEdit: (employee: Employee) => void;
  onDelete: (employee: Employee) => void;
}

export function EmployeesTable({ employees, departments, total, page, pageSize, searchParams, onViewProfile, onEdit, onDelete }: Props) {
  const formatSalary = (s: string) =>
    new Intl.NumberFormat("fr-ML", { style: "currency", currency: "XOF", maximumFractionDigits: 0 }).format(parseFloat(s));

  const isExpiringSoon = (endDate: string | null): boolean => {
    if (!endDate) return false;
    const diff = new Date(endDate).getTime() - Date.now();
    return diff > 0 && diff < 30 * 24 * 60 * 60 * 1000;
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full data-table">
          <thead>
            <tr>
              <th className="text-left">Membre</th>
              <th className="text-left">Poste / Projet</th>
              <th className="text-left">Zone</th>
              <th className="text-left">Contrat</th>
              <th className="text-left">Salaire</th>
              <th className="text-left">Statut</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {employees.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-gray-400">
                  Aucun membre trouvé
                </td>
              </tr>
            ) : (
              employees.map((emp) => (
                <tr key={emp.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {emp.photoUrl
                          ? <img src={emp.photoUrl} alt="" className="w-9 h-9 rounded-full object-cover" />
                          : `${emp.firstName[0]}${emp.lastName[0]}`
                        }
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white text-sm">{emp.firstName} {emp.lastName}</p>
                        <p className="text-xs text-gray-500">{emp.employeeNumber}{emp.workEmail ? ` • ${emp.workEmail}` : ""}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{emp.positionTitle || "—"}</p>
                    <p className="text-xs text-gray-500">{emp.departmentName || "—"}</p>
                  </td>
                  <td>
                    <span className="text-sm text-gray-700 dark:text-gray-300">{emp.zone || "—"}</span>
                  </td>
                  <td>
                    <div className="space-y-1">
                      <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", CONTRACT_COLORS[emp.contractType] || "bg-gray-100 text-gray-700")}>
                        {emp.contractType}
                      </span>
                      {isExpiringSoon(emp.endDate) && (
                        <p className="text-xs text-red-500 font-medium">⚠ Expire bientôt</p>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatSalary(emp.baseSalary)}
                    </span>
                  </td>
                  <td>
                    <span className={cn("text-xs px-2 py-1 rounded-full font-medium",
                      emp.isActive ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300")}>
                      {emp.isActive ? "Actif" : "Inactif"}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center justify-end gap-1">
                      <button 
                        onClick={() => onViewProfile(emp)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                        title="Voir fiche"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => onEdit(emp)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
                        title="Modifier"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => onDelete(emp)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
