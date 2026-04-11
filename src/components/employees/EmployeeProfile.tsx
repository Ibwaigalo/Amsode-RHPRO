"use client";
// src/components/employees/EmployeeProfile.tsx
import { ReactNode, useEffect, useRef } from 'react';
import { X, Mail, Phone, MapPin, Calendar, User, FileText, Award, AlertCircle, Heart, Users } from "lucide-react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { ChargeCalculator, MARITAL_STATUS_OPTIONS } from "@/components/payroll/ChargeCalculator";

interface Employee {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  workEmail: string | null;
  phone: string | null;
  personalEmail: string | null;
  cin: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  nationality: string | null;
  address: string | null;
  city: string | null;
  zone: string | null;
  photoUrl: string | null;
  contractType: string;
  startDate: string;
  endDate: string | null;
  baseSalary: string;
  statutMatrimonial?: string | null;
  nbEnfantsCharge?: number | null;
  chargesInps?: string | null;
  chargesAmo?: string | null;
  chargesIts?: string | null;
  salaireNet?: string | null;
  isActive: boolean;
  leaveBalance: number | null;
  emergencyContact: string | null;
  emergencyPhone: string | null;
  department?: { id: string; name: string; location: string | null };
  position?: { id: string; title: string };
  manager?: { id: string; firstName: string; lastName: string } | null;
}

interface Props {
  employee: Employee;
  onClose: () => void;
  userRole: string;
}

const CONTRACT_COLORS: Record<string, string> = {
  CDI: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  CDD: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  STAGE: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  CONSULTANT: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
};

export function EmployeeProfile({ employee, onClose, userRole }: Props) {
  const profileRef = useRef<HTMLDivElement>(null);
  const prevEmployeeId = useRef<string | null>(null);
  
  useEffect(() => {
    if (prevEmployeeId.current !== employee.id) {
      prevEmployeeId.current = employee.id;
      setTimeout(() => {
        if (profileRef.current) {
          profileRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  }, [employee.id]);
  
  const formatSalary = (s: string) =>
    new Intl.NumberFormat("fr-ML", { style: "currency", currency: "XOF", maximumFractionDigits: 0 }).format(parseFloat(s));

  const formatDate = (date: string | null) => {
    if (!date) return "—";
    try {
      return format(parseISO(date), "dd MMMM yyyy", { locale: fr });
    } catch {
      return date;
    }
  };

  const getAge = (dateOfBirth: string | null) => {
    if (!dateOfBirth) return null;
    try {
      const birth = parseISO(dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      return age;
    } catch {
      return null;
    }
  };

  const age = getAge(employee.dateOfBirth);

  return (
    <div ref={profileRef} className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Fiche Membre
        </h1>
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Profile card */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-6">
          <div className="text-center">
            <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-3xl font-bold mb-4">
              {employee.photoUrl ? (
                <img src={employee.photoUrl} alt="" className="w-24 h-24 rounded-full object-cover" />
              ) : (
                `${employee.firstName[0]}${employee.lastName[0]}`
              )}
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {employee.firstName} {employee.lastName}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {employee.position?.title || "Sans poste"}
            </p>
            <div className="mt-3 flex items-center justify-center gap-2">
              <span className={`text-xs px-3 py-1 rounded-full font-medium ${CONTRACT_COLORS[employee.contractType] || "bg-gray-100 text-gray-700"}`}>
                {employee.contractType}
              </span>
              <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                employee.isActive 
                  ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" 
                  : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
              }`}>
                {employee.isActive ? "Actif" : "Inactif"}
              </span>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {employee.workEmail && (
              <div className="flex items-center gap-3 text-sm">
                <Mail className="w-4 h-4 text-gray-400" />
                <a href={`mailto:${employee.workEmail}`} className="text-blue-600 hover:underline">
                  {employee.workEmail}
                </a>
              </div>
            )}
            {employee.phone && (
              <div className="flex items-center gap-3 text-sm">
                <Phone className="w-4 h-4 text-gray-400" />
                <a href={`tel:${employee.phone}`} className="text-gray-700 dark:text-gray-300">
                  {employee.phone}
                </a>
              </div>
            )}
            {employee.zone && (
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span className="text-gray-700 dark:text-gray-300">{employee.zone}</span>
              </div>
            )}
          </div>

          <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800">
            <p className="text-xs text-gray-500 text-center">
              Membre depuis le {formatDate(employee.startDate)}
            </p>
          </div>
        </div>

        {/* Right columns - Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Info sections */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              Informations personnelles
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <InfoItem label="Matricule" value={employee.employeeNumber} />
              <InfoItem label="CIN" value={employee.cin || "—"} />
              <InfoItem label="Date de naissance" value={formatDate(employee.dateOfBirth)} />
              <InfoItem label="Âge" value={age ? `${age} ans` : "—"} />
              <InfoItem label="Sexe" value={employee.gender === "M" ? "Masculin" : employee.gender === "F" ? "Féminin" : "—"} />
              <InfoItem label="Nationalité" value={employee.nationality || "Malienne"} />
              <InfoItem label="Email personnel" value={employee.personalEmail || "—"} />
              <InfoItem label="Adresse" value={employee.address || "—"} />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-blue-600" />
              Affectation
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <InfoItem label="Projet" value={employee.department?.name || "—"} />
              <InfoItem label="Poste" value={employee.position?.title || "—"} />
              <InfoItem label="Supérieur hiérarchique" value={employee.manager ? `${employee.manager.firstName} ${employee.manager.lastName}` : "—"} />
              <InfoItem label="Zone d'affectation" value={employee.zone || "—"} />
              <InfoItem label="Ville" value={employee.city || "—"} />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Contrat & Rémunération
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <InfoItem label="Type de contrat" value={employee.contractType} />
              <InfoItem label="Date de début" value={formatDate(employee.startDate)} />
              <InfoItem label="Date de fin" value={formatDate(employee.endDate)} />
              <InfoItem label="Solde congés" value={employee.leaveBalance !== null ? `${employee.leaveBalance} jours` : "—"} />
              {/* AJOUT: Statut matrimonial et enfants à charge */}
              <InfoItem 
                label="Statut matrimonial" 
                value={(
                  <span className="flex items-center gap-1">
                    {employee.statutMatrimonial === 'Marié' ? '💑 ' : employee.statutMatrimonial === 'Veuf/Veuve' ? '🕯️ ' : employee.statutMatrimonial === 'Divorcé/Séparé' ? '📋 ' : '👤 '}
                    {employee.statutMatrimonial || 'Célibataire'}
                  </span>
                )} 
              />
              <InfoItem 
                label="Enfants à charge" 
                value={(
                  <span className="flex items-center gap-1">
                    👶 {employee.nbEnfantsCharge || 0}
                  </span>
                )} 
              />
              {/* Fin AJOUT */}
              <div className="col-span-2">
                <p className="text-xs text-gray-500 mb-1">Salaire de base</p>
                <p className="text-xl font-bold text-green-600">{formatSalary(employee.baseSalary)}</p>
              </div>
            </div>
          </div>

          {/* AJOUT: Charges Breakdown */}
          {parseFloat(employee.baseSalary) > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-600" />
                Détail Charges Sociales Mali 2026
              </h3>
              <ChargeCalculator
                salaryBrut={parseFloat(employee.baseSalary)}
                statutMatrimonial={(employee.statutMatrimonial as any) || 'Célibataire'}
                nbEnfantsCharge={employee.nbEnfantsCharge || 0}
                showDetails={true}
              />
            </div>
          )}

          {(employee.emergencyContact || employee.emergencyPhone) && (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                Contact d&apos;urgence
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <InfoItem label="Nom" value={employee.emergencyContact || "—"} />
                <InfoItem label="Téléphone" value={employee.emergencyPhone || "—"} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-sm font-medium text-gray-900 dark:text-white">{value}</p>
    </div>
  );
}

function Briefcase({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
    </svg>
  );
}
