"use client";
// src/components/employees/EditEmployeeModal.tsx
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, Loader2 } from "lucide-react";
import { toast } from "sonner";

const employeeSchema = z.object({
  firstName: z.string().min(2, "Minimum 2 caractères"),
  lastName: z.string().min(2, "Minimum 2 caractères"),
  workEmail: z.string().email("Email invalide").optional().or(z.literal("")),
  phone: z.string().optional(),
  cin: z.string().optional(),
  contractType: z.enum(["CDI", "CDD", "STAGE", "CONSULTANT"]),
  startDate: z.string().min(1, "Date de début requise"),
  endDate: z.string().optional(),
  departmentId: z.string().optional(),
  managerId: z.string().optional(),
  baseSalary: z.string().min(1, "Salaire requis"),
  isActive: z.boolean().optional(),
});

type EmployeeForm = z.infer<typeof employeeSchema>;

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
  baseSalary: string;
  isActive: boolean;
  departmentId?: string | null;
  positionId?: string | null;
  managerId?: string | null;
}

interface Props {
  employee: Employee;
  departments: { id: string; name: string }[];
  positions: { id: string; title: string; departmentId: string | null }[];
  managers: { id: string; firstName: string; lastName: string }[];
  onClose: () => void;
  onSuccess: () => void;
}

export function EditEmployeeModal({ employee, departments, positions, managers, onClose, onSuccess }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<EmployeeForm>({
    resolver: zodResolver(employeeSchema),
    mode: "onBlur",
    defaultValues: {
      firstName: employee.firstName,
      lastName: employee.lastName,
      workEmail: employee.workEmail || "",
      phone: employee.phone || "",
      cin: employee.cin || "",
      contractType: employee.contractType as "CDI" | "CDD" | "STAGE" | "CONSULTANT",
      startDate: employee.startDate ? employee.startDate.split("T")[0] : "",
      endDate: employee.endDate ? employee.endDate.split("T")[0] : "",
      departmentId: employee.departmentId || "",
      managerId: employee.managerId || "",
      baseSalary: employee.baseSalary,
      isActive: employee.isActive,
    },
  });

  const onSubmit = async (data: EmployeeForm) => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/employees/${employee.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          contractEnd: data.endDate,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Erreur lors de la mise à jour");
      }

      toast.success("Membre mis à jour avec succès !");
      onSuccess();
    } catch (e: any) {
      toast.error("Erreur : " + e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Voulez-vous vraiment supprimer ${employee.firstName} ${employee.lastName} ?`)) {
      return;
    }
    
    try {
      const res = await fetch(`/api/employees/${employee.id}`, { 
        method: "DELETE",
        headers: { "Content-Type": "application/json" }
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur lors de la suppression");
      }
      
      toast.success("Membre supprimé avec succès");
      onSuccess();
    } catch (e: any) {
      toast.error("Erreur: " + e.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white font-outfit">Modifier le membre</h2>
            <p className="text-xs text-gray-500">Matricule: {employee.employeeNumber}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Prénom *</label>
              <input {...register("firstName")}
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-[#0090D1]" />
              {errors.firstName && <p className="text-xs text-red-500 mt-1">{errors.firstName.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Nom *</label>
              <input {...register("lastName")}
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-[#0090D1]" />
              {errors.lastName && <p className="text-xs text-red-500 mt-1">{errors.lastName.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Email professionnel</label>
              <input {...register("workEmail")} type="email"
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-[#0090D1]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Téléphone</label>
              <input {...register("phone")}
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-[#0090D1]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">N° CIN</label>
              <input {...register("cin")}
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-[#0090D1]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Type de contrat *</label>
              <select {...register("contractType")}
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-[#0090D1]">
                {["CDI", "CDD", "STAGE", "CONSULTANT"].map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Projet</label>
              <select {...register("departmentId")}
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-[#0090D1]">
                <option value="">Sélectionner</option>
                {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Supérieur hiérarchique</label>
              <select {...register("managerId")}
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-[#0090D1]">
                <option value="">Sélectionner</option>
                {managers.map((m) => <option key={m.id} value={m.id}>{m.firstName} {m.lastName}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Date début contrat *</label>
              <input {...register("startDate")} type="date"
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-[#0090D1]" />
              {errors.startDate && <p className="text-xs text-red-500 mt-1">{errors.startDate.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Date fin (CDD)</label>
              <input {...register("endDate")} type="date"
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-[#0090D1]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Salaire de base (FCFA) *</label>
              <input {...register("baseSalary")} type="number" min="0"
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-[#0090D1]" />
              {errors.baseSalary && <p className="text-xs text-red-500 mt-1">{errors.baseSalary.message}</p>}
            </div>
            <div className="flex items-center">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" {...register("isActive")} defaultChecked={employee.isActive} 
                  className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Membre actif</span>
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
            <button type="button" onClick={handleDelete}
              className="px-4 py-2.5 text-sm font-medium text-red-600 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
              Supprimer
            </button>
            <div className="flex-1 flex gap-3">
              <button type="button" onClick={onClose}
                className="flex-1 px-4 py-2.5 text-sm font-medium border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                Annuler
              </button>
              <button type="submit" disabled={isSubmitting}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium bg-[#0090D1] hover:bg-[#007ab8] text-white rounded-lg transition-colors disabled:opacity-60">
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {isSubmitting ? "Mise à jour..." : "Mettre à jour"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
