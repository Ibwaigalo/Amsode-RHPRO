"use client";
// src/components/payroll/PayslipsViewer.tsx
import { useState, useEffect } from "react";
import { X, Download, FileText, User, DollarSign, Loader2 } from "lucide-react";
import { formatXOF } from "@/lib/payroll-engine";

interface Payslip {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  employeeNumber: string;
  baseSalary: string;
  transportAllowance: string;
  housingAllowance: string;
  mealAllowance: string;
  performanceBonus: string;
  otherBonuses: string;
  grossSalary: string;
  cnssEmployee: string;
  cnssEmployer: string;
  imuEmployee: string;
  advanceDeduction: string;
  otherDeductions: string;
  netSalary: string;
  isEmailSent: boolean;
}

interface Props {
  periodId: string;
  periodLabel: string;
  onClose: () => void;
}

export default function PayslipsViewer({ periodId, periodLabel, onClose }: Props) {
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    async function fetchPayslips() {
      try {
        const res = await fetch(`/api/payroll/${periodId}/payslips`);
        if (res.ok && isMounted) {
          const data = await res.json();
          setPayslips(data);
        }
      } catch (e) {
        console.error("Error fetching payslips:", e);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    
    fetchPayslips();
    
    return () => { isMounted = false; };
  }, [periodId]);

  const downloadPdf = async (employeeId: string, employeeName: string) => {
    try {
      const res = await fetch(`/api/payroll/${periodId}/payslip/${employeeId}`);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `bulletin-${employeeName.replace(/\s+/g, "-")}-${periodLabel}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (e) {
      console.error("Error downloading PDF:", e);
    }
  };

  const totalNet = payslips.reduce((sum, p) => sum + parseFloat(p.netSalary || "0"), 0);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#0090D1]/10">
              <FileText className="w-5 h-5 text-[#0090D1]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Bulletins de Paie</h2>
              <p className="text-xs text-gray-500">{periodLabel} — {payslips.length} bulletin(s)</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Payslips list */}
          <div className="w-1/2 border-r border-gray-100 dark:border-gray-800 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="w-6 h-6 animate-spin text-[#0090D1]" />
              </div>
            ) : payslips.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Aucun bulletin pour cette période</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50 dark:divide-gray-800">
                {payslips.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPayslip(p)}
                    className={`flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${
                      selectedPayslip?.id === p.id ? "bg-blue-50 dark:bg-blue-900/20" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold">
                        {p.firstName?.[0]}{p.lastName?.[0]}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {p.firstName} {p.lastName}
                        </p>
                        <p className="text-xs text-gray-500">{p.employeeNumber}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-green-600">{formatXOF(parseFloat(p.netSalary || "0"))}</p>
                      <p className="text-xs text-gray-500">Net</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-800 px-4 py-3 border-t border-gray-100 dark:border-gray-700">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total nets distribués</span>
                <span className="font-bold text-gray-900 dark:text-white">{formatXOF(totalNet)}</span>
              </div>
            </div>
          </div>

          {/* Payslip detail / Preview */}
          <div className="w-1/2 p-6 overflow-y-auto">
            {selectedPayslip ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-lg font-bold">
                      {selectedPayslip.firstName?.[0]}{selectedPayslip.lastName?.[0]}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white">
                        {selectedPayslip.firstName} {selectedPayslip.lastName}
                      </h3>
                      <p className="text-xs text-gray-500">{selectedPayslip.employeeNumber}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => downloadPdf(selectedPayslip.employeeId, `${selectedPayslip.firstName}-${selectedPayslip.lastName}`)}
                    className="flex items-center gap-2 px-4 py-2 bg-[#0090D1] hover:bg-[#007ab8] text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Télécharger PDF
                  </button>
                </div>

                {/* Salary breakdown */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 space-y-3">
                  <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <DollarSign className="w-4 h-4" /> Éléments de rémunération
                  </h4>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Salaire de base</span>
                      <span className="font-medium">{formatXOF(parseFloat(selectedPayslip.baseSalary || "0"))}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Indemnité transport</span>
                      <span className="font-medium">{formatXOF(parseFloat(selectedPayslip.transportAllowance || "0"))}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Indemnité logement</span>
                      <span className="font-medium">{formatXOF(parseFloat(selectedPayslip.housingAllowance || "0"))}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Indemnité repas</span>
                      <span className="font-medium">{formatXOF(parseFloat(selectedPayslip.mealAllowance || "0"))}</span>
                    </div>
                    {parseFloat(selectedPayslip.performanceBonus || "0") > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Prime de performance</span>
                        <span className="font-medium text-green-600">+ {formatXOF(parseFloat(selectedPayslip.performanceBonus || "0"))}</span>
                      </div>
                    )}
                    {parseFloat(selectedPayslip.otherBonuses || "0") > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Autres primes</span>
                        <span className="font-medium text-green-600">+ {formatXOF(parseFloat(selectedPayslip.otherBonuses || "0"))}</span>
                      </div>
                    )}
                    
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-2 flex justify-between font-semibold">
                      <span className="text-gray-900 dark:text-white">Salaire Brut</span>
                      <span className="text-gray-900 dark:text-white">{formatXOF(parseFloat(selectedPayslip.grossSalary || "0"))}</span>
                    </div>
                  </div>
                </div>

                {/* Deductions */}
                <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 space-y-2 text-sm">
                  <h4 className="font-semibold text-red-700 dark:text-red-300">Retenues</h4>
                  <div className="flex justify-between">
                    <span className="text-red-600 dark:text-red-400">CNSS (3.3%)</span>
                    <span className="text-red-600 dark:text-red-400">— {formatXOF(parseFloat(selectedPayslip.cnssEmployee || "0"))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-red-600 dark:text-red-400">IRG (impôt)</span>
                    <span className="text-red-600 dark:text-red-400">— {formatXOF(parseFloat(selectedPayslip.imuEmployee || "0"))}</span>
                  </div>
                  {parseFloat(selectedPayslip.otherDeductions || "0") > 0 && (
                    <div className="flex justify-between">
                      <span className="text-red-600 dark:text-red-400">Autres retenues</span>
                      <span className="text-red-600 dark:text-red-400">— {formatXOF(parseFloat(selectedPayslip.otherDeductions || "0"))}</span>
                    </div>
                  )}
                </div>

                {/* Net salary */}
                <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 flex justify-between items-center">
                  <div>
                    <p className="text-sm text-green-700 dark:text-green-300">Net à payer</p>
                    <p className="text-xs text-green-600 dark:text-green-400">{periodLabel}</p>
                  </div>
                  <p className="text-2xl font-bold text-green-600">{formatXOF(parseFloat(selectedPayslip.netSalary || "0"))}</p>
                </div>

                {/* CNSS employer */}
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 space-y-2 text-sm">
                  <h4 className="font-semibold text-blue-700 dark:text-blue-300">Charges patronales (non déduites du net)</h4>
                  <div className="flex justify-between">
                    <span className="text-blue-600 dark:text-blue-400">CNSS employeur (8.25%)</span>
                    <span className="text-blue-600 dark:text-blue-400">{formatXOF(parseFloat(selectedPayslip.cnssEmployer || "0"))}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <FileText className="w-16 h-16 mb-4 opacity-30" />
                <p className="text-sm">Sélectionnez un bulletin pour voir les détails</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
