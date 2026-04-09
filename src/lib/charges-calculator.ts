// src/lib/charges-calculator.ts
// Calcul des charges sociales maliennes - Mali 2026

export type MaritalStatus = 'Célibataire' | 'Marié' | 'Veuf/Veuve' | 'Divorcé/Séparé';

export interface ChargesInput {
  salaryBrut: number;
  statutMatrimonial: MaritalStatus;
  nbEnfantsCharge: number;
}

export interface ChargesResult {
  salaryBrut: number;
  chargesInps: number;
  chargesAmo: number;
  chargesIts: number;
  salaryNet: number;
  tauxAbattement: number;
  breakdown: {
    label: string;
    percentage: number;
    amount: number;
  }[];
}

// Taux charges sociales Mali 2026
const INPS_RATE = 0.036;       // 3.6% retraite part salariale
const AMO_RATE = 0.0306;      // 3.06% assurance maladie obligatoire

// Abattements familiaux
const ABATTEMENT_MARIE = 0.20;         // 20% pour marié
const ABATTEMENT_VEUF_DIVORCE = 0.15; // 15% pour veuf/divorcé
const ABATTEMENT_PER_CHILD = 0.05;    // 5% par enfant
const MAX_ABATTEMENT_CHILDREN = 0.25; // max 25% pour enfants

// Barème ITS progressif (annuel)
const ITS_BAREME = [
  { max: 900000, rate: 0, fixed: 0 },
  { max: 1800000, rate: 0.05, fixed: 0 },
  { max: 3600000, rate: 0.10, fixed: 45000 },
  { max: 7200000, rate: 0.15, fixed: 225000 },
  { max: 12000000, rate: 0.20, fixed: 765000 },
  { max: Infinity, rate: 0.30, fixed: 1725000 },
];

function calculateITS(taxableAnnualIncome: number): number {
  for (const bracket of ITS_BAREME) {
    if (taxableAnnualIncome <= bracket.max) {
      return Math.round((taxableAnnualIncome * bracket.rate + bracket.fixed) / 12);
    }
  }
  return 0;
}

export function calculateMalianCharges(input: ChargesInput): ChargesResult {
  const { salaryBrut, statutMatrimonial, nbEnfantsCharge } = input;

  // Calcul INPS (retraite)
  const chargesInps = Math.round(salaryBrut * INPS_RATE);

  // Calcul AMO
  const chargesAmo = Math.round(salaryBrut * AMO_RATE);

  // Calcul abattement familial
  let abattementBase = 0;
  if (statutMatrimonial === 'Marié') {
    abattementBase = ABATTEMENT_MARIE;
  } else if (statutMatrimonial === 'Veuf/Veuve' || statutMatrimonial === 'Divorcé/Séparé') {
    abattementBase = ABATTEMENT_VEUF_DIVORCE;
  }

  const abattementEnfants = Math.min(nbEnfantsCharge * ABATTEMENT_PER_CHILD, MAX_ABATTEMENT_CHILDREN);
  const tauxAbattement = Math.round((abattementBase + abattementEnfants) * 100);

  // Salaire après abattement (pour calcul ITS)
  const salaryAfterAbattement = salaryBrut * (1 - abattementBase - abattementEnfants);
  
  // Abattement professionnel 25%
  const taxableIncome = salaryAfterAbattement * 0.75;
  
  // Calcul ITS mensuel
  const chargesIts = calculateITS(taxableIncome * 12);

  // Salaire net
  const salaryNet = salaryBrut - chargesInps - chargesAmo - chargesIts;

  // Breakdown pour affichage
  const breakdown = [
    { label: 'INPS (Retraite 3.6%)', percentage: 3.6, amount: chargesInps },
    { label: 'AMO (Santé 3.06%)', percentage: 3.06, amount: chargesAmo },
    { label: `ITS (Impôt ${tauxAbattement > 0 ? `- ${tauxAbattement}% abattement` : ''})`, percentage: 0, amount: chargesIts },
  ];

  return {
    salaryBrut,
    chargesInps,
    chargesAmo,
    chargesIts,
    salaryNet,
    tauxAbattement,
    breakdown,
  };
}

// Helper pour formater en FCFA
export function formatXOF(amount: number): string {
  return new Intl.NumberFormat('fr-ML', {
    style: 'currency',
    currency: 'XOF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Hook React pour calcul en temps réel
export function useChargesCalculator(
  salaryBrut: number,
  statutMatrimonial: MaritalStatus,
  nbEnfantsCharge: number
) {
  return calculateMalianCharges({
    salaryBrut,
    statutMatrimonial,
    nbEnfantsCharge,
  });
}