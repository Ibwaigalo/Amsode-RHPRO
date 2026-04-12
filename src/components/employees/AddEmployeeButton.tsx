"use client";
// src/components/employees/AddEmployeeButton.tsx
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, X, Loader2, Heart, Users, User, MapPin, Phone } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { ChargeCalculatorInline, MARITAL_STATUS_OPTIONS, MaritalStatus } from "@/components/payroll/ChargeCalculator";

const employeeSchema = z.object({
  firstName: z.string().min(2, "Minimum 2 caractères"),
  lastName: z.string().min(2, "Minimum 2 caractères"),
  workEmail: z.string().email("Email invalide").optional().or(z.literal("")),
  personalEmail: z.string().email("Email invalide").optional().or(z.literal("")),
  phone: z.string().optional(),
  cin: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(["M", "F"]).optional(),
  nationality: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  zone: z.string().optional(),
  statutMatrimonial: z.enum(["Célibataire", "Marié", "Veuf/Veuve", "Divorcé/Séparé"], {
    required_error: "Statut matrimonial requis",
  }),
  nbEnfantsCharge: z.number().min(0).max(10).default(0),
  emergencyContact: z.string().optional(),
  emergencyPhone: z.string().optional(),
  contractType: z.enum(["CDI", "CDD", "STAGE", "CONSULTANT"]),
  startDate: z.string().min(1, "Date de début requise"),
  endDate: z.string().optional(),
  departmentId: z.string().optional(),
  positionId: z.string().optional(),
  managerId: z.string().optional(),
  baseSalary: z.string().min(1, "Salaire requis"),
  role: z.enum(["EMPLOYE", "MANAGER", "ADMIN_RH"]).default("EMPLOYE"),
  createAccount: z.boolean().default(true),
});

type EmployeeForm = z.infer<typeof employeeSchema>;

interface Props {
  departments: { id: string; name: string }[];
  positions: { id: string; title: string; departmentId: string | null }[];
  managers: { id: string; firstName: string; lastName: string }[];
}

export function AddEmployeeButton({ departments, positions, managers }: Props) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  
  const { register, handleSubmit, watch, formState: { errors, isSubmitting }, reset, setValue } = useForm<EmployeeForm>({
    resolver: zodResolver(employeeSchema),
    mode: "onBlur",
    defaultValues: { 
      contractType: "CDI",
      statutMatrimonial: "Célibataire",
      nbEnfantsCharge: 0,
      city: "Bamako",
      zone: "Bamako",
      nationality: "Malienne",
      role: "EMPLOYE",
    },
  });

  const watchedBaseSalary = watch("baseSalary");
  const watchedStatut = watch("statutMatrimonial");
  const watchedEnfants = watch("nbEnfantsCharge");

  const onSubmit = async (data: EmployeeForm) => {
    try {
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      const result = await res.json();
      
      if (!res.ok) throw new Error(result.error || await res.text());
      
      if (data.createAccount && result.userAccount) {
        toast.success(`Membre ajouté ! Compte créé : ${result.userAccount.email}`);
      } else {
        toast.success("Membre ajouté avec succès !");
      }
      
      reset();
      setOpen(false);
      router.refresh();
    } catch (e: any) {
      toast.error("Erreur : " + e.message);
    }
  };

  // Parser le salaire pour affichage du calculateur
  const salaryValue = parseFloat(watchedBaseSalary) || 0;

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-[#0090D1] hover:bg-[#007ab8] text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
      >
        <Plus className="w-4 h-4" /> Nouveau membre
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[95vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white font-outfit">Ajouter un membre</h2>
          <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
          {/* Section identité */}
          <div>
            <h3 className="text-sm font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide mb-3">Informations personnelles</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Prénom *</label>
                <input {...register("firstName")}
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-[#0090D1]"
                  placeholder="Aminata" />
                {errors.firstName && <p className="text-xs text-red-500 mt-1">{errors.firstName.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Nom *</label>
                <input {...register("lastName")}
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-[#0090D1]"
                  placeholder="Coulibaly" />
                {errors.lastName && <p className="text-xs text-red-500 mt-1">{errors.lastName.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Email professionnel</label>
                <input {...register("workEmail")} type="email"
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-[#0090D1]"
                  placeholder="a.coulibaly@amsode.ml" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Email personnel</label>
                <input {...register("personalEmail")} type="email"
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-[#0090D1]"
                  placeholder="aminata@gmail.com" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Téléphone</label>
                <input {...register("phone")}
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-[#0090D1]"
                  placeholder="+223 70 00 00 00" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">N° CIN</label>
                <input {...register("cin")}
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-[#0090D1]"
                  placeholder="ML–..." />
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
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-[#0090D1]"
                  placeholder="Malienne" />
              </div>
              {/* AJOUT: Statut matrimonial */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <Heart className="w-3 h-3 inline mr-1" />
                  Statut Matrimonial *
                </label>
                <select {...register("statutMatrimonial")}
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-[#0090D1]">
                  {MARITAL_STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.icon} {opt.label}
                    </option>
                  ))}
                </select>
                {errors.statutMatrimonial && <p className="text-xs text-red-500 mt-1">{errors.statutMatrimonial.message}</p>}
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
                  placeholder="0" 
                />
                <span className="text-xs text-gray-400">+5% abattement par enfant (max 25%)</span>
              </div>
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
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-[#0090D1]"
                  placeholder="Quartier, rue..." />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Ville</label>
                <input {...register("city")}
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-[#0090D1]"
                  placeholder="Bamako" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Zone</label>
                <input {...register("zone")}
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-[#0090D1]"
                  placeholder="Hamdallaye" />
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
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-[#0090D1]"
                  placeholder="Nom complet" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Téléphone d&apos;urgence</label>
                <input {...register("emergencyPhone")}
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-[#0090D1]"
                  placeholder="+223 70 00 00 00" />
              </div>
            </div>
          </div>

          {/* Section contrat */}
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
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Zone d&apos;affectation</label>
                <input {...register("zone")}
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-[#0090D1]"
                  placeholder="Hamdallaye, ACI 2000..." />
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
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Salaire de base (FCFA) *</label>
                <input {...register("baseSalary")} type="number" min="0"
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-[#0090D1]"
                  placeholder="250000" />
                {errors.baseSalary && <p className="text-xs text-red-500 mt-1">{errors.baseSalary.message}</p>}
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Rôle dans le système</label>
                <select {...register("role")}
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-[#0090D1]">
                  <option value="EMPLOYE">Employé</option>
                  <option value="MANAGER">Manager</option>
                  <option value="ADMIN_RH">Administrateur RH</option>
                </select>
                <span className="text-xs text-gray-400 mt-1 block">
                  Détermine les droits d&apos;accès de l&apos;employé
                </span>
              </div>
            </div>
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

          {/* Option création compte */}
          <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-100 dark:border-green-800">
            <input {...register("createAccount")} type="checkbox" id="createAccount" className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500" />
            <label htmlFor="createAccount" className="text-sm text-green-800 dark:text-green-300">
              Créer un compte de connexion pour l&apos;employé
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setOpen(false)}
              className="flex-1 px-4 py-2.5 text-sm font-medium border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              Annuler
            </button>
            <button type="submit" disabled={isSubmitting}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium bg-[#0090D1] hover:bg-[#007ab8] text-white rounded-lg transition-colors disabled:opacity-60">
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSubmitting ? "Création..." : "Créer le membre"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}