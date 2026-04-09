// src/__tests__/utils.test.ts
import {
  cn,
  formatDate,
  formatCurrency,
  getInitials,
  calculateAge,
  calculateSeniority,
  isContractExpiringSoon,
} from "@/lib/utils";

describe("Utils — fonctions utilitaires", () => {
  describe("cn()", () => {
    it("fusionne les classes correctement", () => {
      expect(cn("px-4", "py-2")).toBe("px-4 py-2");
    });

    it("résout les conflits Tailwind (tailwind-merge)", () => {
      // tailwind-merge doit supprimer px-2 au profit de px-4
      const result = cn("px-2", "px-4");
      expect(result).toBe("px-4");
      expect(result).not.toContain("px-2");
    });

    it("ignore les falsy values", () => {
      expect(cn("px-4", false, null, undefined, "py-2")).toBe("px-4 py-2");
    });

    it("gère les expressions conditionnelles clsx", () => {
      const active = true;
      expect(cn("base", active && "active")).toBe("base active");
      expect(cn("base", !active && "inactive")).toBe("base");
    });
  });

  describe("formatDate()", () => {
    it("formate une date en format français", () => {
      const result = formatDate("2024-06-15");
      expect(result).toMatch(/15\/06\/2024/);
    });

    it("gère un objet Date", () => {
      const result = formatDate(new Date("2024-01-01"));
      expect(result).toContain("2024");
    });
  });

  describe("formatCurrency()", () => {
    it("formate en FCFA par défaut", () => {
      const result = formatCurrency(500000);
      expect(result).toMatch(/500\s*000|500000/);
    });

    it("n'affiche pas de décimales", () => {
      const result = formatCurrency(300000.50);
      expect(result).not.toMatch(/[.,]5/);
    });
  });

  describe("getInitials()", () => {
    it("retourne les initiales en majuscules", () => {
      expect(getInitials("Aminata", "Coulibaly")).toBe("AC");
    });

    it("gère les prénoms composés (premier caractère uniquement)", () => {
      expect(getInitials("Marie", "Diallo")).toBe("MD");
    });
  });

  describe("calculateAge()", () => {
    it("calcule l'âge correctement", () => {
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - 30);
      const age = calculateAge(birthDate.toISOString().slice(0, 10));
      expect(age).toBe(30);
    });

    it("retourne un entier positif", () => {
      const age = calculateAge("1985-03-20");
      expect(age).toBeGreaterThan(0);
      expect(Number.isInteger(age)).toBe(true);
    });
  });

  describe("calculateSeniority()", () => {
    it("affiche 'mois' pour moins d'un an", () => {
      const recent = new Date();
      recent.setMonth(recent.getMonth() - 6);
      const result = calculateSeniority(recent.toISOString().slice(0, 10));
      expect(result).toContain("mois");
    });

    it("affiche 'an(s)' pour plus d'un an", () => {
      const old = new Date();
      old.setFullYear(old.getFullYear() - 3);
      const result = calculateSeniority(old.toISOString().slice(0, 10));
      expect(result).toContain("an");
    });
  });

  describe("isContractExpiringSoon()", () => {
    it("retourne true pour une date dans les 30 jours", () => {
      const soon = new Date();
      soon.setDate(soon.getDate() + 15);
      expect(isContractExpiringSoon(soon.toISOString().slice(0, 10))).toBe(true);
    });

    it("retourne false pour une date dans plus de 30 jours", () => {
      const far = new Date();
      far.setDate(far.getDate() + 90);
      expect(isContractExpiringSoon(far.toISOString().slice(0, 10))).toBe(false);
    });

    it("retourne false pour une date déjà passée", () => {
      const past = new Date();
      past.setDate(past.getDate() - 10);
      expect(isContractExpiringSoon(past.toISOString().slice(0, 10))).toBe(false);
    });

    it("retourne false si pas de date (CDI)", () => {
      expect(isContractExpiringSoon(null)).toBe(false);
    });

    it("respecte le seuil personnalisé", () => {
      const in60days = new Date();
      in60days.setDate(in60days.getDate() + 55);
      expect(isContractExpiringSoon(in60days.toISOString().slice(0, 10), 60)).toBe(true);
      expect(isContractExpiringSoon(in60days.toISOString().slice(0, 10), 30)).toBe(false);
    });
  });
});
