"use client";
// src/components/employees/EmployeesClient.tsx
import { useState } from "react";
import { Users, TrendingUp, Calendar, Briefcase } from "lucide-react";
import { EmployeesTable } from "./EmployeesTable";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { CreateAccountsButton } from "./CreateAccountsButton";
import { ResetPasswordsManager } from "./ResetPasswordButton";

const AddEmployeeButton = dynamic(
  () => import("./AddEmployeeButton").then(m => m.AddEmployeeButton),
  { 
    loading: () => <div className="px-4 py-2 bg-[#0090D1] rounded-lg animate-pulse h-9 w-32" />,
    ssr: false 
  }
);

const ImportEmployeesButton = dynamic(
  () => import("./ImportEmployeesButton").then(m => m.ImportEmployeesButton),
  { 
    loading: () => <div className="px-4 py-2 bg-green-600 rounded-lg animate-pulse h-9 w-28" />,
    ssr: false 
  }
);

const EmployeeProfile = dynamic(
  () => import("./EmployeeProfile").then(m => m.EmployeeProfile),
  { 
    loading: () => <div className="p-6 animate-pulse"><div className="h-8 bg-gray-200 rounded w-48 mb-4"></div><div className="h-64 bg-gray-100 rounded"></div></div>,
    ssr: false 
  }
);

const EditEmployeeModal = dynamic(
  () => import("./EditEmployeeModal").then(m => m.EditEmployeeModal),
  { 
    loading: () => <div className="fixed inset-0 bg-black/50 flex items-center justify-center"><div className="bg-white p-6 rounded-lg">Chargement...</div></div>,
    ssr: false 
  }
);

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
  statutMatrimonial: string | null;
  nbEnfantsCharge: number | null;
  department?: { id: string; name: string; location: string | null };
  departmentId?: string | null;
  position?: { id: string; title: string };
  positionId?: string | null;
  managerId?: string | null;
  manager?: { id: string; firstName: string; lastName: string } | null;
}

interface Props {
  employees: Employee[];
  departments: { id: string; name: string; location: string | null }[];
  positions: { id: string; title: string; departmentId: string | null }[];
  userRole: string;
  managers?: { id: string; firstName: string; lastName: string }[];
}

export default function EmployeesClient({ employees, departments, positions, userRole, managers = [] }: Props) {
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [search, setSearch] = useState("");
  const [filterProject, setFilterProject] = useState("");
  const [filterPosition, setFilterPosition] = useState("");
  const [filterZone, setFilterZone] = useState("");
  const router = useRouter();

  if (selectedEmployee) {
    return (
      <EmployeeProfile 
        employee={selectedEmployee}
        onClose={() => setSelectedEmployee(null)}
        userRole={userRole}
      />
    );
  }

  if (editingEmployee) {
    return (
      <EditEmployeeModal
        employee={editingEmployee}
        departments={departments}
        positions={positions}
        managers={managers}
        onClose={() => setEditingEmployee(null)}
        onSuccess={() => {
          setEditingEmployee(null);
          router.refresh();
        }}
      />
    );
  }

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch = search === "" || 
      `${emp.firstName} ${emp.lastName} ${emp.employeeNumber} ${emp.workEmail || ""} ${emp.personalEmail || ""}`
        .toLowerCase()
        .includes(search.toLowerCase());
    
    const matchesProject = filterProject === "" || emp.departmentId === filterProject;
    const matchesPosition = filterPosition === "" || emp.positionId === filterPosition;
    const matchesZone = filterZone === "" || emp.zone === filterZone;

    return matchesSearch && matchesProject && matchesPosition && matchesZone;
  });

  const tableData = filteredEmployees.map((emp) => ({
    ...emp,
    email: emp.workEmail ?? emp.personalEmail ?? "",
    departmentName: emp.department?.name || null,
    positionTitle: emp.position?.title || null,
    managerName: emp.manager ? `${emp.manager.firstName} ${emp.manager.lastName}` : null,
  }));

  const zones = [...new Set(employees.map((e) => e.zone).filter(Boolean))] as string[];

  const stats = [
    { label: "Total membres", value: employees.length, icon: Users, color: "text-[#0090D1]" },
    { label: "Actifs", value: employees.filter((e) => e.isActive).length, icon: TrendingUp, color: "text-[#86C440]" },
    { label: "En CDD", value: employees.filter((e) => e.contractType === "CDD").length, icon: Calendar, color: "text-[#0090D1]" },
    { label: "Projets", value: departments.length, icon: Briefcase, color: "text-[#86C440]" },
  ];

  const handleView = (emp: any) => {
    const fullEmp = employees.find(e => e.id === emp.id);
    if (fullEmp) setSelectedEmployee(fullEmp);
  };

  const handleEdit = (employee: any) => {
    const fullEmp = employees.find(e => e.id === employee.id);
    if (fullEmp) setEditingEmployee(fullEmp);
  };

  const handleDelete = async (employee: any) => {
    if (!confirm(`Voulez-vous vraiment supprimer ${employee.firstName} ${employee.lastName} ?`)) {
      return;
    }
    
    try {
      const res = await fetch(`/api/employees/${employee.id}`, { 
        method: "DELETE",
        headers: { "Content-Type": "application/json" }
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        toast.error(data.error || "Erreur lors de la suppression");
        return;
      }
      
      toast.success("Membre supprimé avec succès");
      router.refresh();
    } catch (e: any) {
      toast.error("Erreur: " + (e.message || "Une erreur est survenue"));
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      className="p-6 space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div 
        className="flex items-center justify-between"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Membres</h1>
          <p className="text-sm text-gray-500 mt-1">Gérez les membres de vos projets</p>
        </div>
        {(userRole === "ADMIN_RH" || userRole === "MANAGER") && (
          <div className="flex gap-2">
            <ImportEmployeesButton />
            <AddEmployeeButton departments={departments} positions={positions} managers={managers} />
            <CreateAccountsButton />
            <ResetPasswordsManager />
          </div>
        )}
      </motion.div>

      <motion.div 
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {stats.map((stat) => (
          <motion.div 
            key={stat.label} 
            variants={itemVariants}
            className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4"
            whileHover={{ scale: 1.02, y: -2 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stat.value}</p>
              </div>
              <div className={`p-2 rounded-lg bg-gray-50 dark:bg-gray-800 ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

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
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        managers={managers}
      />
    </motion.div>
  );
}
