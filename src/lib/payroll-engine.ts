// src/lib/payroll-engine.ts
// Calcul de paie selon la législation malienne

export interface PayrollInput {
  baseSalary: number;
  transportAllowance?: number;
  housingAllowance?: number;
  performanceBonus?: number;
  otherAllowances?: number;
  dependents?: number; // nb d'enfants à charge
}

export interface PayrollResult {
  baseSalary: number;
  transportAllowance: number;
  housingAllowance: number;
  performanceBonus: number;
  otherAllowances: number;
  grossSalary: number;
  cnssEmployee: number;      // 3.3% salarié
  cnssEmployer: number;      // 7% + 1.25% AT = ~8.25% employeur
  incomeTax: number;         // Impôt sur le revenu (barème Mali)
  otherDeductions: number;
  totalDeductions: number;
  netSalary: number;
  cnssBase: number;
  taxableIncome: number;
}

// Taux CNSS Mali (2024)
const CNSS_EMPLOYEE_RATE = 0.033;   // 3.3%
const CNSS_EMPLOYER_BASE_RATE = 0.07; // 7% vieillesse
const CNSS_EMPLOYER_AT_RATE = 0.0125; // 1.25% AT (variable par secteur)
const CNSS_EMPLOYER_RATE = CNSS_EMPLOYER_BASE_RATE + CNSS_EMPLOYER_AT_RATE;

// Barème IRG Mali (Impôt sur Revenu Global) - mensuel
function calculateMalianIncomeTax(taxableMonthlyIncome: number, dependents: number = 0): number {
  // Abattement forfaitaire 25% pour frais professionnels
  const professionalAbatement = taxableMonthlyIncome * 0.25;
  const baseForTax = taxableMonthlyIncome - professionalAbatement;
  
  // Barème progressif annuel → mensuel
  let annualBase = baseForTax * 12;
  let annualTax = 0;

  if (annualBase <= 900000) {
    annualTax = 0;
  } else if (annualBase <= 1800000) {
    annualTax = (annualBase - 900000) * 0.05;
  } else if (annualBase <= 3600000) {
    annualTax = 45000 + (annualBase - 1800000) * 0.10;
  } else if (annualBase <= 7200000) {
    annualTax = 225000 + (annualBase - 3600000) * 0.15;
  } else if (annualBase <= 12000000) {
    annualTax = 765000 + (annualBase - 7200000) * 0.20;
  } else {
    annualTax = 1725000 + (annualBase - 12000000) * 0.30;
  }

  // Réduction pour charges de famille (quotient familial simplifié)
  const familyReduction = Math.min(dependents * 36000, annualTax * 0.3);
  annualTax = Math.max(0, annualTax - familyReduction);

  return Math.round(annualTax / 12);
}

export function calculatePayroll(input: PayrollInput): PayrollResult {
  const {
    baseSalary,
    transportAllowance = 0,
    housingAllowance = 0,
    performanceBonus = 0,
    otherAllowances = 0,
    dependents = 0,
  } = input;

  const grossSalary = baseSalary + transportAllowance + housingAllowance + performanceBonus + otherAllowances;

  // Base CNSS = salaire brut (plafond à vérifier selon réglementation)
  const cnssBase = grossSalary;
  const cnssEmployee = Math.round(cnssBase * CNSS_EMPLOYEE_RATE);
  const cnssEmployer = Math.round(cnssBase * CNSS_EMPLOYER_RATE);

  // Revenu imposable = brut - cotisation salariale CNSS
  const taxableIncome = grossSalary - cnssEmployee;
  const incomeTax = calculateMalianIncomeTax(taxableIncome, dependents);

  const totalDeductions = cnssEmployee + incomeTax;
  const netSalary = grossSalary - totalDeductions;

  return {
    baseSalary,
    transportAllowance,
    housingAllowance,
    performanceBonus,
    otherAllowances,
    grossSalary,
    cnssEmployee,
    cnssEmployer,
    incomeTax,
    otherDeductions: 0,
    totalDeductions,
    netSalary,
    cnssBase,
    taxableIncome,
  };
}

// Formater les montants en FCFA
export function formatXOF(amount: number): string {
  return new Intl.NumberFormat("fr-ML", {
    style: "currency",
    currency: "XOF",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Simulateur pour le frontend
export function simulatePayroll(gross: number): { net: number; deductionRate: number } {
  const result = calculatePayroll({ baseSalary: gross });
  return {
    net: result.netSalary,
    deductionRate: ((result.totalDeductions / result.grossSalary) * 100),
  };
}
