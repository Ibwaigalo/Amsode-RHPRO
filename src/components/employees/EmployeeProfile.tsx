"use client";
// src/components/employees/EmployeeProfile.tsx
import { ReactNode, useEffect, useRef } from 'react';
import { X, Mail, Phone, MapPin, Calendar, User, FileText, Award, AlertCircle, Heart, Users, Printer, Download, UserMinus, Clock, CheckCircle } from "lucide-react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { ChargeCalculator, MARITAL_STATUS_OPTIONS } from "@/components/payroll/ChargeCalculator";

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
  photoUrl: string | null;
  contractType: string;
  startDate: string;
  endDate: string | null;
  baseSalary: string;
  globalSalaryCost?: string | null;
  statutMatrimonial?: string | null;
  nbEnfantsCharge?: number | null;
  chargesInps?: string | null;
  chargesAmo?: string | null;
  chargesIts?: string | null;
  salaireNet?: string | null;
  isActive: boolean;
  role?: string | null;
  leaveBalance: number | null;
  emergencyContact: string | null;
  emergencyPhone: string | null;
  department?: { id: string; name: string; location: string | null };
  position?: { id: string; title: string };
  manager?: { id: string; firstName: string; lastName: string } | null;
  bloodGroup?: string | null;
  educationLevel?: string | null;
  fieldOfStudy?: string | null;
  firstContractDate?: string | null;
  contractRenewals?: number | null;
  inpsNumber?: string | null;
  amoNumber?: string | null;
  departureReason?: string | null;
  workStatus?: string | null;
  statusDate?: string | null;
  statusReason?: string | null;
  noticePeriodEnd?: string | null;
  exitInterviewDone?: boolean | null;
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

const WORK_STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: any }> = {
  ACTIVE: { label: "Actif", color: "text-green-600", bgColor: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300", icon: CheckCircle },
  ON_TRIAL: { label: "Période d'essai", color: "text-yellow-600", bgColor: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300", icon: Clock },
  EN_CONGE: { label: "En congé", color: "text-blue-600", bgColor: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300", icon: Clock },
  SUSPENDED: { label: "Suspendu", color: "text-orange-600", bgColor: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300", icon: AlertCircle },
  RESIGNED: { label: "Démission", color: "text-red-600", bgColor: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300", icon: UserMinus },
  TERMINATED: { label: "Renvoyé", color: "text-red-700", bgColor: "bg-red-200 text-red-900 dark:bg-red-900/30 dark:text-red-300", icon: UserMinus },
  CONTRACT_ENDED: { label: "Fin contrat", color: "text-gray-600", bgColor: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300", icon: UserMinus },
  JOB_ABANDONMENT: { label: "Abandon poste", color: "text-purple-600", bgColor: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300", icon: AlertCircle },
  MUTUAL_AGREEMENT: { label: "Rupture conv.", color: "text-indigo-600", bgColor: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300", icon: UserMinus },
  RETIRED: { label: "Retraité", color: "text-teal-600", bgColor: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300", icon: CheckCircle },
};

const exitStatuses = ["RESIGNED", "TERMINATED", "CONTRACT_ENDED", "JOB_ABANDONMENT", "MUTUAL_AGREEMENT", "RETIRED"];

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

    const style = document.createElement('style');
    style.innerHTML = printStyles;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, [employee.id]);
  
  const formatSalary = (s: string) =>
    new Intl.NumberFormat("fr-ML", { style: "currency", currency: "XOF", maximumFractionDigits: 0 }).format(parseFloat(s));

  const formatDate = (date: string | null | undefined) => {
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

  const getAnciennete = (firstContractDate: string | null | undefined) => {
    if (!firstContractDate) return null;
    try {
      const start = parseISO(firstContractDate);
      const today = new Date();
      let years = today.getFullYear() - start.getFullYear();
      let months = today.getMonth() - start.getMonth();
      if (today.getDate() < start.getDate()) {
        months--;
      }
      if (months < 0) {
        years--;
        months += 12;
      }
      if (years === 0) {
        return `${months} mois`;
      }
      return `${years} an${years > 1 ? 's' : ''}, ${months} mois`;
    } catch {
      return null;
    }
  };

  const getContractRemaining = (endDate: string | null) => {
    if (!endDate) return null;
    try {
      const end = parseISO(endDate);
      const today = new Date();
      if (end < today) return "Contrat expiré";
      
      let days = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (days <= 30) return `${days} jour${days > 1 ? 's' : ''}`;
      
      let months = Math.floor(days / 30);
      if (months <= 12) return `${months} mois`;
      
      let years = Math.floor(months / 12);
      months = months % 12;
      return `${years} an${years > 1 ? 's' : ''}, ${months} mois`;
    } catch {
      return null;
    }
  };

  const age = getAge(employee.dateOfBirth);
  const anciennete = getAnciennete(employee.firstContractDate);
  const contractRemaining = getContractRemaining(employee.endDate);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const printContent = profileRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Fiche Membre - ${employee.firstName} ${employee.lastName}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
            .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #0090D1; padding-bottom: 15px; }
            .header h1 { color: #0090D1; font-size: 24px; margin-bottom: 5px; }
            .header h2 { font-size: 18px; color: #666; }
            .photo { width: 80px; height: 80px; background: #f0f0f0; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 10px; font-size: 24px; font-weight: bold; }
            .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 20px 0; }
            .card { border: 1px solid #ddd; border-radius: 8px; padding: 15px; }
            .card h3 { color: #0090D1; font-size: 14px; margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 5px; }
            .item { margin-bottom: 8px; }
            .item label { font-size: 11px; color: #888; display: block; }
            .item span { font-size: 13px; font-weight: 500; }
            .footer { text-align: center; margin-top: 20px; font-size: 11px; color: #999; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  return (
    <div ref={profileRef} className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Fiche Membre
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors print:hidden"
            title="Imprimer la fiche"
          >
            <Printer className="w-5 h-5 text-gray-500" />
          </button>
          <button
            onClick={handleDownload}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors print:hidden"
            title="Télécharger la fiche"
          >
            <Download className="w-5 h-5 text-gray-500" />
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors print:hidden"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Left column - Profile card */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4 sm:p-6">
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
                WORK_STATUS_CONFIG[employee.workStatus || "ACTIVE"]?.bgColor || 
                (employee.isActive ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300")
              }`}>
                {WORK_STATUS_CONFIG[employee.workStatus || "ACTIVE"]?.label || (employee.isActive ? "Actif" : "Inactif")}
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
              <InfoItem label="Groupe sanguin" value={employee.bloodGroup || "—"} />
              <InfoItem label="Email personnel" value={employee.personalEmail || "—"} />
              <InfoItem label="Adresse" value={employee.address || "—"} />
              <InfoItem label="Ville" value={employee.city || "—"} />
            </div>
          </div>

          {/* Section Formation */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-purple-600" />
              Formation & Qualifications
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <InfoItem label="Niveau d'étude" value={employee.educationLevel || "—"} />
              <InfoItem label="Domaine d'étude" value={employee.fieldOfStudy || "—"} />
            </div>
          </div>

          {/* Section Informations professionnelles */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-green-600" />
              Informations professionnelles
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <InfoItem label="Date d'entrée (1er contrat)" value={formatDate(employee.firstContractDate)} />
              <InfoItem label="Ancienneté" value={anciennete || formatDate(employee.firstContractDate) ? anciennete || "—" : "—"} />
              <InfoItem label="Nbre renouvellements" value={employee.contractRenewals !== null ? `${employee.contractRenewals}` : "—"} />
              <InfoItem label="N° INPS" value={employee.inpsNumber || "—"} />
              <InfoItem label="N° AMO" value={employee.amoNumber || "—"} />
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
              <InfoItem label="Rôle" value={
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  employee.role === 'ADMIN_RH' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
                  employee.role === 'MANAGER' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                  'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                }`}>
                  {employee.role === 'ADMIN_RH' ? 'Administrateur RH' :
                   employee.role === 'MANAGER' ? 'Manager' : 'Employé'}
                </span>
              } />
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
              <InfoItem 
                label="Durée restante" 
                value={
                  <span className={contractRemaining === "Contrat expiré" ? "text-red-600 font-medium" : ""}>
                    {contractRemaining || "—"}
                  </span>
                } 
              />
              <InfoItem label="Solde congés" value={employee.leaveBalance !== null ? `${employee.leaveBalance} jours` : "—"} />
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
              <div className="col-span-2">
                <p className="text-xs text-gray-500 mb-1">Salaire de base</p>
                <p className="text-xl font-bold text-green-600">{formatSalary(employee.baseSalary)}</p>
              </div>
              {employee.globalSalaryCost && (
                <div className="col-span-2">
                  <p className="text-xs text-gray-500 mb-1">Coût salarial global</p>
                  <p className="text-lg font-bold text-blue-600">{formatSalary(employee.globalSalaryCost)}</p>
                </div>
              )}
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

          {!employee.isActive && (
            <div className="bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-800 p-6">
              <h3 className="font-semibold text-red-800 dark:text-red-300 mb-4 flex items-center gap-2">
                <UserMinus className="w-5 h-5" />
                Sortie de l&apos;entreprise
              </h3>
              <div className="space-y-3">
                {employee.workStatus && WORK_STATUS_CONFIG[employee.workStatus] && (
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-3 py-1 rounded-full font-medium ${WORK_STATUS_CONFIG[employee.workStatus].bgColor}`}>
                      {WORK_STATUS_CONFIG[employee.workStatus].label}
                    </span>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <InfoItem label="Date de sortie" value={employee.statusDate ? formatDate(employee.statusDate) : "—"} />
                  <InfoItem label="Motif" value={employee.statusReason || employee.departureReason || "—"} />
                </div>
                {employee.noticePeriodEnd && (
                  <InfoItem label="Fin de préavis" value={formatDate(employee.noticePeriodEnd)} />
                )}
                <InfoItem 
                  label="Entretien de sortie" 
                  value={employee.exitInterviewDone ? "Effectué" : "Non effectué"} 
                />
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

const printStyles = `
  @media print {
    body * { visibility: hidden; }
    .no-print { display: none !important; }
    [data-print] { visibility: visible; }
    [data-print] * { visibility: visible; }
  }
`;
