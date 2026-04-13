import {
  pgTable, text, integer, timestamp, boolean, decimal, date, pgEnum, uuid, jsonb, varchar
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const roleEnum = pgEnum('role', ['ADMIN_RH', 'MANAGER', 'EMPLOYE', 'PRESIDENT']);
export const contractTypeEnum = pgEnum('contract_type', ['CDI', 'CDD', 'STAGE', 'CONSULTANT']);
export const genderEnum = pgEnum('gender', ['M', 'F']);
export const leaveTypeEnum = pgEnum('leave_type', ['CONGE_PAYE', 'MALADIE', 'MATERNITE', 'PATERNITE', 'SANS_SOLDE', 'AUTRE']);
export const leaveStatusEnum = pgEnum('leave_status', ['PENDING', 'PENDING_PRESIDENT', 'PENDING_RH', 'APPROVED', 'REJECTED', 'CANCELLED']);
export const recruitmentStatusEnum = pgEnum('recruitment_status', ['OUVERT', 'EN_COURS', 'FERME', 'ANNULE']);
export const applicationStatusEnum = pgEnum('application_status', ['RECU', 'SHORTLIST', 'ENTRETIEN', 'OFFRE', 'ACCEPTE', 'REFUSE']);
export const evaluationStatusEnum = pgEnum('evaluation_status', ['BROUILLON', 'EN_COURS', 'COMPLETE', 'VALIDE']);
export const trainingStatusEnum = pgEnum('training_status', ['PLANIFIE', 'EN_COURS', 'TERMINE', 'ANNULE']);
export const documentTypeEnum = pgEnum('document_type', ['CONTRAT', 'FICHE_PAIE', 'ATTESTATION', 'FORMATION', 'AUTRE']);

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name'),
  email: text('email').notNull().unique(),
  emailVerified: timestamp('email_verified'),
  image: text('image'),
  password: text('password'),
  role: roleEnum('role').default('EMPLOYE').notNull(),
  employeeId: uuid('employee_id'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const accounts = pgTable('accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  provider: text('provider').notNull(),
  providerAccountId: text('provider_account_id').notNull(),
  refreshToken: text('refresh_token'),
  accessToken: text('access_token'),
  expiresAt: integer('expires_at'),
  tokenType: text('token_type'),
  scope: text('scope'),
  idToken: text('id_token'),
  sessionState: text('session_state'),
});

export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionToken: text('session_token').notNull().unique(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires').notNull(),
});

export const verificationTokens = pgTable('verification_tokens', {
  identifier: text('identifier').notNull(),
  token: text('token').notNull().unique(),
  expires: timestamp('expires').notNull(),
});

export const departments = pgTable('departments', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  code: varchar('code', { length: 10 }).notNull().unique(),
  description: text('description'),
  managerId: uuid('manager_id'),
  budget: decimal('budget', { precision: 15, scale: 2 }),
  headcount: integer('headcount').default(0),
  location: text('location'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const positions = pgTable('positions', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  departmentId: uuid('department_id').references(() => departments.id),
  level: text('level'),
  minSalary: decimal('min_salary', { precision: 15, scale: 2 }),
  maxSalary: decimal('max_salary', { precision: 15, scale: 2 }),
  description: text('description'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const matrimonialStatusEnum = pgEnum('matrimonial_status', ['CELIBATAIRE', 'MARIE', 'VEUF', 'DIVORCE', 'SEPARE']);
export const workStatusEnum = pgEnum('work_status', ['ACTIVE', 'ON_TRIAL', 'EN_CONGE', 'SUSPENDED', 'RESIGNED', 'TERMINATED', 'CONTRACT_ENDED', 'JOB_ABANDONMENT', 'MUTUAL_AGREEMENT', 'RETIRED']);

export const employees = pgTable('employees', {
  id: uuid('id').primaryKey().defaultRandom(),
  employeeNumber: varchar('employee_number', { length: 20 }).notNull().unique(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  cin: varchar('cin', { length: 20 }),
  dateOfBirth: date('date_of_birth'),
  gender: genderEnum('gender'),
  nationality: text('nationality').default('Malienne'),
  phone: text('phone'),
  personalEmail: text('personal_email'),
  workEmail: text('work_email'),
  address: text('address'),
  city: text('city').default('Bamako'),
  zone: text('zone').default('Bamako'),
  photoUrl: text('photo_url'),
  contractType: contractTypeEnum('contract_type').default('CDI'),
  startDate: date('start_date').notNull(),
  endDate: date('end_date'),
  baseSalary: decimal('base_salary', { precision: 15, scale: 2 }).notNull(),
  statutMatrimonial: text('statut_matrimonial').default('Célibataire'),
  nbEnfantsCharge: integer('nb_enfants_charge').default(0),
  positionId: uuid('position_id').references(() => positions.id),
  departmentId: uuid('department_id').references(() => departments.id),
  managerId: uuid('manager_id'),
  isActive: boolean('is_active').default(true),
  role: varchar('role', { length: 20 }).default('EMPLOYE'),
  userId: uuid('user_id').references(() => users.id),
  leaveBalance: integer('leave_balance').default(18),
  emergencyContact: text('emergency_contact'),
  emergencyPhone: text('emergency_phone'),
  // Nouveaux champs
  bloodGroup: varchar('blood_group', { length: 10 }),
  educationLevel: varchar('education_level', { length: 100 }),
  fieldOfStudy: varchar('field_of_study', { length: 100 }),
  firstContractDate: date('first_contract_date'),
  contractRenewals: integer('contract_renewals').default(0),
  inpsNumber: varchar('inps_number', { length: 50 }),
  amoNumber: varchar('amo_number', { length: 50 }),
  departureReason: text('departure_reason'),
  workStatus: workStatusEnum('work_status').default('ACTIVE'),
  statusDate: date('status_date'),
  statusReason: text('status_reason'),
  noticePeriodEnd: date('notice_period_end'),
  exitInterviewDone: boolean('exit_interview_done').default(false),
  // Coût salarial global (inclut tous les avantages)
  globalSalaryCost: decimal('global_salary_cost', { precision: 15, scale: 2 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const employeeAuditLogs = pgTable('employee_audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  employeeId: uuid('employee_id').references(() => employees.id),
  changedBy: uuid('changed_by').references(() => users.id),
  field: text('field').notNull(),
  oldValue: text('old_value'),
  newValue: text('new_value'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const leaveRequests = pgTable('leave_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  employeeId: uuid('employee_id').references(() => employees.id).notNull(),
  leaveType: leaveTypeEnum('leave_type').notNull(),
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  daysCount: integer('days_count').notNull(),
  reason: text('reason'),
  status: leaveStatusEnum('status').default('PENDING'),
  approverId: uuid('approver_id').references(() => employees.id),
  approvedAt: timestamp('approved_at'),
  approverNote: text('approver_note'),
  attachmentUrl: text('attachment_url'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const payrollPeriods = pgTable('payroll_periods', {
  id: uuid('id').primaryKey().defaultRandom(),
  month: integer('month').notNull(),
  year: integer('year').notNull(),
  status: text('status').default('BROUILLON'),
  processedBy: uuid('processed_by').references(() => users.id),
  processedAt: timestamp('processed_at'),
  totalGross: decimal('total_gross', { precision: 15, scale: 2 }),
  totalNet: decimal('total_net', { precision: 15, scale: 2 }),
  createdAt: timestamp('created_at').defaultNow(),
});

export const payslips = pgTable('payslips', {
  id: uuid('id').primaryKey().defaultRandom(),
  periodId: uuid('period_id').references(() => payrollPeriods.id).notNull(),
  employeeId: uuid('employee_id').references(() => employees.id).notNull(),
  baseSalary: decimal('base_salary', { precision: 15, scale: 2 }).notNull(),
  transportAllowance: decimal('transport_allowance', { precision: 15, scale: 2 }).default('0'),
  housingAllowance: decimal('housing_allowance', { precision: 15, scale: 2 }).default('0'),
  mealAllowance: decimal('meal_allowance', { precision: 15, scale: 2 }).default('0'),
  performanceBonus: decimal('performance_bonus', { precision: 15, scale: 2 }).default('0'),
  otherBonuses: decimal('other_bonuses', { precision: 15, scale: 2 }).default('0'),
  grossSalary: decimal('gross_salary', { precision: 15, scale: 2 }).notNull(),
  cnssEmployee: decimal('cnss_employee', { precision: 15, scale: 2 }).default('0'),
  cnssEmployer: decimal('cnss_employer', { precision: 15, scale: 2 }).default('0'),
  imuEmployee: decimal('imu_employee', { precision: 15, scale: 2 }).default('0'),
  advanceDeduction: decimal('advance_deduction', { precision: 15, scale: 2 }).default('0'),
  otherDeductions: decimal('other_deductions', { precision: 15, scale: 2 }).default('0'),
  netSalary: decimal('net_salary', { precision: 15, scale: 2 }).notNull(),
  pdfUrl: text('pdf_url'),
  isEmailSent: boolean('is_email_sent').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

export const jobPostings = pgTable('job_postings', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  positionId: uuid('position_id').references(() => positions.id),
  departmentId: uuid('department_id').references(() => departments.id),
  description: text('description').notNull(),
  requirements: text('requirements'),
  contractType: contractTypeEnum('contract_type').default('CDI'),
  salaryMin: decimal('salary_min', { precision: 15, scale: 2 }),
  salaryMax: decimal('salary_max', { precision: 15, scale: 2 }),
  location: text('location').default('Bamako, Mali'),
  deadline: date('deadline'),
  status: recruitmentStatusEnum('status').default('OUVERT'),
  isPublic: boolean('is_public').default(true),
  applicantsCount: integer('applicants_count').default(0),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const applications = pgTable('applications', {
  id: uuid('id').primaryKey().defaultRandom(),
  jobPostingId: uuid('job_posting_id').references(() => jobPostings.id).notNull(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  email: text('email').notNull(),
  phone: text('phone'),
  cvUrl: text('cv_url'),
  coverLetter: text('cover_letter'),
  status: applicationStatusEnum('status').default('RECU'),
  interviewDate: timestamp('interview_date'),
  notes: text('notes'),
  score: integer('score'),
  reviewedBy: uuid('reviewed_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const onboardingChecklists = pgTable('onboarding_checklists', {
  id: uuid('id').primaryKey().defaultRandom(),
  employeeId: uuid('employee_id').references(() => employees.id).notNull(),
  items: jsonb('items').notNull().default('[]'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const evaluations = pgTable('evaluations', {
  id: uuid('id').primaryKey().defaultRandom(),
  employeeId: uuid('employee_id').references(() => employees.id).notNull(),
  evaluatorId: uuid('evaluator_id').references(() => employees.id),
  period: text('period').notNull(),
  type: text('type').default('ANNUELLE'),
  status: evaluationStatusEnum('status').default('BROUILLON'),
  objectives: jsonb('objectives').default('[]'),
  competencies: jsonb('competencies').default('[]'),
  globalScore: decimal('global_score', { precision: 4, scale: 2 }),
  comments: text('comments'),
  employeeComments: text('employee_comments'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const trainings = pgTable('trainings', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  description: text('description'),
  provider: text('provider'),
  location: text('location'),
  startDate: date('start_date'),
  endDate: date('end_date'),
  durationHours: integer('duration_hours'),
  cost: decimal('cost', { precision: 15, scale: 2 }),
  maxParticipants: integer('max_participants'),
  status: trainingStatusEnum('status').default('PLANIFIE'),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
});

export const trainingEnrollments = pgTable('training_enrollments', {
  id: uuid('id').primaryKey().defaultRandom(),
  trainingId: uuid('training_id').references(() => trainings.id).notNull(),
  employeeId: uuid('employee_id').references(() => employees.id).notNull(),
  status: text('status').default('INSCRIT'),
  completedAt: timestamp('completed_at'),
  certificateUrl: text('certificate_url'),
  score: integer('score'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const documents = pgTable('documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  employeeId: uuid('employee_id').references(() => employees.id),
  type: documentTypeEnum('type').notNull(),
  title: text('title').notNull(),
  fileUrl: text('file_url').notNull(),
  fileSize: integer('file_size'),
  mimeType: text('mime_type'),
  isConfidential: boolean('is_confidential').default(false),
  uploadedBy: uuid('uploaded_by').references(() => users.id),
  expiresAt: date('expires_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  type: text('type').default('INFO'),
  isRead: boolean('is_read').default(false),
  link: text('link'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const orgSettings = pgTable('org_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  key: text('key').notNull().unique(),
  value: text('value'),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const employeesRelations = relations(employees, ({ one, many }) => ({
  department: one(departments, { fields: [employees.departmentId], references: [departments.id] }),
  position: one(positions, { fields: [employees.positionId], references: [positions.id] }),
  user: one(users, { fields: [employees.userId], references: [users.id] }),
  leaveRequests: many(leaveRequests),
  payslips: many(payslips),
  evaluations: many(evaluations),
  trainings: many(trainingEnrollments),
  documents: many(documents),
}));

export const departmentsRelations = relations(departments, ({ many }) => ({
  employees: many(employees),
  positions: many(positions),
}));

export type User = typeof users.$inferSelect;
export type Employee = typeof employees.$inferSelect;
export type Department = typeof departments.$inferSelect;
export type Position = typeof positions.$inferSelect;
export type LeaveRequest = typeof leaveRequests.$inferSelect;
export type Payslip = typeof payslips.$inferSelect;
export type PayrollPeriod = typeof payrollPeriods.$inferSelect;
export type JobPosting = typeof jobPostings.$inferSelect;
export type Application = typeof applications.$inferSelect;
export type Evaluation = typeof evaluations.$inferSelect;
export type Training = typeof trainings.$inferSelect;
export type Document = typeof documents.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
