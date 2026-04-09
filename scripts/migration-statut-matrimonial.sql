-- Migration SQL pour ajout du statut matrimonial et charges sociales maliennes
-- Exécuter dans Supabase SQL Editor

-- ============================================================
-- ÉTAPE 1: Ajouter colonnes statut matrimonial et enfants à charge
-- ============================================================

-- Ajouter colonne statut_matrimonial avec valeur par défaut
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS statut_matrimonial TEXT NOT NULL DEFAULT 'Célibataire';

-- Ajouter colonne nb_enfants_charge
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS nb_enfants_charge INTEGER DEFAULT 0;

-- ============================================================
-- ÉTAPE 2: Ajouter colonnes pour les charges sociales calculées
-- ============================================================

-- Salaire brut (déjà présent via baseSalary, mais on ajoute des colonnes explicites)
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS salaire_brut NUMERIC(15, 2);

ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS charges_inps NUMERIC(15, 2) DEFAULT 0;

ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS charges_amo NUMERIC(15, 2) DEFAULT 0;

ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS charges_its NUMERIC(15, 2) DEFAULT 0;

ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS salaire_net NUMERIC(15, 2);

-- ============================================================
-- ÉTAPE 3: Mettre à jour les employés existants avec calculs
-- ============================================================

UPDATE employees 
SET 
  salaire_brut = base_salary,
  charges_inps = ROUND(base_salary * 0.036, 0),
  charges_amo = ROUND(base_salary * 0.0306, 0),
  charges_its = 0,
  salaire_net = base_salary - ROUND(base_salary * 0.036, 0) - ROUND(base_salary * 0.0306, 0)
WHERE base_salary IS NOT NULL;

-- ============================================================
-- ÉTAPE 4: Créer fonction de calcul des charges sociales
-- ============================================================

CREATE OR REPLACE FUNCTION calculate_malian_charges(
  p_salaire_brut NUMERIC,
  p_statut_matrimonial TEXT DEFAULT 'Célibataire',
  p_nb_enfants INTEGER DEFAULT 0
)
RETURNS TABLE (
  charges_inps NUMERIC,
  charges_amo NUMERIC,
  charges_its NUMERIC,
  salaire_net NUMERIC,
  taux_abattement NUMERIC
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_inps_rate NUMERIC := 0.036;      -- 3.6%
  v_amo_rate NUMERIC := 0.0306;      -- 3.06%
  v_abattement_base NUMERIC := 0;
  v_abattement_enfants NUMERIC := 0;
  v_salary_after_abattement NUMERIC;
  v_annual_tax NUMERIC := 0;
  v_monthly_its NUMERIC := 0;
BEGIN
  -- Calcul INPS (retraite part salariale)
  charges_inps := ROUND(p_salaire_brut * v_inps_rate, 0);
  
  -- Calcul AMO
  charges_amo := ROUND(p_salaire_brut * v_amo_rate, 0);
  
  -- Calcul abattement familial selon statut
  IF p_statut_matrimonial = 'Marié' THEN
    v_abattement_base := 0.20; -- 20%
  ELSIF p_statut_matrimonial IN ('Veuf', 'Veuve', 'Divorcé', 'Séparé') THEN
    v_abattement_base := 0.15; -- 15%
  ELSE
    v_abattement_base := 0;    -- 0% pour Célibataire
  END IF;
  
  -- Abattement enfants (5% par enfant, max 25%)
  v_abattement_enfants := LEAST(p_nb_enfants * 0.05, 0.25);
  
  -- Taux d'abattement total
  taux_abattement := v_abattement_base + v_abattement_enfants;
  
  -- Salaire après abattement familial
  v_salary_after_abattement := p_salaire_brut * (1 - taux_abattement);
  
  -- Calcul ITS (barème progressif Mali 2026)
  -- Abattement professionnel 25%
  DECLARE
    v_taxable NUMERIC := v_salary_after_abattement * 0.75;
    v_annual_base NUMERIC;
  BEGIN
    v_annual_base := v_taxable * 12;
    
    -- Barème progressif annuel
    IF v_annual_base <= 900000 THEN
      v_annual_tax := 0;
    ELSIF v_annual_base <= 1800000 THEN
      v_annual_tax := (v_annual_base - 900000) * 0.05;
    ELSIF v_annual_base <= 3600000 THEN
      v_annual_tax := 45000 + (v_annual_base - 1800000) * 0.10;
    ELSIF v_annual_base <= 7200000 THEN
      v_annual_tax := 225000 + (v_annual_base - 3600000) * 0.15;
    ELSIF v_annual_base <= 12000000 THEN
      v_annual_tax := 765000 + (v_annual_base - 7200000) * 0.20;
    ELSE
      v_annual_tax := 1725000 + (v_annual_base - 12000000) * 0.30;
    END IF;
    
    v_monthly_its := ROUND(v_annual_tax / 12, 0);
  END;
  
  charges_its := v_monthly_its;
  
  -- Salaire net
  salaire_net := p_salaire_brut - charges_inps - charges_amo - charges_its;
  
  RETURN NEXT;
END;
$$;

-- ============================================================
-- ÉTAPE 5: Créer trigger pour calcul auto lors INSERT/UPDATE
-- ============================================================

CREATE OR REPLACE FUNCTION update_employee_charges()
RETURNS TRIGGER AS $$
DECLARE
  v_result RECORD;
BEGIN
  -- Si le salaire brut change, recalculer les charges
  IF NEW.base_salary IS DISTINCT FROM OLD.base_salary 
     OR NEW.statut_matrimonial IS DISTINCT FROM OLD.statut_matrimonial
     OR NEW.nb_enfants_charge IS DISTINCT FROM OLD.nb_enfants_charge
     OR NEW.base_salary IS NOT NULL THEN
     
    SELECT charges_inps, charges_amo, charges_its, salaire_net
    INTO v_result
    FROM calculate_malian_charges(
      COALESCE(NEW.base_salary, 0),
      COALESCE(NEW.statut_matrimonial, 'Célibataire'),
      COALESCE(NEW.nb_enfants_charge, 0)
    );
    
    NEW.salaire_brut := NEW.base_salary;
    NEW.charges_inps := v_result.charges_inps;
    NEW.charges_amo := v_result.charges_amo;
    NEW.charges_its := v_result.charges_its;
    NEW.salaire_net := v_result.salaire_net;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Appliquer le trigger
DROP TRIGGER IF EXISTS trigger_update_employee_charges ON employees;
CREATE TRIGGER trigger_update_employee_charges
  BEFORE INSERT OR UPDATE ON employees
  FOR EACH ROW
  EXECUTE FUNCTION update_employee_charges();

-- ============================================================
-- ÉTAPE 6: Créer fonction RPC pour mise à jour bulk des statuts
-- ============================================================

CREATE OR REPLACE FUNCTION update_employees_bulk_statut(
  p_employee_ids UUID[],
  p_statut_matrimonial TEXT,
  p_nb_enfants_charge INTEGER DEFAULT 0
)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE employees
  SET 
    statut_matrimonial = p_statut_matrimonial,
    nb_enfants_charge = p_nb_enfants_charge,
    updated_at = NOW()
  WHERE id = ANY(p_employee_ids);
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- ÉTAPE 7: Créer index pour performance
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_employees_statut_matrimonial 
ON employees(statut_matrimonial);

CREATE INDEX IF NOT EXISTS idx_employees_salaire_net 
ON employees(salaire_net);

-- ============================================================
-- Vérification
-- ============================================================

-- Lister les nouvelles colonnes
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'employees' 
AND column_name IN ('statut_matrimonial', 'nb_enfants_charge', 'salaire_brut', 'charges_inps', 'charges_amo', 'charges_its', 'salaire_net');

-- Tester la fonction de calcul
SELECT * FROM calculate_malian_charges(500000, 'Marié', 2);

-- Voir les employés avec leurs charges
SELECT id, first_name, last_name, base_salary, statut_matrimonial, nb_enfants_charge, 
       charges_inps, charges_amo, charges_its, salaire_net
FROM employees 
LIMIT 10;