"use client";
// src/components/employees/EmployeesClient.tsx
import { useState } from "react";
import { Users, TrendingUp, Calendar, Briefcase } from "lucide-react";
import { EmployeesTable } from "./EmployeesTable";
import { AddEmployeeButton } from "./AddEmployeeButton";
import { ImportEmployeesButton } from "./ImportEmployeesButton";
import { EmployeeProfile } from "./EmployeeProfile";

interface Employee {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  workEmail: string | null;
  phone: string | null;
  personalEmail: string | null;
  cin: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  nationality: string | null;
  address: string | null;
  city: string | null;
  zone: string | null;
  photoUrl: string | null;
  contractType: string;
  startDate: string;
  endDate: string | null;
  baseSalary: string;
  isActive: boolean;
  leaveBalance: number | null;
  emergencyContact: string | null;
  emergencyPhone: string | null;
  department?: { id: string; name: string; location: string | null };
  position?: { id: string; title: string };
}

interface Props {
  employees: Employee[];
  departments: { id: string; name: string; location: string | null }[];
  positions: { id: string; title: string; departmentId: string | null }[];
  userRole: string;
}

export default function EmployeesClient({ employees, departments, positions, userRole }: Props) {
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [search, setSearch] = useState("");
  const [filterProject, setFilterProject] = useState("");
  const [filterPosition, setFilterPosition] = useState("");
  const [filterZone, setFilterZone] = useState("");

  const zones = [...new Set(employees.map(e => e.zone).filter(Boolean))] as string[];

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch = !search || 
      `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
      emp.employeeNumber.toLowerCase().includes(search.toLowerCase()) ||
      (emp.workEmail?.toLowerCase().includes(search.toLowerCase()));
    
    const matchesProject = !filterProject || emp.department?.id === filterProject;
    const matchesPosition = !filterPosition || emp.position?.id === filterPosition;
    const matchesZone = !filterZone || emp.zone === filterZone;

    return matchesSearch && matchesProject && matchesPosition && matchesZone;
  });

  const tableData = filteredEmployees.map((emp) => ({
    ...emp,
    departmentName: emp.department?.name || null,
    positionTitle: emp.position?.title || null,
  }));

  const stats = [
    { label: "Total membres", value: employees.length, icon: Users, color: "text-[#0090D1]" },
    { label: "Actifs", value: employees.filter((e) => e.isActive).length, icon: TrendingUp, color: "text-[#86C440]" },
    { label: "En CDD", value: employees.filter((e) => e.contractType === "CDD").length, icon: Calendar, color: "text-[#0090D1]" },
    { label: "Projets", value: departments.length, icon: Briefcase, color: "text-[#86C440]" },
  ];

  if (selectedEmployee) {
    return (
      <EmployeeProfile 
        employee={selectedEmployee}
        onClose={() => setSelectedEmployee(null)}
        userRole={userRole}
      />
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Membres</h1>
          <p className="text-sm text-gray-500 mt-1">Gérez les membres de vos projets</p>
        </div>
        {(userRole === "ADMIN_RH" || userRole === "MANAGER") && (
          <div className="flex gap-2">
            <ImportEmployeesButton />
            <AddEmployeeButton departments={departments} />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stat.value}</p>
              </div>
              <div className={`p-2 rounded-lg bg-gray-50 dark:bg-gray-800 ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Rechercher par nom, matricule, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filterProject}
            onChange={(e) => setFilterProject(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tous les projets</option>
            {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <select
            value={filterPosition}
            onChange={(e) => setFilterPosition(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tous les postes</option>
            {positions.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
          </select>
          <select
            value={filterZone}
            onChange={(e) => setFilterZone(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Toutes les zones</option>
            {zones.map((z) => <option key={z} value={z}>{z}</option>)}
          </select>
        </div>
        <p className="text-xs text-gray-500 mt-2">{filteredEmployees.length} résultat(s)</p>
      </div>

      <EmployeesTable
        employees={tableData}
        departments={departments}
        total={filteredEmployees.length}
        page={1}
        pageSize={10}
        searchParams={{}}
        onViewProfile={setSelectedEmployee}
      />
    </div>
  );
}
