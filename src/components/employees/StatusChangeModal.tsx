"use client";
import { useState } from "react";
import { X, UserMinus, AlertTriangle, CheckCircle, Clock, Briefcase, UserCheck } from "lucide-react";
import { toast } from "sonner";

interface Employee {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  workStatus: string | null;
  department?: { name: string };
  position?: { title: string };
}

interface Props {
  employee: Employee;
  onClose: () => void;
  onConfirm: (employeeId: string, newStatus: string, data: any) => Promise<boolean>;
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string; icon: any; description: string }> = {
  ACTIVE: { 
    label: "Actif", 
    color: "text-green-600", 
    bgColor: "bg-green-100 border-green-300", 
    icon: CheckCircle, 
    description: "L'employé est actuellement en poste" 
  },
  ON_TRIAL: { 
    label: "Période d'essai", 
    color: "text-yellow-600", 
    bgColor: "bg-yellow-100 border-yellow-300", 
    icon: Clock, 
    description: "L'employé est en période d'essai" 
  },
  EN_CONGE: { 
    label: "En congé", 
    color: "text-blue-600", 
    bgColor: "bg-blue-100 border-blue-300", 
    icon: Clock, 
    description: "L'employé est actuellement en congé" 
  },
  SUSPENDED: { 
    label: "Suspendu", 
    color: "text-orange-600", 
    bgColor: "bg-orange-100 border-orange-300", 
    icon: AlertTriangle, 
    description: "L'employé est suspendu temporairement" 
  },
  RESIGNED: { 
    label: "Démission", 
    color: "text-red-600", 
    bgColor: "bg-red-100 border-red-300", 
    icon: UserMinus, 
    description: "L'employé a donné sa démission" 
  },
  TERMINATED: { 
    label: "Renvoyé/Licencié", 
    color: "text-red-700", 
    bgColor: "bg-red-200 border-red-400", 
    icon: AlertTriangle, 
    description: "L'employé a été renvoyé/licencié" 
  },
  CONTRACT_ENDED: { 
    label: "Fin de contrat", 
    color: "text-gray-600", 
    bgColor: "bg-gray-100 border-gray-300", 
    icon: Briefcase, 
    description: "Fin normale du contrat (CDD, stage...)" 
  },
  JOB_ABANDONMENT: { 
    label: "Abandon de poste", 
    color: "text-purple-600", 
    bgColor: "bg-purple-100 border-purple-300", 
    icon: AlertTriangle, 
    description: "L'employé a abandonné son poste" 
  },
  MUTUAL_AGREEMENT: { 
    label: "Rupture conventionnelle", 
    color: "text-indigo-600", 
    bgColor: "bg-indigo-100 border-indigo-300", 
    icon: UserCheck, 
    description: "Départ négocié entre l'employeur et l'employé" 
  },
  RETIRED: { 
    label: "Retraité", 
    color: "text-teal-600", 
    bgColor: "bg-teal-100 border-teal-300", 
    icon: CheckCircle, 
    description: "L'employé est parti à la retraite" 
  },
};

const exitStatuses = ["RESIGNED", "TERMINATED", "CONTRACT_ENDED", "JOB_ABANDONMENT", "MUTUAL_AGREEMENT", "RETIRED"];
const activeStatuses = ["ACTIVE", "ON_TRIAL", "EN_CONGE", "SUSPENDED"];

export function StatusChangeModal({ employee, onClose, onConfirm }: Props) {
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [statusReason, setStatusReason] = useState("");
  const [noticePeriodEnd, setNoticePeriodEnd] = useState("");
  const [exitInterviewDone, setExitInterviewDone] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<"select" | "details">("select");

  const handleSubmit = async () => {
    if (!selectedStatus) {
      toast.error("Veuillez sélectionner un statut");
      return;
    }

    setIsSubmitting(true);
    
    const data: any = {
      statusReason: statusReason || undefined,
      exitInterviewDone: exitStatuses.includes(selectedStatus) ? exitInterviewDone : undefined,
    };

    if (noticePeriodEnd && exitStatuses.includes(selectedStatus)) {
      data.noticePeriodEnd = noticePeriodEnd;
    }

    const success = await onConfirm(employee.id, selectedStatus, data);
    
    if (!success) {
      setIsSubmitting(false);
    }
  };

  const currentConfig = statusConfig[employee.workStatus || "ACTIVE"] || statusConfig.ACTIVE;
  const selectedConfig = selectedStatus ? statusConfig[selectedStatus] : null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Changer le statut</h2>
            <p className="text-sm text-gray-500">{employee.firstName} {employee.lastName} ({employee.employeeNumber})</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <p className="text-sm text-gray-500 mb-1">Statut actuel</p>
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ${currentConfig.bgColor}`}>
              <currentConfig.icon className={`w-4 h-4 ${currentConfig.color}`} />
              <span className={`text-sm font-medium ${currentConfig.color}`}>{currentConfig.label}</span>
            </div>
          </div>

          {step === "select" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sélectionnez le nouveau statut
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[...activeStatuses, ...exitStatuses].map((status) => {
                    const config = statusConfig[status];
                    const Icon = config.icon;
                    const isSelected = selectedStatus === status;
                    
                    return (
                      <button
                        key={status}
                        onClick={() => {
                          setSelectedStatus(status);
                          setStep("details");
                        }}
                        className={`p-3 rounded-lg border-2 text-left transition-all ${
                          isSelected 
                            ? `${config.bgColor} border-current` 
                            : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Icon className={`w-4 h-4 ${config.color}`} />
                          <span className={`text-sm font-medium ${config.color}`}>{config.label}</span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{config.description}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {step === "details" && selectedConfig && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <selectedConfig.icon className={`w-5 h-5 ${selectedConfig.color}`} />
                  <span className={`font-medium ${selectedConfig.color}`}>Nouveau statut: {selectedConfig.label}</span>
                </div>
                <p className="text-sm text-blue-700 dark:text-blue-300">{selectedConfig.description}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Motif / Raison {exitStatuses.includes(selectedStatus) && <span className="text-red-500">*</span>}
                </label>
                <textarea
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  placeholder="Décrivez la raison du changement de statut..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0090D1] focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                />
              </div>

              {exitStatuses.includes(selectedStatus) && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Date de fin de préavis
                    </label>
                    <input
                      type="date"
                      value={noticePeriodEnd}
                      onChange={(e) => setNoticePeriodEnd(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0090D1] focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                    />
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <input
                      type="checkbox"
                      id="exitInterview"
                      checked={exitInterviewDone}
                      onChange={(e) => setExitInterviewDone(e.target.checked)}
                      className="w-4 h-4 text-[#0090D1] border-gray-300 rounded focus:ring-[#0090D1]"
                    />
                    <label htmlFor="exitInterview" className="text-sm text-gray-700 dark:text-gray-300">
                      Entretien de sortie effectué
                    </label>
                  </div>

                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-yellow-800 dark:text-yellow-200">
                        <p className="font-medium mb-1">Attention: Cette action est irréversible</p>
                        <p>L'employé sera marqué comme inactif et ne pourra plus se connecter.</p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {selectedStatus === "EN_CONGE" && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    L'employé reste actif mais sera signalé comme étant en congé.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
          <button
            onClick={() => {
              if (step === "details") {
                setStep("select");
                setSelectedStatus("");
              } else {
                onClose();
              }
            }}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
          >
            {step === "details" ? "Retour" : "Annuler"}
          </button>
          
          {step === "details" && (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-6 py-2 bg-[#0090D1] hover:bg-[#007bb5] text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Enregistrement..." : "Confirmer le changement"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default StatusChangeModal;
