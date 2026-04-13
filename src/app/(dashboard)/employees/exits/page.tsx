import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { employees, departments, positions, leaveRequests } from "@/lib/schema";
import { eq, and, lt, or, isNull } from "drizzle-orm";
import ExitsClient from "@/components/employees/ExitsClient";

export const metadata = { title: "Sorties employés | AMSODE RH" };
export const revalidate = 60;

const exitStatuses = ["RESIGNED", "TERMINATED", "CONTRACT_ENDED", "JOB_ABANDONMENT", "MUTUAL_AGREEMENT", "RETIRED"];

async function checkAndUpdateExpiredLeaves() {
  try {
    const today = new Date().toISOString().split("T")[0];
    
    const employeesOnLeave = await db
      .select({ id: employees.id })
      .from(employees)
      .where(eq(employees.workStatus, "EN_CONGE"));

    if (employeesOnLeave.length === 0) return;

    const expiredEmployeeIds: string[] = [];

    for (const emp of employeesOnLeave) {
      const approvedLeave = await db.query.leaveRequests.findFirst({
        where: and(
          eq(leaveRequests.employeeId, emp.id),
          eq(leaveRequests.status, "APPROVED" as any)
        ),
        orderBy: (lr, { desc }) => [desc(lr.endDate)],
      });

      if (approvedLeave?.endDate && approvedLeave.endDate < today) {
        expiredEmployeeIds.push(emp.id);
      }
    }

    if (expiredEmployeeIds.length > 0) {
      await db
        .update(employees)
        .set({ 
          workStatus: "ACTIVE",
          updatedAt: new Date()
        })
        .where(or(
          ...expiredEmployeeIds.map(id => eq(employees.id, id))
        ));
      console.log(`Updated ${expiredEmployeeIds.length} employees from EN_CONGE to ACTIVE`);
    }
  } catch (e) {
    console.error("Error checking expired leaves:", e);
  }
}

async function getData() {
  try {
    await checkAndUpdateExpiredLeaves();
  } catch (e) {
    console.error("Failed to check expired leaves:", e);
  }
  
  const allEmployees = await db.select().from(employees);
  const allDepartments = await db.select().from(departments);
  const allPositions = await db.select().from(positions);
  
  const exitedEmployees = allEmployees.filter(emp => exitStatuses.includes(emp.workStatus || ""));
  const employeesOnLeave = allEmployees.filter(emp => emp.workStatus === "EN_CONGE");
  const activeEmployees = allEmployees.filter(emp => 
    emp.workStatus === "ACTIVE" || 
    emp.workStatus === "SUSPENDED" ||
    emp.workStatus === "ON_TRIAL" ||
    emp.workStatus === null || 
    emp.workStatus === undefined
  );
  
  const managerMap = new Map(
    allEmployees
      .filter(emp => emp.isActive)
      .map(emp => [emp.id, { id: emp.id, firstName: emp.firstName, lastName: emp.lastName }])
  );

  const enrichEmployee = (emp: typeof allEmployees[0]) => ({
    ...emp,
    contractType: emp.contractType || "CDI",
    department: allDepartments.find((d) => d.id === emp.departmentId),
    position: allPositions.find((p) => p.id === emp.positionId),
    manager: emp.managerId ? managerMap.get(emp.managerId) : null,
  });
  
  return { 
    exitedEmployees: exitedEmployees.map(enrichEmployee), 
    employeesOnLeave: employeesOnLeave.map(enrichEmployee),
    activeEmployees: activeEmployees.map(enrichEmployee),
    departments: allDepartments, 
    positions: allPositions 
  };
}

export default async function ExitsPage() {
  const session = await auth();
  const { exitedEmployees, employeesOnLeave, activeEmployees, departments: departmentsList, positions: positionsList } = await getData();
  
  return (
    <ExitsClient 
      exitedEmployees={exitedEmployees} 
      employeesOnLeave={employeesOnLeave}
      activeEmployees={activeEmployees}
      departments={departmentsList} 
      positions={positionsList}
      userRole={(session?.user as any)?.role || "EMPLOYE"}
    />
  );
}
