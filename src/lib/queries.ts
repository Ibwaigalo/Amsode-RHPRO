import { cache } from "react";
import { db } from "./db";
import { departments, positions, employees } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export const getDepartments = cache(async () => {
  return db.select({ id: departments.id, name: departments.name, code: departments.code })
    .from(departments);
});

export const getPositions = cache(async () => {
  return db.select({ id: positions.id, title: positions.title, departmentId: positions.departmentId })
    .from(positions);
});

export const getActiveEmployeeCount = cache(async () => {
  const [{ count }] = await db
    .select({ count: employees.id })
    .from(employees)
    .where(eq(employees.isActive, true));
  return count ?? 0;
});

export const getActiveEmployees = cache(async () => {
  return db.select({
    id: employees.id,
    firstName: employees.firstName,
    lastName: employees.lastName,
    departmentId: employees.departmentId,
    managerId: employees.managerId,
  })
    .from(employees)
    .where(eq(employees.isActive, true));
});
