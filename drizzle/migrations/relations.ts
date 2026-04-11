import { relations } from "drizzle-orm/relations";
import { users, accounts, jobPostings, applications, employeeAuditLogs, employees, evaluations, departments, positions, notifications, payrollPeriods, payslips, sessions, trainings, documents, leaveRequests, onboardingChecklists, trainingEnrollments } from "./schema";

export const accountsRelations = relations(accounts, ({one}) => ({
	user: one(users, {
		fields: [accounts.userId],
		references: [users.id]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	accounts: many(accounts),
	applications: many(applications),
	employeeAuditLogs: many(employeeAuditLogs),
	jobPostings: many(jobPostings),
	notifications: many(notifications),
	payrollPeriods: many(payrollPeriods),
	sessions: many(sessions),
	trainings: many(trainings),
	documents: many(documents),
	employees: many(employees),
}));

export const applicationsRelations = relations(applications, ({one}) => ({
	jobPosting: one(jobPostings, {
		fields: [applications.jobPostingId],
		references: [jobPostings.id]
	}),
	user: one(users, {
		fields: [applications.reviewedBy],
		references: [users.id]
	}),
}));

export const jobPostingsRelations = relations(jobPostings, ({one, many}) => ({
	applications: many(applications),
	user: one(users, {
		fields: [jobPostings.createdBy],
		references: [users.id]
	}),
	department: one(departments, {
		fields: [jobPostings.departmentId],
		references: [departments.id]
	}),
	position: one(positions, {
		fields: [jobPostings.positionId],
		references: [positions.id]
	}),
}));

export const employeeAuditLogsRelations = relations(employeeAuditLogs, ({one}) => ({
	user: one(users, {
		fields: [employeeAuditLogs.changedBy],
		references: [users.id]
	}),
	employee: one(employees, {
		fields: [employeeAuditLogs.employeeId],
		references: [employees.id]
	}),
}));

export const employeesRelations = relations(employees, ({one, many}) => ({
	employeeAuditLogs: many(employeeAuditLogs),
	evaluations_employeeId: many(evaluations, {
		relationName: "evaluations_employeeId_employees_id"
	}),
	evaluations_evaluatorId: many(evaluations, {
		relationName: "evaluations_evaluatorId_employees_id"
	}),
	payslips: many(payslips),
	documents: many(documents),
	leaveRequests_approverId: many(leaveRequests, {
		relationName: "leaveRequests_approverId_employees_id"
	}),
	leaveRequests_employeeId: many(leaveRequests, {
		relationName: "leaveRequests_employeeId_employees_id"
	}),
	onboardingChecklists: many(onboardingChecklists),
	trainingEnrollments: many(trainingEnrollments),
	department: one(departments, {
		fields: [employees.departmentId],
		references: [departments.id]
	}),
	position: one(positions, {
		fields: [employees.positionId],
		references: [positions.id]
	}),
	user: one(users, {
		fields: [employees.userId],
		references: [users.id]
	}),
}));

export const evaluationsRelations = relations(evaluations, ({one}) => ({
	employee_employeeId: one(employees, {
		fields: [evaluations.employeeId],
		references: [employees.id],
		relationName: "evaluations_employeeId_employees_id"
	}),
	employee_evaluatorId: one(employees, {
		fields: [evaluations.evaluatorId],
		references: [employees.id],
		relationName: "evaluations_evaluatorId_employees_id"
	}),
}));

export const departmentsRelations = relations(departments, ({many}) => ({
	jobPostings: many(jobPostings),
	positions: many(positions),
	employees: many(employees),
}));

export const positionsRelations = relations(positions, ({one, many}) => ({
	jobPostings: many(jobPostings),
	department: one(departments, {
		fields: [positions.departmentId],
		references: [departments.id]
	}),
	employees: many(employees),
}));

export const notificationsRelations = relations(notifications, ({one}) => ({
	user: one(users, {
		fields: [notifications.userId],
		references: [users.id]
	}),
}));

export const payrollPeriodsRelations = relations(payrollPeriods, ({one, many}) => ({
	user: one(users, {
		fields: [payrollPeriods.processedBy],
		references: [users.id]
	}),
	payslips: many(payslips),
}));

export const payslipsRelations = relations(payslips, ({one}) => ({
	employee: one(employees, {
		fields: [payslips.employeeId],
		references: [employees.id]
	}),
	payrollPeriod: one(payrollPeriods, {
		fields: [payslips.periodId],
		references: [payrollPeriods.id]
	}),
}));

export const sessionsRelations = relations(sessions, ({one}) => ({
	user: one(users, {
		fields: [sessions.userId],
		references: [users.id]
	}),
}));

export const trainingsRelations = relations(trainings, ({one, many}) => ({
	user: one(users, {
		fields: [trainings.createdBy],
		references: [users.id]
	}),
	trainingEnrollments: many(trainingEnrollments),
}));

export const documentsRelations = relations(documents, ({one}) => ({
	employee: one(employees, {
		fields: [documents.employeeId],
		references: [employees.id]
	}),
	user: one(users, {
		fields: [documents.uploadedBy],
		references: [users.id]
	}),
}));

export const leaveRequestsRelations = relations(leaveRequests, ({one}) => ({
	employee_approverId: one(employees, {
		fields: [leaveRequests.approverId],
		references: [employees.id],
		relationName: "leaveRequests_approverId_employees_id"
	}),
	employee_employeeId: one(employees, {
		fields: [leaveRequests.employeeId],
		references: [employees.id],
		relationName: "leaveRequests_employeeId_employees_id"
	}),
}));

export const onboardingChecklistsRelations = relations(onboardingChecklists, ({one}) => ({
	employee: one(employees, {
		fields: [onboardingChecklists.employeeId],
		references: [employees.id]
	}),
}));

export const trainingEnrollmentsRelations = relations(trainingEnrollments, ({one}) => ({
	employee: one(employees, {
		fields: [trainingEnrollments.employeeId],
		references: [employees.id]
	}),
	training: one(trainings, {
		fields: [trainingEnrollments.trainingId],
		references: [trainings.id]
	}),
}));