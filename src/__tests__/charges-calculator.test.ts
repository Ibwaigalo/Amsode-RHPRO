// src/__tests__/charges-calculator.test.ts
import { calculateMalianCharges, formatXOF } from '@/lib/charges-calculator';

describe('calculateMalianCharges', () => {
  describe('INPS (Retraite) 3.6%', () => {
    it('should calculate INPS at 3.6% of gross salary', () => {
      const result = calculateMalianCharges({
        salaryBrut: 500000,
        statutMatrimonial: 'Célibataire',
        nbEnfantsCharge: 0,
      });
      
      expect(result.chargesInps).toBe(18000); // 500000 * 0.036 = 18000
    });

    it('should calculate INPS for different salary levels', () => {
      const result100k = calculateMalianCharges({
        salaryBrut: 100000,
        statutMatrimonial: 'Célibataire',
        nbEnfantsCharge: 0,
      });
      expect(result100k.chargesInps).toBe(3600);

      const result1M = calculateMalianCharges({
        salaryBrut: 1000000,
        statutMatrimonial: 'Célibataire',
        nbEnfantsCharge: 0,
      });
      expect(result1M.chargesInps).toBe(36000);
    });
  });

  describe('AMO (Assurance Maladie) 3.06%', () => {
    it('should calculate AMO at 3.06% of gross salary', () => {
      const result = calculateMalianCharges({
        salaryBrut: 500000,
        statutMatrimonial: 'Célibataire',
        nbEnfantsCharge: 0,
      });
      
      expect(result.chargesAmo).toBe(15300); // 500000 * 0.0306 = 15300
    });
  });

  describe('Abattement familial', () => {
    it('should apply 0% abatement for Célibataire', () => {
      const result = calculateMalianCharges({
        salaryBrut: 500000,
        statutMatrimonial: 'Célibataire',
        nbEnfantsCharge: 0,
      });
      
      expect(result.tauxAbattement).toBe(0);
    });

    it('should apply 20% abatement for Marié', () => {
      const result = calculateMalianCharges({
        salaryBrut: 500000,
        statutMatrimonial: 'Marié',
        nbEnfantsCharge: 0,
      });
      
      expect(result.tauxAbattement).toBe(20);
    });

    it('should apply 15% abatement for Veuf/Veuve', () => {
      const resultVeuf = calculateMalianCharges({
        salaryBrut: 500000,
        statutMatrimonial: 'Veuf/Veuve',
        nbEnfantsCharge: 0,
      });
      expect(resultVeuf.tauxAbattement).toBe(15);

      const resultDivorce = calculateMalianCharges({
        salaryBrut: 500000,
        statutMatrimonial: 'Divorcé/Séparé',
        nbEnfantsCharge: 0,
      });
      expect(resultDivorce.tauxAbattement).toBe(15);
    });

    it('should apply 5% per child (max 25%)', () => {
      // 2 children = 10%
      const result2 = calculateMalianCharges({
        salaryBrut: 500000,
        statutMatrimonial: 'Marié',
        nbEnfantsCharge: 2,
      });
      expect(result2.tauxAbattement).toBe(30); // 20% + 10%

      // 5 children = 25% (max)
      const result5 = calculateMalianCharges({
        salaryBrut: 500000,
        statutMatrimonial: 'Marié',
        nbEnfantsCharge: 5,
      });
      expect(result5.tauxAbattement).toBe(45); // 20% + 25% (max)

      // 6+ children should still be 45% (25% max for children)
      const result6 = calculateMalianCharges({
        salaryBrut: 500000,
        statutMatrimonial: 'Marié',
        nbEnfantsCharge: 6,
      });
      expect(result6.tauxAbattement).toBe(45);
    });
  });

  describe('Net salary calculation', () => {
    it('should calculate correct net for Célibataire with no children', () => {
      const result = calculateMalianCharges({
        salaryBrut: 500000,
        statutMatrimonial: 'Célibataire',
        nbEnfantsCharge: 0,
      });
      
      // INPS: 18000, AMO: 15300, ITS: calculated
      expect(result.salaryNet).toBe(result.salaryBrut - result.chargesInps - result.chargesAmo - result.chargesIts);
      expect(result.salaryNet).toBeGreaterThan(400000); // At least 80% net for low salary
    });

    it('should calculate correct net for Marié with 2 children (test case from requirements)', () => {
      const result = calculateMalianCharges({
        salaryBrut: 500000,
        statutMatrimonial: 'Marié',
        nbEnfantsCharge: 2,
      });
      
      // Verificar que el abatement se aplica correctamente
      expect(result.tauxAbattement).toBe(30); // 20% + 10%
      
      // With higher abatement, net should be higher
      const resultCelibataire = calculateMalianCharges({
        salaryBrut: 500000,
        statutMatrimonial: 'Célibataire',
        nbEnfantsCharge: 0,
      });
      
      expect(result.salaryNet).toBeGreaterThan(resultCelibataire.salaryNet);
    });
  });

  describe('Edge cases', () => {
    it('should handle zero salary', () => {
      const result = calculateMalianCharges({
        salaryBrut: 0,
        statutMatrimonial: 'Célibataire',
        nbEnfantsCharge: 0,
      });
      
      expect(result.chargesInps).toBe(0);
      expect(result.chargesAmo).toBe(0);
      expect(result.chargesIts).toBe(0);
      expect(result.salaryNet).toBe(0);
    });

    it('should handle very high salary (10M)', () => {
      const result = calculateMalianCharges({
        salaryBrut: 10000000,
        statutMatrimonial: 'Marié',
        nbEnfantsCharge: 3,
      });
      
      expect(result.chargesInps).toBe(360000);
      expect(result.chargesAmo).toBe(306000);
      expect(result.salaryNet).toBeLessThan(result.salaryBrut);
    });
  });
});

describe('formatXOF', () => {
  it('should format numbers correctly', () => {
    expect(formatXOF(1000)).toBe('1 000 XOF');
    expect(formatXOF(100000)).toBe('100 000 XOF');
    expect(formatXOF(1000000)).toBe('1 000 000 XOF');
  });
});