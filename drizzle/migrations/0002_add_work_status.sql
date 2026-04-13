-- Migration: Add work status fields for employee lifecycle management
-- Created: 2026-04-13

-- Create the new work_status enum
CREATE TYPE work_status AS ENUM ('ACTIVE', 'ON_TRIAL', 'ON_LEAVE', 'SUSPENDED', 'RESIGNED', 'TERMINATED', 'CONTRACT_ENDED', 'JOB_ABANDONMENT', 'MUTUAL_AGREEMENT', 'RETIRED');

-- Rename existing employee_status enum to matrimonial_status
ALTER TYPE employee_status RENAME TO matrimonial_status;

-- Add new columns to employees table
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS work_status work_status DEFAULT 'ACTIVE',
ADD COLUMN IF NOT EXISTS status_date DATE,
ADD COLUMN IF NOT EXISTS status_reason TEXT,
ADD COLUMN IF NOT EXISTS notice_period_end DATE,
ADD COLUMN IF NOT EXISTS exit_interview_done BOOLEAN DEFAULT FALSE;

-- Backfill existing active employees with ACTIVE status
UPDATE employees SET work_status = 'ACTIVE' WHERE is_active = true AND work_status IS NULL;
