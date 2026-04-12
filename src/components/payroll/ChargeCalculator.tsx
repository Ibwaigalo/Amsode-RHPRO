"use client";
// src/components/payroll/ChargeCalculator.tsx
import { useMemo } from 'react';
import { HelpCircle, TrendingDown, Calculator } from 'lucide-react';
import { calculateMalianCharges, formatXOF, MaritalStatus } from '@/lib/charges-calculator';

export type { MaritalStatus };

interface ChargeCalculatorProps {
  salaryBrut: number;
  statutMatrimonial: MaritalStatus;
  nbEnfantsCharge: number;
  showDetails?: boolean;
  className?: string;
}

export function ChargeCalculator({
  salaryBrut,
  statutMatrimonial,
  nbEnfantsCharge,
  showDetails = true,
  className = '',
}: ChargeCalculatorProps) {
  const result = useMemo(
    () => calculateMalianCharges({ salaryBrut, statutMatrimonial, nbEnfantsCharge }),
    [salaryBrut, statutMatrimonial, nbEnfantsCharge]
  );

  if (salaryBrut <= 0) {
    return null;
  }

  const totalCharges = result.chargesInps + result.chargesAmo + result.chargesIts;
  const netPercentage = ((result.salaryNet / salaryBrut) * 100).toFixed(1);

  return (
    <div className={`bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-800 dark:to-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <Calculator className="w-4 h-4 text-[#0090D1]" />
        <span className="text-sm font-semibold text-gray-900 dark:text-white">
          Charges Sociales Mali 2026
        </span>
        <div className="relative group">
          <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
          <div className="absolute right-0 w-64 p-3 text-xs text-white bg-gray-900 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 hidden group-hover:block">
            <p className="font-medium mb-1">Taux 2026 :</p>
            <ul className="space-y-1">
              <li>• INPS (Retraite): 3.6%</li>
              <li>• AMO (Santé): 3.06%</li>
              <li>• ITS: Barème progressif</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Breakdown */}
      {showDetails && (
        <div className="p-4 space-y-3">
          {/* INPS */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">INPS (Retraite)</span>
              <span className="text-xs text-gray-400">(3.6%)</span>
            </div>
            <span className="text-sm font-medium text-red-600 dark:text-red-400">
              -{formatXOF(result.chargesInps)}
            </span>
          </div>

          {/* AMO */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">AMO (Assurance Maladie)</span>
              <span className="text-xs text-gray-400">(3.06%)</span>
            </div>
            <span className="text-sm font-medium text-red-600 dark:text-red-400">
              -{formatXOF(result.chargesAmo)}
            </span>
          </div>

          {/* ITS */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">ITS (Impôt)</span>
              {result.tauxAbattement > 0 && (
                <span className="text-xs text-green-600 dark:text-green-400">
                  ({result.tauxAbattement}% abattement)
                </span>
              )}
            </div>
            <span className="text-sm font-medium text-red-600 dark:text-red-400">
              -{formatXOF(result.chargesIts)}
            </span>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Total charges</span>
              <span className="text-sm font-bold text-red-600 dark:text-red-400">
                -{formatXOF(totalCharges)}
              </span>
            </div>
          </div>

          {/* Net */}
          <div className="flex items-center justify-between bg-green-50 dark:bg-green-900/20 rounded-lg p-3 mt-2">
            <div className="flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-green-600" />
              <span className="text-sm font-semibold text-green-700 dark:text-green-400">Salaire Net</span>
              <span className="text-xs text-green-600 dark:text-green-400">({netPercentage}%)</span>
            </div>
            <span className="text-lg font-bold text-green-700 dark:text-green-400">
              {formatXOF(result.salaryNet)}
            </span>
          </div>
        </div>
      )}

      {/* Simple Summary (when not showing details) */}
      {!showDetails && (
        <div className="px-4 py-3 flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">Salaire Net estimé</span>
          <span className="text-lg font-bold text-green-600 dark:text-green-400">
            {formatXOF(result.salaryNet)}
          </span>
        </div>
      )}
    </div>
  );
}

// Version mini pour inline dans les formulaires
export function ChargeCalculatorInline({
  salaryBrut,
  statutMatrimonial,
  nbEnfantsCharge,
}: {
  salaryBrut: number;
  statutMatrimonial: MaritalStatus;
  nbEnfantsCharge: number;
}) {
  const result = useMemo(
    () => calculateMalianCharges({ salaryBrut, statutMatrimonial, nbEnfantsCharge }),
    [salaryBrut, statutMatrimonial, nbEnfantsCharge]
  );

  if (salaryBrut <= 0) return null;

  const totalCharges = result.chargesInps + result.chargesAmo + result.chargesIts;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-600 dark:text-gray-400">
        <span>INPS: <span className="text-red-500">-{formatXOF(result.chargesInps)}</span></span>
        <span>AMO: <span className="text-red-500">-{formatXOF(result.chargesAmo)}</span></span>
        <span>ITS: <span className="text-red-500">-{formatXOF(result.chargesIts)}</span></span>
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-blue-200 dark:border-blue-800">
        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Charges totales:</span>
        <span className="text-sm font-semibold text-red-600 dark:text-red-400">
          -{formatXOF(totalCharges)}
        </span>
      </div>
      <div className="flex items-center justify-between bg-green-100 dark:bg-green-900/30 rounded-lg p-2">
        <span className="text-sm font-semibold text-green-700 dark:text-green-400">Salaire Net:</span>
        <span className="text-lg font-bold text-green-700 dark:text-green-400">
          {formatXOF(result.salaryNet)}
        </span>
      </div>
    </div>
  );
}

export const MARITAL_STATUS_OPTIONS: { value: MaritalStatus; label: string; icon: string }[] = [
  { value: 'Célibataire', label: 'Célibataire', icon: '👤' },
  { value: 'Marié', label: 'Marié(e)', icon: '💑' },
  { value: 'Veuf/Veuve', label: 'Veuf/Veuve', icon: '🕯️' },
  { value: 'Divorcé/Séparé', label: 'Divorcé/Séparé', icon: '📋' },
];