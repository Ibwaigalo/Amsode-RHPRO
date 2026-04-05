import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { employees, departments, positions } from "@/lib/schema";
import EmployeesClient from "@/components/employees/EmployeesClient";

export const metadata = { title: "Membres | AMSODE RH" };

async function getData() {
  const allEmployees = await db.select().from(employees);
  const allDepartments = await db.select().from(departments);
  const allPositions = await db.select().from(positions);
  const empsWithRelations = allEmployees.map((emp) => ({
    ...emp,
    department: allDepartments.find((d) => d.id === emp.departmentId),
    position: allPositions.find((p) => p.id === emp.positionId),
  }));
  return { employees: empsWithRelations, departments: allDepartments, positions: allPositions };
}

export default async function EmployeesPage() {
  const session = await auth();
  const { employees: employeesList, departments: departmentsList, positions: positionsList } = await getData();
  return (
    <EmployeesClient 
      employees={employeesList} 
      departments={departmentsList} 
      positions={positionsList}
      userRole={(session?.user as any)?.role || "EMPLOYEE"}
    />
  );
}
