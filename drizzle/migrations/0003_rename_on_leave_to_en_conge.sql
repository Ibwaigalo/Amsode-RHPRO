-- Migration: Rename ON_LEAVE to EN_CONGE in work_status enum
-- Created: 2026-04-13

-- Add EN_CONGE value to the enum
ALTER TYPE work_status ADD VALUE IF NOT EXISTS 'EN_CONGE';

-- Update existing ON_LEAVE employees to EN_CONGE
UPDATE employees SET work_status = 'EN_CONGE' WHERE work_status = 'ON_LEAVE';
