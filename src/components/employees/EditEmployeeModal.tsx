"use client";
// src/components/employees/EditEmployeeModal.tsx
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, Loader2, Heart, Users, MapPin, Phone } from "lucide-react";
import { toast } from "sonner";
import { ChargeCalculatorInline, MARITAL_STATUS_OPTIONS, MaritalStatus } from "@/components/payroll/ChargeCalculator";

const employeeSchema = z.object({
  firstName: z.string().min(2).optional(),
  lastName: z.string().min(2).optional(),
  workEmail: z.string().email().optional().or(z.literal("")),
  personalEmail: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  cin: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(["M", "F"]).optional(),
  nationality: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  zone: z.string().optional(),
  statutMatrimonial: z.enum(["Célibataire", "Marié", "Veuf/Veuve", "Divorcé/Séparé"]).optional(),
  nbEnfantsCharge: z.number().min(0).max(10).optional(),
  emergencyContact: z.string().optional(),
  emergencyPhone: z.string().optional(),
  positionId: z.string().uuid().optional().or(z.literal("")),
  contractType: z.enum(["CDI", "CDD", "STAGE", "CONSULTANT"]).optional(),
  startDate: z.string().optional(),
  contractEnd: z.string().optional(),
  departmentId: z.string().uuid().optional().or(z.literal("")),
  managerId: z.string().uuid().optional().or(z.literal("")),
  baseSalary: z.string().optional(),
  role: z.enum(["EMPLOYE", "MANAGER", "ADMIN_RH"]).optional(),
  isActive: z.boolean().optional(),
  bloodGroup: z.string().optional(),
  educationLevel: z.string().optional(),
  fieldOfStudy: z.string().optional(),
  firstContractDate: z.string().optional(),
  contractRenewals: z.number().min(0).optional(),
  globalSalaryCost: z.string().min(1, "Coût salarial global requis"),
  inpsNumber: z.string().optional(),
  amoNumber: z.string().optional(),
  departureReason: z.string().optional(),
});

type EmployeeForm = z.infer<typeof employeeSchema>;

interface Employee {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  workEmail: string | null;
  personalEmail: string | null;
  phone: string | null;
  cin: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  nationality: string | null;
  address: string | null;
  city: string | null;
  zone: string | null;
  statutMatrimonial: string | null;
  nbEnfantsCharge: number | null;
  emergencyContact: string | null;
  emergencyPhone: string | null;
  contractType: string;
  startDate: string;
  endDate: string | null;
  globalSalaryCost?: string | null;
  isActive: boolean;
  role?: string | null;
  departmentId?: string | null;
  positionId?: string | null;
  managerId?: string | null;
  manager?: { id: string; firstName: string; lastName: string } | null;
  bloodGroup?: string | null;
  educationLevel?: string | null;
  fieldOfStudy?: string | null;
  firstContractDate?: string | null;
  contractRenewals?: number | null;
  inpsNumber?: string | null;
  amoNumber?: string | null;
  departureReason?: string | null;
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

  const { register, handleSubmit, watch, formState: { errors }, reset } = useForm<EmployeeForm>({
    resolver: zodResolver(employeeSchema),
    mode: "onBlur",
    defaultValues: {
      firstName: employee.firstName,
      lastName: employee.lastName,
      workEmail: employee.workEmail || "",
      personalEmail: employee.personalEmail || "",
      phone: employee.phone || "",
      cin: employee.cin || "",
      dateOfBirth: employee.dateOfBirth ? employee.dateOfBirth.split("T")[0] : "",
      gender: employee.gender as "M" | "F" | undefined,
      nationality: employee.nationality || "",
      address: employee.address || "",
      city: employee.city || "",
      zone: employee.zone || "",
      statutMatrimonial: (employee.statutMatrimonial as any) || "Célibataire",
      nbEnfantsCharge: employee.nbEnfantsCharge || 0,
      emergencyContact: employee.emergencyContact || "",
      emergencyPhone: employee.emergencyPhone || "",
      positionId: employee.positionId || "",
      contractType: employee.contractType as "CDI" | "CDD" | "STAGE" | "CONSULTANT",
      startDate: employee.startDate ? employee.startDate.split("T")[0] : "",
      contractEnd: employee.endDate ? employee.endDate.split("T")[0] : "",
      departmentId: employee.departmentId || "",
      managerId: employee.managerId || "",
      globalSalaryCost: employee.globalSalaryCost || employee.globalSalaryCost || "",
      role: (employee.role as "EMPLOYE" | "MANAGER" | "ADMIN_RH") || "EMPLOYE",
      isActive: employee.isActive,
      bloodGroup: employee.bloodGroup || "",
      educationLevel: employee.educationLevel || "",
      fieldOfStudy: employee.fieldOfStudy || "",
      firstContractDate: employee.firstContractDate ? employee.firstContractDate.split("T")[0] : "",
      contractRenewals: employee.contractRenewals || 0,
      inpsNumber: employee.inpsNumber || "",
      amoNumber: employee.amoNumber || "",
      departureReason: employee.departureReason || "",
    },
  });

  const watchedGlobalSalaryCost = watch("globalSalaryCost");
  const watchedStatut = watch("statutMatrimonial");
  const watchedEnfants = watch("nbEnfantsCharge");
  const salaryValue = parseFloat(watchedGlobalSalaryCost || "0") || 0;

  const onSubmit = async (data: EmployeeForm) => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/employees/${employee.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          contractEnd: data.contractEnd,
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
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[95vh] overflow-y-auto">
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
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Email personnel</label>
              <input {...register("personalEmail")} type="email"
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
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Date de naissance</label>
              <input {...register("dateOfBirth")} type="date"
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-[#0090D1]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Sexe</label>
              <select {...register("gender")}
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-[#0090D1]">
                <option value="">Choisir</option>
                <option value="M">Masculin</option>
                <option value="F">Féminin</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Nationalité</label>
              <input {...register("nationality")}
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-[#0090D1]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                <Heart className="w-3 h-3 inline mr-1" />
                Statut Matrimonial
              </label>
              <select {...register("statutMatrimonial")}
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-[#0090D1]">
                {MARITAL_STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.icon} {opt.label}
                  </option>
                ))}
              </select>
            </div>
            {/* AJOUT: Nombre d'enfants */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                <Users className="w-3 h-3 inline mr-1" />
                Enfants à charge
              </label>
              <input 
                {...register("nbEnfantsCharge", { valueAsNumber: true })}
                type="number" 
                min="0" 
                max="10"
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-[#0090D1]"
              />
              <span className="text-xs text-gray-400">+5% abattement/enfant</span>
            </div>
          </div>

          {/* Section Adresse */}
          <div>
            <h3 className="text-sm font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide mb-3">
              <MapPin className="w-4 h-4 inline mr-1" /> Adresse & Localisation
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Adresse</label>
                <input {...register("address")}
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-[#0090D1]" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Ville</label>
                <input {...register("city")}
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-[#0090D1]" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Zone</label>
                <input {...register("zone")}
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-[#0090D1]" />
              </div>
            </div>
          </div>

          {/* Section Formation */}
          <div>
            <h3 className="text-sm font-semibold text-purple-700 dark:text-purple-400 uppercase tracking-wide mb-3">
              Formation & Qualifications
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Groupe sanguin</label>
                <select {...register("bloodGroup")}
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-[#0090D1]">
                  <option value="">Choisir</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Niveau d&apos;étude</label>
                <select {...register("educationLevel")}
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-[#0090D1]">
                  <option value="">Choisir</option>
                  <option value="CEP">CEP</option>
                  <option value="BEPC">BEPC</option>
                  <option value="BAC">Baccalauréat</option>
                  <option value="BAC+1">BAC+1</option>
                  <option value="BAC+2">BAC+2 (BTS/DUT)</option>
                  <option value="BAC+3">BAC+3 (Licence)</option>
                  <option value="BAC+4">BAC+4 (Maîtrise)</option>
                  <option value="BAC+5">BAC+5 (Master)</option>
                  <option value="BAC+6+">Doctorat / BAC+6+</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Domaine d&apos;étude</label>
                <input {...register("fieldOfStudy")}
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-[#0090D1]" />
              </div>
            </div>
          </div>

          {/* Section Contact d'urgence */}
          <div>
            <h3 className="text-sm font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide mb-3">
              <Phone className="w-4 h-4 inline mr-1" /> Contact d&apos;urgence
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Nom du contact</label>
                <input {...register("emergencyContact")}
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-[#0090D1]" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Téléphone d&apos;urgence</label>
                <input {...register("emergencyPhone")}
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-[#0090D1]" />
              </div>
            </div>
          </div>

          {/* Section Contrat */}
          <div>
            <h3 className="text-sm font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide mb-3">Contrat & Affectation</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Type de contrat *</label>
                <select {...register("contractType")}
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-[#0090D1]">
                  {["CDI", "CDD", "STAGE", "CONSULTANT"].map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Poste</label>
                <select {...register("positionId")}
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-[#0090D1]">
                  <option value="">Sélectionner</option>
                  {positions.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
                </select>
              </div>
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
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Date d&apos;entrée (1er contrat)</label>
              <input {...register("firstContractDate")} type="date"
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-[#0090D1]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Date début contrat *</label>
              <input {...register("startDate")} type="date"
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-[#0090D1]" />
              {errors.startDate && <p className="text-xs text-red-500 mt-1">{errors.startDate.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Date fin (CDD)</label>
              <input {...register("contractEnd")} type="date"
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-[#0090D1]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Nbre renouvellements</label>
              <input {...register("contractRenewals", { valueAsNumber: true })} type="number" min="0"
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-[#0090D1]" />
            </div>
            <div className="col-span-2 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">N° INPS</label>
                <input {...register("inpsNumber")}
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-[#0090D1]" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">N° AMO</label>
                <input {...register("amoNumber")}
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-[#0090D1]" />
              </div>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Coût salarial global (FCFA) *</label>
              <input {...register("globalSalaryCost")} type="number" min="0"
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-[#0090D1]" />
              {errors.globalSalaryCost && <p className="text-xs text-red-500 mt-1">{errors.globalSalaryCost.message}</p>}
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Rôle dans le système</label>
              <select {...register("role")}
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-[#0090D1]">
                <option value="EMPLOYE">Employé</option>
                <option value="MANAGER">Manager</option>
                <option value="ADMIN_RH">Administrateur RH</option>
              </select>
            </div>
            <div className="col-span-2 flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" {...register("isActive")} defaultChecked={employee.isActive} 
                  className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Membre actif</span>
              </label>
            </div>
            {!employee.isActive && (
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Motif de départ</label>
                <input {...register("departureReason")}
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-[#0090D1]" />
              </div>
            )}
          </div>

          {/* AJOUT: Calculateur de charges en temps réel */}
          {salaryValue > 0 && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-100 dark:border-blue-800">
              <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-3">
                💰 Aperçu du salaire net (Charges Mali 2026)
              </h4>
              <ChargeCalculatorInline
                salaryBrut={salaryValue}
                statutMatrimonial={(watchedStatut as MaritalStatus) || "Célibataire"}
                nbEnfantsCharge={watchedEnfants || 0}
              />
            </div>
          )}

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