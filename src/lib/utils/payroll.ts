// Calcul paie selon barèmes Mali (CNSS + IMU)
export interface PayrollInput {
  baseSalary: number;
  transportAllowance?: number;
  housingAllowance?: number;
  mealAllowance?: number;
  performanceBonus?: number;
  otherBonuses?: number;
  advanceDeduction?: number;
  otherDeductions?: number;
}

export interface PayrollResult extends PayrollInput {
  grossSalary: number;
  cnssEmployee: number;   // 3.6% (part salarié)
  cnssEmployer: number;   // 9.6% (part patronal)
  imuEmployee: number;    // Impôt sur les traitements et salaires Mali
  totalDeductions: number;
  netSalary: number;
}

// Barème IMU Mali (simplifié)
function calculateIMU(grossSalary: number): number {
  const monthly = grossSalary;
  if (monthly <= 50000) return 0;
  if (monthly <= 100000) return (monthly - 50000) * 0.02;
  if (monthly <= 200000) return 1000 + (monthly - 100000) * 0.05;
  if (monthly <= 500000) return 6000 + (monthly - 200000) * 0.10;
  if (monthly <= 1000000) return 36000 + (monthly - 500000) * 0.18;
  return 126000 + (monthly - 1000000) * 0.26;
}

export function calculatePayroll(input: PayrollInput): PayrollResult {
  const {
    baseSalary,
    transportAllowance = 0,
    housingAllowance = 0,
    mealAllowance = 0,
    performanceBonus = 0,
    otherBonuses = 0,
    advanceDeduction = 0,
    otherDeductions = 0,
  } = input;

  const grossSalary = baseSalary + transportAllowance + housingAllowance + mealAllowance + performanceBonus + otherBonuses;
  const cnssEmployee = Math.round(grossSalary * 0.036);
  const cnssEmployer = Math.round(grossSalary * 0.096);
  const imuEmployee = Math.round(calculateIMU(grossSalary));
  const totalDeductions = cnssEmployee + imuEmployee + advanceDeduction + otherDeductions;
  const netSalary = grossSalary - totalDeductions;

  return {
    ...input,
    grossSalary,
    cnssEmployee,
    cnssEmployer,
    imuEmployee,
    totalDeductions,
    netSalary: Math.max(0, netSalary),
  };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-ML', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(amount);
}

export const MONTHS_FR = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
