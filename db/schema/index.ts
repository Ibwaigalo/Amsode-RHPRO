// db/schema/index.ts
import {
  pgTable,
  text,
  varchar,
  integer,
  decimal,
  boolean,
  timestamp,
  date,
  jsonb,
  pgEnum,
  serial,
  uuid,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ─── ENUMS ───────────────────────────────────────────────────────────────────
export const userRoleEnum = pgEnum("user_role", ["ADMIN_RH", "MANAGER", "EMPLOYEE"]);
export const contractTypeEnum = pgEnum("contract_type", ["CDI", "CDD", "STAGE", "CONSULTANT"]);
export const leaveTypeEnum = pgEnum("leave_type", ["ANNUAL", "SICK", "MATERNITY", "PATERNITY", "UNPAID", "SPECIAL"]);
export const leaveStatusEnum = pgEnum("leave_status", ["PENDING", "APPROVED", "REJECTED", "CANCELLED"]);
export const recruitmentStatusEnum = pgEnum("recruitment_status", ["OPEN", "CLOSED", "SUSPENDED"]);
export const applicationStatusEnum = pgEnum("application_status", ["SUBMITTED", "REVIEWING", "SHORTLISTED", "INTERVIEW", "OFFERED", "REJECTED", "HIRED"]);
export const evaluationStatusEnum = pgEnum("evaluation_status", ["DRAFT", "SUBMITTED", "COMPLETED"]);
export const genderEnum = pgEnum("gender", ["M", "F"]);

// ─── DEPARTMENTS ─────────────────────────────────────────────────────────────
export const departments = pgTable("departments", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  code: varchar("code", { length: 50 }).unique().notNull(),
  description: text("description"),
  managerId: uuid("manager_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── POSITIONS ───────────────────────────────────────────────────────────────
export const positions = pgTable("positions", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 255 }).notNull(),
  departmentId: uuid("department_id").references(() => departments.id),
  level: integer("level").default(1),
  minSalary: decimal("min_salary", { precision: 15, scale: 2 }),
  maxSalary: decimal("max_salary", { precision: 15, scale: 2 }),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── EMPLOYEES ───────────────────────────────────────────────────────────────
export const employees = pgTable("employees", {
  id: uuid("id").primaryKey().defaultRandom(),
  employeeNumber: varchar("employee_number", { length: 50 }).unique().notNull(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  phone: varchar("phone", { length: 20 }),
  cinNumber: varchar("cin_number", { length: 50 }).unique(),
  dateOfBirth: date("date_of_birth"),
  gender: genderEnum("gender"),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  photoUrl: text("photo_url"),
  
  // Contract info
  contractType: contractTypeEnum("contract_type").notNull(),
  contractStart: date("contract_start").notNull(),
  contractEnd: date("contract_end"),
  positionId: uuid("position_id").references(() => positions.id),
  departmentId: uuid("department_id").references(() => departments.id),
  managerId: uuid("manager_id").references(() => employees.id),
  baseSalary: decimal("base_salary", { precision: 15, scale: 2 }).notNull(),
  
  // System
  userId: uuid("user_id"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => ({
  emailIdx: index("employee_email_idx").on(t.email),
  deptIdx: index("employee_dept_idx").on(t.departmentId),
}));

// ─── USERS (Auth) ─────────────────────────────────────────────────────────────
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 255 }).unique().notNull(),
  emailVerified: timestamp("email_verified"),
  image: text("image"),
  password: text("password"),
  role: userRoleEnum("role").default("EMPLOYEE").notNull(),
  employeeId: uuid("employee_id").references(() => employees.id),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const accounts = pgTable("accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  provider: text("provider").notNull(),
  providerAccountId: text("provider_account_id").notNull(),
  refresh_token: text("refresh_token"),
  access_token: text("access_token"),
  expires_at: integer("expires_at"),
  token_type: text("token_type"),
  scope: text("scope"),
  id_token: text("id_token"),
  session_state: text("session_state"),
});

export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionToken: text("session_token").unique().notNull(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires").notNull(),
});

export const verificationTokens = pgTable("verification_tokens", {
  identifier: text("identifier").notNull(),
  token: text("token").notNull(),
  expires: timestamp("expires").notNull(),
});

// ─── LEAVE BALANCES ──────────────────────────────────────────────────────────
export const leaveBalances = pgTable("leave_balances", {
  id: uuid("id").primaryKey().defaultRandom(),
  employeeId: uuid("employee_id").references(() => employees.id).notNull(),
  year: integer("year").notNull(),
  annualDays: decimal("annual_days", { precision: 5, scale: 1 }).default("21").notNull(),
  usedAnnualDays: decimal("used_annual_days", { precision: 5, scale: 1 }).default("0").notNull(),
  sickDays: decimal("sick_days", { precision: 5, scale: 1 }).default("15").notNull(),
  usedSickDays: decimal("used_sick_days", { precision: 5, scale: 1 }).default("0").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── LEAVE REQUESTS ───────────────────────────────────────────────────────────
export const leaveRequests = pgTable("leave_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  employeeId: uuid("employee_id").references(() => employees.id).notNull(),
  leaveType: leaveTypeEnum("leave_type").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  totalDays: decimal("total_days", { precision: 5, scale: 1 }).notNull(),
  reason: text("reason"),
  status: leaveStatusEnum("status").default("PENDING").notNull(),
  approvedById: uuid("approved_by_id").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  rejectionReason: text("rejection_reason"),
  documents: jsonb("documents").default("[]"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── PAYROLL ─────────────────────────────────────────────────────────────────
export const payrollPeriods = pgTable("payroll_periods", {
  id: uuid("id").primaryKey().defaultRandom(),
  month: integer("month").notNull(),
  year: integer("year").notNull(),
  status: varchar("status", { length: 20 }).default("DRAFT").notNull(),
  processedAt: timestamp("processed_at"),
  processedById: uuid("processed_by_id").references(() => users.id),
  totalGross: decimal("total_gross", { precision: 15, scale: 2 }).default("0"),
  totalNet: decimal("total_net", { precision: 15, scale: 2 }).default("0"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const payslips = pgTable("payslips", {
  id: uuid("id").primaryKey().defaultRandom(),
  periodId: uuid("period_id").references(() => payrollPeriods.id).notNull(),
  employeeId: uuid("employee_id").references(() => employees.id).notNull(),
  baseSalary: decimal("base_salary", { precision: 15, scale: 2 }).notNull(),
  
  // Primes / Allowances
  transportAllowance: decimal("transport_allowance", { precision: 15, scale: 2 }).default("0"),
  housingAllowance: decimal("housing_allowance", { precision: 15, scale: 2 }).default("0"),
  performanceBonus: decimal("performance_bonus", { precision: 15, scale: 2 }).default("0"),
  otherAllowances: decimal("other_allowances", { precision: 15, scale: 2 }).default("0"),
  grossSalary: decimal("gross_salary", { precision: 15, scale: 2 }).notNull(),
  
  // Retenues / Deductions
  cnssEmployee: decimal("cnss_employee", { precision: 15, scale: 2 }).default("0"),
  cnssEmployer: decimal("cnss_employer", { precision: 15, scale: 2 }).default("0"),
  incomeTax: decimal("income_tax", { precision: 15, scale: 2 }).default("0"),
  otherDeductions: decimal("other_deductions", { precision: 15, scale: 2 }).default("0"),
  totalDeductions: decimal("total_deductions", { precision: 15, scale: 2 }).notNull(),
  netSalary: decimal("net_salary", { precision: 15, scale: 2 }).notNull(),
  
  pdfUrl: text("pdf_url"),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── RECRUITMENT ──────────────────────────────────────────────────────────────
export const jobPostings = pgTable("job_postings", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 255 }).notNull(),
  departmentId: uuid("department_id").references(() => departments.id),
  positionId: uuid("position_id").references(() => positions.id),
  description: text("description").notNull(),
  requirements: text("requirements"),
  contractType: contractTypeEnum("contract_type"),
  salaryMin: decimal("salary_min", { precision: 15, scale: 2 }),
  salaryMax: decimal("salary_max", { precision: 15, scale: 2 }),
  location: varchar("location", { length: 255 }),
  deadline: date("deadline"),
  status: recruitmentStatusEnum("status").default("OPEN").notNull(),
  createdById: uuid("created_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const jobApplications = pgTable("job_applications", {
  id: uuid("id").primaryKey().defaultRandom(),
  jobPostingId: uuid("job_posting_id").references(() => jobPostings.id).notNull(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  cvUrl: text("cv_url"),
  coverLetter: text("cover_letter"),
  status: applicationStatusEnum("status").default("SUBMITTED").notNull(),
  notes: text("notes"),
  interviewDate: timestamp("interview_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── ONBOARDING ───────────────────────────────────────────────────────────────
export const onboardingChecklists = pgTable("onboarding_checklists", {
  id: uuid("id").primaryKey().defaultRandom(),
  employeeId: uuid("employee_id").references(() => employees.id).notNull(),
  tasks: jsonb("tasks").default("[]").notNull(),
  completedTasks: jsonb("completed_tasks").default("[]").notNull(),
  completionPercent: integer("completion_percent").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── EVALUATIONS ─────────────────────────────────────────────────────────────
export const evaluations = pgTable("evaluations", {
  id: uuid("id").primaryKey().defaultRandom(),
  employeeId: uuid("employee_id").references(() => employees.id).notNull(),
  evaluatorId: uuid("evaluator_id").references(() => users.id).notNull(),
  period: varchar("period", { length: 50 }).notNull(),
  type: varchar("type", { length: 50 }).default("ANNUAL"),
  scores: jsonb("scores").default("{}").notNull(),
  overallScore: decimal("overall_score", { precision: 4, scale: 2 }),
  strengths: text("strengths"),
  improvements: text("improvements"),
  goals: jsonb("goals").default("[]"),
  status: evaluationStatusEnum("status").default("DRAFT").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── TRAININGS ───────────────────────────────────────────────────────────────
export const trainings = pgTable("trainings", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  provider: varchar("provider", { length: 255 }),
  duration: integer("duration"),
  durationUnit: varchar("duration_unit", { length: 20 }).default("hours"),
  cost: decimal("cost", { precision: 15, scale: 2 }),
  startDate: date("start_date"),
  endDate: date("end_date"),
  maxParticipants: integer("max_participants"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const trainingEnrollments = pgTable("training_enrollments", {
  id: uuid("id").primaryKey().defaultRandom(),
  trainingId: uuid("training_id").references(() => trainings.id).notNull(),
  employeeId: uuid("employee_id").references(() => employees.id).notNull(),
  status: varchar("status", { length: 20 }).default("ENROLLED"),
  completedAt: timestamp("completed_at"),
  certificateUrl: text("certificate_url"),
  score: decimal("score", { precision: 5, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── DOCUMENTS ───────────────────────────────────────────────────────────────
export const documents = pgTable("documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  employeeId: uuid("employee_id").references(() => employees.id),
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 100 }).notNull(),
  fileUrl: text("file_url").notNull(),
  fileSize: integer("file_size"),
  mimeType: varchar("mime_type", { length: 100 }),
  description: text("description"),
  expiresAt: date("expires_at"),
  uploadedById: uuid("uploaded_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── AUDIT LOGS ──────────────────────────────────────────────────────────────
export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id),
  action: varchar("action", { length: 100 }).notNull(),
  entity: varchar("entity", { length: 100 }).notNull(),
  entityId: uuid("entity_id"),
  oldValues: jsonb("old_values"),
  newValues: jsonb("new_values"),
  ipAddress: varchar("ip_address", { length: 45 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── NOTIFICATIONS ───────────────────────────────────────────────────────────
export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  type: varchar("type", { length: 50 }).default("INFO"),
  isRead: boolean("is_read").default(false).notNull(),
  link: text("link"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── ORGANIZATION SETTINGS ───────────────────────────────────────────────────
export const organizationSettings = pgTable("organization_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).default("AMSODE").notNull(),
  logoUrl: text("logo_url"),
  address: text("address"),
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 255 }),
  website: text("website"),
  cnssNumber: varchar("cnss_number", { length: 100 }),
  presidentName: varchar("president_name", { length: 255 }),
  presidentSignatureUrl: text("president_signature_url"),
  currency: varchar("currency", { length: 10 }).default("XOF"),
  fiscalYear: integer("fiscal_year").default(2024),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── RELATIONS ───────────────────────────────────────────────────────────────
export const employeesRelations = relations(employees, ({ one, many }) => ({
  department: one(departments, { fields: [employees.departmentId], references: [departments.id] }),
  position: one(positions, { fields: [employees.positionId], references: [positions.id] }),
  manager: one(employees, { fields: [employees.managerId], references: [employees.id] }),
  user: one(users, { fields: [employees.userId], references: [users.id] }),
  payslips: many(payslips),
  leaveRequests: many(leaveRequests),
  evaluations: many(evaluations),
  enrollments: many(trainingEnrollments),
  documents: many(documents),
}));

export const departmentsRelations = relations(departments, ({ many, one }) => ({
  employees: many(employees),
  positions: many(positions),
  manager: one(employees, { fields: [departments.managerId], references: [employees.id] }),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  employee: one(employees, { fields: [users.employeeId], references: [employees.id] }),
  notifications: many(notifications),
}));
