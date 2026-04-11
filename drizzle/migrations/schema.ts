import { pgTable, foreignKey, uuid, text, integer, timestamp, unique, varchar, numeric, boolean, jsonb, date, pgEnum } from "drizzle-orm/pg-core"
  import { sql } from "drizzle-orm"

export const applicationStatus = pgEnum("application_status", ['RECU', 'SHORTLIST', 'ENTRETIEN', 'OFFRE', 'ACCEPTE', 'REFUSE'])
export const contractType = pgEnum("contract_type", ['CDI', 'CDD', 'STAGE', 'CONSULTANT'])
export const documentType = pgEnum("document_type", ['CONTRAT', 'FICHE_PAIE', 'ATTESTATION', 'FORMATION', 'AUTRE'])
export const evaluationStatus = pgEnum("evaluation_status", ['BROUILLON', 'EN_COURS', 'COMPLETE', 'VALIDE'])
export const gender = pgEnum("gender", ['M', 'F'])
export const leaveStatus = pgEnum("leave_status", ['PENDING', 'PENDING_PRESIDENT', 'PENDING_RH', 'APPROVED', 'REJECTED', 'CANCELLED'])
export const leaveType = pgEnum("leave_type", ['CONGE_PAYE', 'MALADIE', 'MATERNITE', 'PATERNITE', 'SANS_SOLDE', 'AUTRE'])
export const recruitmentStatus = pgEnum("recruitment_status", ['OUVERT', 'EN_COURS', 'FERME', 'ANNULE'])
export const role = pgEnum("role", ['ADMIN_RH', 'MANAGER', 'EMPLOYE', 'PRESIDENT'])
export const trainingStatus = pgEnum("training_status", ['PLANIFIE', 'EN_COURS', 'TERMINE', 'ANNULE'])



export const accounts = pgTable("accounts", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	type: text("type").notNull(),
	provider: text("provider").notNull(),
	providerAccountId: text("provider_account_id").notNull(),
	refreshToken: text("refresh_token"),
	accessToken: text("access_token"),
	expiresAt: integer("expires_at"),
	tokenType: text("token_type"),
	scope: text("scope"),
	idToken: text("id_token"),
	sessionState: text("session_state"),
},
(table) => {
	return {
		accountsUserIdUsersIdFk: foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "accounts_user_id_users_id_fk"
		}).onDelete("cascade"),
	}
});

export const applications = pgTable("applications", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	jobPostingId: uuid("job_posting_id").notNull(),
	firstName: text("first_name").notNull(),
	lastName: text("last_name").notNull(),
	email: text("email").notNull(),
	phone: text("phone"),
	cvUrl: text("cv_url"),
	coverLetter: text("cover_letter"),
	status: applicationStatus("status").default('RECU'),
	interviewDate: timestamp("interview_date", { mode: 'string' }),
	notes: text("notes"),
	score: integer("score"),
	reviewedBy: uuid("reviewed_by"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
},
(table) => {
	return {
		applicationsJobPostingIdJobPostingsIdFk: foreignKey({
			columns: [table.jobPostingId],
			foreignColumns: [jobPostings.id],
			name: "applications_job_posting_id_job_postings_id_fk"
		}),
		applicationsReviewedByUsersIdFk: foreignKey({
			columns: [table.reviewedBy],
			foreignColumns: [users.id],
			name: "applications_reviewed_by_users_id_fk"
		}),
	}
});

export const departments = pgTable("departments", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	name: text("name").notNull(),
	code: varchar("code", { length: 10 }).notNull(),
	description: text("description"),
	managerId: uuid("manager_id"),
	budget: numeric("budget", { precision: 15, scale:  2 }),
	headcount: integer("headcount").default(0),
	location: text("location"),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
},
(table) => {
	return {
		departmentsCodeUnique: unique("departments_code_unique").on(table.code),
	}
});

export const employeeAuditLogs = pgTable("employee_audit_logs", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	employeeId: uuid("employee_id"),
	changedBy: uuid("changed_by"),
	field: text("field").notNull(),
	oldValue: text("old_value"),
	newValue: text("new_value"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
},
(table) => {
	return {
		employeeAuditLogsChangedByUsersIdFk: foreignKey({
			columns: [table.changedBy],
			foreignColumns: [users.id],
			name: "employee_audit_logs_changed_by_users_id_fk"
		}),
		employeeAuditLogsEmployeeIdEmployeesIdFk: foreignKey({
			columns: [table.employeeId],
			foreignColumns: [employees.id],
			name: "employee_audit_logs_employee_id_employees_id_fk"
		}),
	}
});

export const evaluations = pgTable("evaluations", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	employeeId: uuid("employee_id").notNull(),
	evaluatorId: uuid("evaluator_id"),
	period: text("period").notNull(),
	type: text("type").default('ANNUELLE'),
	status: evaluationStatus("status").default('BROUILLON'),
	objectives: jsonb("objectives").default([]),
	competencies: jsonb("competencies").default([]),
	globalScore: numeric("global_score", { precision: 4, scale:  2 }),
	comments: text("comments"),
	employeeComments: text("employee_comments"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
},
(table) => {
	return {
		evaluationsEmployeeIdEmployeesIdFk: foreignKey({
			columns: [table.employeeId],
			foreignColumns: [employees.id],
			name: "evaluations_employee_id_employees_id_fk"
		}),
		evaluationsEvaluatorIdEmployeesIdFk: foreignKey({
			columns: [table.evaluatorId],
			foreignColumns: [employees.id],
			name: "evaluations_evaluator_id_employees_id_fk"
		}),
	}
});

export const jobPostings = pgTable("job_postings", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	title: text("title").notNull(),
	positionId: uuid("position_id"),
	departmentId: uuid("department_id"),
	description: text("description").notNull(),
	requirements: text("requirements"),
	contractType: contractType("contract_type").default('CDI'),
	salaryMin: numeric("salary_min", { precision: 15, scale:  2 }),
	salaryMax: numeric("salary_max", { precision: 15, scale:  2 }),
	location: text("location").default('Bamako, Mali'),
	deadline: date("deadline"),
	status: recruitmentStatus("status").default('OUVERT'),
	isPublic: boolean("is_public").default(true),
	applicantsCount: integer("applicants_count").default(0),
	createdBy: uuid("created_by"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
},
(table) => {
	return {
		jobPostingsCreatedByUsersIdFk: foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "job_postings_created_by_users_id_fk"
		}),
		jobPostingsDepartmentIdDepartmentsIdFk: foreignKey({
			columns: [table.departmentId],
			foreignColumns: [departments.id],
			name: "job_postings_department_id_departments_id_fk"
		}),
		jobPostingsPositionIdPositionsIdFk: foreignKey({
			columns: [table.positionId],
			foreignColumns: [positions.id],
			name: "job_postings_position_id_positions_id_fk"
		}),
	}
});

export const notifications = pgTable("notifications", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	title: text("title").notNull(),
	message: text("message").notNull(),
	type: text("type").default('INFO'),
	isRead: boolean("is_read").default(false),
	link: text("link"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
},
(table) => {
	return {
		notificationsUserIdUsersIdFk: foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "notifications_user_id_users_id_fk"
		}),
	}
});

export const orgSettings = pgTable("org_settings", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	key: text("key").notNull(),
	value: text("value"),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
},
(table) => {
	return {
		orgSettingsKeyUnique: unique("org_settings_key_unique").on(table.key),
	}
});

export const payrollPeriods = pgTable("payroll_periods", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	month: integer("month").notNull(),
	year: integer("year").notNull(),
	status: text("status").default('BROUILLON'),
	processedBy: uuid("processed_by"),
	processedAt: timestamp("processed_at", { mode: 'string' }),
	totalGross: numeric("total_gross", { precision: 15, scale:  2 }),
	totalNet: numeric("total_net", { precision: 15, scale:  2 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
},
(table) => {
	return {
		payrollPeriodsProcessedByUsersIdFk: foreignKey({
			columns: [table.processedBy],
			foreignColumns: [users.id],
			name: "payroll_periods_processed_by_users_id_fk"
		}),
	}
});

export const payslips = pgTable("payslips", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	periodId: uuid("period_id").notNull(),
	employeeId: uuid("employee_id").notNull(),
	baseSalary: numeric("base_salary", { precision: 15, scale:  2 }).notNull(),
	transportAllowance: numeric("transport_allowance", { precision: 15, scale:  2 }).default('0'),
	housingAllowance: numeric("housing_allowance", { precision: 15, scale:  2 }).default('0'),
	mealAllowance: numeric("meal_allowance", { precision: 15, scale:  2 }).default('0'),
	performanceBonus: numeric("performance_bonus", { precision: 15, scale:  2 }).default('0'),
	otherBonuses: numeric("other_bonuses", { precision: 15, scale:  2 }).default('0'),
	grossSalary: numeric("gross_salary", { precision: 15, scale:  2 }).notNull(),
	cnssEmployee: numeric("cnss_employee", { precision: 15, scale:  2 }).default('0'),
	cnssEmployer: numeric("cnss_employer", { precision: 15, scale:  2 }).default('0'),
	imuEmployee: numeric("imu_employee", { precision: 15, scale:  2 }).default('0'),
	advanceDeduction: numeric("advance_deduction", { precision: 15, scale:  2 }).default('0'),
	otherDeductions: numeric("other_deductions", { precision: 15, scale:  2 }).default('0'),
	netSalary: numeric("net_salary", { precision: 15, scale:  2 }).notNull(),
	pdfUrl: text("pdf_url"),
	isEmailSent: boolean("is_email_sent").default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
},
(table) => {
	return {
		payslipsEmployeeIdEmployeesIdFk: foreignKey({
			columns: [table.employeeId],
			foreignColumns: [employees.id],
			name: "payslips_employee_id_employees_id_fk"
		}),
		payslipsPeriodIdPayrollPeriodsIdFk: foreignKey({
			columns: [table.periodId],
			foreignColumns: [payrollPeriods.id],
			name: "payslips_period_id_payroll_periods_id_fk"
		}),
	}
});

export const positions = pgTable("positions", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	title: text("title").notNull(),
	departmentId: uuid("department_id"),
	level: text("level"),
	minSalary: numeric("min_salary", { precision: 15, scale:  2 }),
	maxSalary: numeric("max_salary", { precision: 15, scale:  2 }),
	description: text("description"),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
},
(table) => {
	return {
		positionsDepartmentIdDepartmentsIdFk: foreignKey({
			columns: [table.departmentId],
			foreignColumns: [departments.id],
			name: "positions_department_id_departments_id_fk"
		}),
	}
});

export const sessions = pgTable("sessions", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	sessionToken: text("session_token").notNull(),
	userId: uuid("user_id").notNull(),
	expires: timestamp("expires", { mode: 'string' }).notNull(),
},
(table) => {
	return {
		sessionsUserIdUsersIdFk: foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "sessions_user_id_users_id_fk"
		}).onDelete("cascade"),
		sessionsSessionTokenUnique: unique("sessions_session_token_unique").on(table.sessionToken),
	}
});

export const trainings = pgTable("trainings", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	title: text("title").notNull(),
	description: text("description"),
	provider: text("provider"),
	location: text("location"),
	startDate: date("start_date"),
	endDate: date("end_date"),
	durationHours: integer("duration_hours"),
	cost: numeric("cost", { precision: 15, scale:  2 }),
	maxParticipants: integer("max_participants"),
	status: trainingStatus("status").default('PLANIFIE'),
	createdBy: uuid("created_by"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
},
(table) => {
	return {
		trainingsCreatedByUsersIdFk: foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "trainings_created_by_users_id_fk"
		}),
	}
});

export const users = pgTable("users", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	name: text("name"),
	email: text("email").notNull(),
	emailVerified: timestamp("email_verified", { mode: 'string' }),
	image: text("image"),
	password: text("password"),
	role: role("role").default('EMPLOYE').notNull(),
	employeeId: uuid("employee_id"),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
},
(table) => {
	return {
		usersEmailUnique: unique("users_email_unique").on(table.email),
	}
});

export const verificationTokens = pgTable("verification_tokens", {
	identifier: text("identifier").notNull(),
	token: text("token").notNull(),
	expires: timestamp("expires", { mode: 'string' }).notNull(),
},
(table) => {
	return {
		verificationTokensTokenUnique: unique("verification_tokens_token_unique").on(table.token),
	}
});

export const documents = pgTable("documents", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	employeeId: uuid("employee_id"),
	type: documentType("type").notNull(),
	title: text("title").notNull(),
	fileUrl: text("file_url").notNull(),
	fileSize: integer("file_size"),
	mimeType: text("mime_type"),
	isConfidential: boolean("is_confidential").default(false),
	uploadedBy: uuid("uploaded_by"),
	expiresAt: date("expires_at"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
},
(table) => {
	return {
		documentsEmployeeIdEmployeesIdFk: foreignKey({
			columns: [table.employeeId],
			foreignColumns: [employees.id],
			name: "documents_employee_id_employees_id_fk"
		}),
		documentsUploadedByUsersIdFk: foreignKey({
			columns: [table.uploadedBy],
			foreignColumns: [users.id],
			name: "documents_uploaded_by_users_id_fk"
		}),
	}
});

export const leaveRequests = pgTable("leave_requests", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	employeeId: uuid("employee_id").notNull(),
	leaveType: leaveType("leave_type").notNull(),
	startDate: date("start_date").notNull(),
	endDate: date("end_date").notNull(),
	daysCount: integer("days_count").notNull(),
	reason: text("reason"),
	status: leaveStatus("status").default('PENDING'),
	approverId: uuid("approver_id"),
	approvedAt: timestamp("approved_at", { mode: 'string' }),
	approverNote: text("approver_note"),
	attachmentUrl: text("attachment_url"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
},
(table) => {
	return {
		leaveRequestsApproverIdEmployeesIdFk: foreignKey({
			columns: [table.approverId],
			foreignColumns: [employees.id],
			name: "leave_requests_approver_id_employees_id_fk"
		}),
		leaveRequestsEmployeeIdEmployeesIdFk: foreignKey({
			columns: [table.employeeId],
			foreignColumns: [employees.id],
			name: "leave_requests_employee_id_employees_id_fk"
		}),
	}
});

export const onboardingChecklists = pgTable("onboarding_checklists", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	employeeId: uuid("employee_id").notNull(),
	items: jsonb("items").default([]).notNull(),
	completedAt: timestamp("completed_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
},
(table) => {
	return {
		onboardingChecklistsEmployeeIdEmployeesIdFk: foreignKey({
			columns: [table.employeeId],
			foreignColumns: [employees.id],
			name: "onboarding_checklists_employee_id_employees_id_fk"
		}),
	}
});

export const trainingEnrollments = pgTable("training_enrollments", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	trainingId: uuid("training_id").notNull(),
	employeeId: uuid("employee_id").notNull(),
	status: text("status").default('INSCRIT'),
	completedAt: timestamp("completed_at", { mode: 'string' }),
	certificateUrl: text("certificate_url"),
	score: integer("score"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
},
(table) => {
	return {
		trainingEnrollmentsEmployeeIdEmployeesIdFk: foreignKey({
			columns: [table.employeeId],
			foreignColumns: [employees.id],
			name: "training_enrollments_employee_id_employees_id_fk"
		}),
		trainingEnrollmentsTrainingIdTrainingsIdFk: foreignKey({
			columns: [table.trainingId],
			foreignColumns: [trainings.id],
			name: "training_enrollments_training_id_trainings_id_fk"
		}),
	}
});

export const employees = pgTable("employees", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	employeeNumber: varchar("employee_number", { length: 20 }).notNull(),
	firstName: text("first_name").notNull(),
	lastName: text("last_name").notNull(),
	cin: varchar("cin", { length: 20 }),
	dateOfBirth: date("date_of_birth"),
	gender: gender("gender"),
	nationality: text("nationality").default('Malienne'),
	phone: text("phone"),
	personalEmail: text("personal_email"),
	workEmail: text("work_email"),
	address: text("address"),
	city: text("city").default('Bamako'),
	zone: text("zone").default('Bamako'),
	photoUrl: text("photo_url"),
	contractType: contractType("contract_type").default('CDI'),
	startDate: date("start_date").notNull(),
	endDate: date("end_date"),
	baseSalary: numeric("base_salary", { precision: 15, scale:  2 }).notNull(),
	positionId: uuid("position_id"),
	departmentId: uuid("department_id"),
	managerId: uuid("manager_id"),
	isActive: boolean("is_active").default(true),
	userId: uuid("user_id"),
	leaveBalance: integer("leave_balance").default(18),
	emergencyContact: text("emergency_contact"),
	emergencyPhone: text("emergency_phone"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	statutMatrimonial: text("statut_matrimonial").default('Célibataire').notNull(),
	nbEnfantsCharge: integer("nb_enfants_charge").default(0),
	chargesInps: numeric("charges_inps", { precision: 15, scale:  2 }).default('0'),
	chargesAmo: numeric("charges_amo", { precision: 15, scale:  2 }).default('0'),
	chargesIts: numeric("charges_its", { precision: 15, scale:  2 }).default('0'),
	salaireNet: numeric("salaire_net", { precision: 15, scale:  2 }),
},
(table) => {
	return {
		employeesDepartmentIdDepartmentsIdFk: foreignKey({
			columns: [table.departmentId],
			foreignColumns: [departments.id],
			name: "employees_department_id_departments_id_fk"
		}),
		employeesPositionIdPositionsIdFk: foreignKey({
			columns: [table.positionId],
			foreignColumns: [positions.id],
			name: "employees_position_id_positions_id_fk"
		}),
		employeesUserIdUsersIdFk: foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "employees_user_id_users_id_fk"
		}),
		employeesEmployeeNumberUnique: unique("employees_employee_number_unique").on(table.employeeNumber),
	}
});