import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { leaveRequests, employees, users } from "@/lib/schema";
import { eq, inArray } from "drizzle-orm";
import dynamic from "next/dynamic";

const LeavesClient = dynamic(() => import("@/components/leaves/LeavesClient"), {
  loading: () => <div className="p-6"><div className="animate-pulse space-y-4"><div className="h-32 bg-gray-200 rounded"></div><div className="h-64 bg-gray-200 rounded"></div></div></div>,
  ssr: false,
});

export const metadata = { title: "Congés | AMSODE RH" };
export const revalidate = 15;

async function getLeavesForUser(userId: string, role: string, employeeId: string | null) {
  console.log("LeavesPage - userId:", userId, "role:", role, "employeeId:", employeeId);
  
  // Get all employees with their managerId to debug
  const allEmployees = await db.select({ 
    id: employees.id, 
    firstName: employees.firstName, 
    lastName: employees.lastName,
    managerId: employees.managerId
  }).from(employees);
  
  console.log("All employees with managerId:", allEmployees.map(e => ({ 
    id: e.id, 
    name: e.firstName + " " + e.lastName, 
    managerId: e.managerId 
  })));
  
  if (role === "ADMIN_RH" || role === "PRESIDENT") {
    return await db.select().from(leaveRequests);
  }
  
  if (role === "MANAGER" && employeeId) {
    const managedEmployees = await db.select({ 
      id: employees.id, 
      managerId: employees.managerId, 
      firstName: employees.firstName, 
      lastName: employees.lastName 
    }).from(employees).where(eq(employees.managerId, employeeId));
    
    console.log("Managed employees (where managerId =", employeeId, "):", managedEmployees.map(e => e.firstName + " " + e.lastName));
    
    const managedIds = managedEmployees.map(e => e.id);
    
    if (managedIds.length > 0) {
      const ownLeaves = await db.select().from(leaveRequests).where(eq(leaveRequests.employeeId, employeeId));
      const managedLeaves = await db.select().from(leaveRequests).where(
        inArray(leaveRequests.employeeId, managedIds)
      );
      console.log("Found leaves - own:", ownLeaves.length, "managed:", managedLeaves.length);
      return [...ownLeaves, ...managedLeaves];
    }
    return await db.select().from(leaveRequests).where(eq(leaveRequests.employeeId, employeeId));
  }
  
  if (employeeId) {
    return await db.select().from(leaveRequests).where(eq(leaveRequests.employeeId, employeeId));
  }
  
  return [];
}

export default async function LeavesPage() {
  const session = await auth();
  const role = (session?.user as any)?.role || "EMPLOYE";
  const userId = (session?.user as any)?.id;
  
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  const employeeId = user?.employeeId || null;
  
  const leaves = await getLeavesForUser(userId, role, employeeId);
  const emps = await db.select({ id: employees.id, firstName: employees.firstName, lastName: employees.lastName }).from(employees);
  
  const empMap = new Map(emps.map(e => [e.id, e]));
  const requests = leaves.map((l) => {
    const emp = empMap.get(l.employeeId);
    return {
      ...l,
      createdAt: l.createdAt || new Date(),
      totalDays: String(l.daysCount || 0),
      status: l.status || "PENDING",
      employeeName: emp?.firstName || null,
      employeeLastName: emp?.lastName || null,
    };
  });
  
  return (
    <LeavesClient 
      requests={requests} 
      balances={[]}
      userRole={role}
    />
  );
}
