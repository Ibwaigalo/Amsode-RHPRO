// src/__tests__/payroll-engine.test.ts
import { calculatePayroll, formatXOF, simulatePayroll } from "@/lib/payroll-engine";

describe("Payroll Engine — Calcul Mali (CNSS + IRG)", () => {
  describe("calculatePayroll()", () => {
    it("calcule correctement le salaire net pour un salaire de base standard", () => {
      const result = calculatePayroll({ baseSalary: 300000 });

      expect(result.baseSalary).toBe(300000);
      expect(result.grossSalary).toBe(300000);
      // CNSS 3.3% = 9900
      expect(result.cnssEmployee).toBe(9900);
      expect(result.netSalary).toBeLessThan(300000);
      expect(result.netSalary).toBeGreaterThan(0);
      expect(result.totalDeductions).toBe(result.cnssEmployee + result.incomeTax);
      expect(result.netSalary).toBe(result.grossSalary - result.totalDeductions);
    });

    it("calcule le brut total en incluant toutes les primes", () => {
      const result = calculatePayroll({
        baseSalary: 250000,
        transportAllowance: 20000,
        housingAllowance: 30000,
        performanceBonus: 50000,
        otherAllowances: 10000,
      });

      expect(result.grossSalary).toBe(360000);
      expect(result.transportAllowance).toBe(20000);
      expect(result.housingAllowance).toBe(30000);
      expect(result.performanceBonus).toBe(50000);
      expect(result.otherAllowances).toBe(10000);
    });

    it("applique le taux CNSS salarié de 3.3% correctement", () => {
      const result = calculatePayroll({ baseSalary: 1000000 });
      expect(result.cnssEmployee).toBe(33000); // 1000000 * 0.033
    });

    it("calcule la cotisation employeur à 8.25%", () => {
      const result = calculatePayroll({ baseSalary: 400000 });
      expect(result.cnssEmployer).toBe(33000); // 400000 * 0.0825
    });

    it("ne prélève pas d'IRG pour les très bas salaires (< 900 000 FCFA/an)", () => {
      // Salaire mensuel 60000 FCFA → annuel 720000 < seuil 900000
      const result = calculatePayroll({ baseSalary: 60000 });
      expect(result.incomeTax).toBe(0);
    });

    it("prélève l'IRG pour les salaires dépassant le seuil annuel", () => {
      const result = calculatePayroll({ baseSalary: 500000 });
      expect(result.incomeTax).toBeGreaterThan(0);
    });

    it("le net est toujours positif", () => {
      [50000, 150000, 300000, 500000, 1000000, 2000000].forEach((salary) => {
        const result = calculatePayroll({ baseSalary: salary });
        expect(result.netSalary).toBeGreaterThan(0);
      });
    });

    it("prend en compte les enfants à charge pour réduire l'IRG", () => {
      const sans = calculatePayroll({ baseSalary: 600000, dependents: 0 });
      const avec = calculatePayroll({ baseSalary: 600000, dependents: 3 });
      expect(avec.incomeTax).toBeLessThanOrEqual(sans.incomeTax);
    });

    it("la cohérence : brut = net + total déductions", () => {
      const result = calculatePayroll({
        baseSalary: 450000,
        transportAllowance: 25000,
        performanceBonus: 75000,
      });
      expect(result.grossSalary).toBe(result.netSalary + result.totalDeductions);
    });
  });

  describe("simulatePayroll()", () => {
    it("retourne un taux de déduction entre 0 et 50%", () => {
      const { deductionRate } = simulatePayroll(300000);
      expect(deductionRate).toBeGreaterThan(0);
      expect(deductionRate).toBeLessThan(50);
    });

    it("le net est inférieur au brut", () => {
      const { net } = simulatePayroll(500000);
      expect(net).toBeLessThan(500000);
    });

    it("retourne 0 net pour 0 brut", () => {
      const { net } = simulatePayroll(0);
      expect(net).toBe(0);
    });
  });

  describe("formatXOF()", () => {
    it("formate correctement en FCFA", () => {
      const result = formatXOF(300000);
      expect(result).toContain("300");
      expect(result).toMatch(/XOF|FCFA|F/);
    });

    it("arrondit correctement les décimales", () => {
      const result = formatXOF(300000.75);
      expect(result).not.toContain(".75");
    });
  });
});
