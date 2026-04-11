"use client";
import { useState, useCallback, useTransition, memo } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Search, Download, Eye, Edit2, Trash2,
  ChevronLeft, ChevronRight, Loader2, X,
  User, Phone, Mail, Calendar, Briefcase,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { EditEmployeeModal } from "./EditEmployeeModal";
import { EmployeeProfile } from "./EmployeeProfile";

interface Employee {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  workEmail: string | null;
  personalEmail: string | null;
  phone: string | null;
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

interface EmployeeTableRow {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  photoUrl: string | null;
  contractType: string;
  contractStart: string;
  contractEnd: string | null;
  baseSalary: string;
  isActive: boolean;
  departmentName: string | null;
  positionTitle: string | null;
  managerName: string | null;
  managerId?: string | null;
  manager?: { id: string; firstName: string; lastName: string } | null;
}

interface Props {
  employees: Employee[];
  departments: { id: string; name: string }[];
  total: number;
  page: number;
  pageSize: number;
  searchParams: { q?: string; department?: string; contract?: string };
  onView?: (employee: Employee) => void;
  onEdit?: (employee: Employee) => void;
  onDelete?: (employee: Employee) => void;
  managers?: { id: string; firstName: string; lastName: string }[];
}

interface TableRowProps {
  emp: EmployeeTableRow;
  fullEmployee?: Employee;
  onView: (e: Employee) => void;
  onEdit: (e: Employee) => void;
  onDelete: (e: Employee) => void;
}

const CONTRACT_COLORS: Record<string, string> = {
  CDI:        "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  CDD:        "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  STAGE:      "bg-blue-100  text-blue-800  dark:bg-blue-900/30  dark:text-blue-300",
  CONSULTANT: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
};

const formatSalary = (s: string) =>
  new Intl.NumberFormat("fr-ML", {
    style: "currency", currency: "XOF", maximumFractionDigits: 0,
  }).format(parseFloat(s));

const isExpiringSoon = (endDate: string | null): boolean => {
  if (!endDate) return false;
  const diff = new Date(endDate).getTime() - Date.now();
  return diff > 0 && diff < 30 * 24 * 60 * 60 * 1000;
};

function ViewModal({
  employee,
  onClose,
}: {
  employee: Employee;
  onClose: () => void;
}) {
  console.log("📋 ViewModal - données reçues:", JSON.stringify(employee, null, 2));
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white font-outfit">
            Fiche employ&#233;
          </h2>
          <button onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-800 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
              {employee.photoUrl
                ? <img src={employee.photoUrl} alt="" className="w-16 h-16 rounded-full object-cover" />
                : `${employee.firstName[0]}${employee.lastName[0]}`}
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {employee.firstName} {employee.lastName}
              </p>
              <p className="text-sm text-gray-500">{employee.employeeNumber}</p>
              <span className={cn(
                "text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block",
                CONTRACT_COLORS[employee.contractType] ?? "bg-gray-100 text-gray-700"
              )}>
                {employee.contractType}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Mail,      label: "Email",       value: employee.email },
              { icon: Phone,     label: "T&#233;l&#233;phone",   value: employee.phone ?? "—" },
              { icon: Briefcase, label: "Poste",       value: employee.positionTitle ?? "—" },
              { icon: User,      label: "D&#233;partement", value: employee.departmentName ?? "—" },
              { icon: Calendar,  label: "D&#233;but contrat", value: employee.contractStart ? new Date(employee.contractStart).toLocaleDateString("fr-ML") : "—" },
              { icon: Calendar,  label: "Fin contrat",   value: employee.contractEnd ? new Date(employee.contractEnd).toLocaleDateString("fr-ML") : "CDI" },
            ].map((row, i) => (
              <div key={i} className="flex items-start gap-2 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <row.icon className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">{row.label}</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{row.value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-between">
            <span className="text-sm text-blue-700 dark:text-blue-300 font-medium">Salaire de base</span>
            <span className="text-lg font-bold text-blue-800 dark:text-blue-200">
              {formatSalary(employee.baseSalary)}
            </span>
          </div>

          <div className="flex justify-center">
            <span className={cn(
              "text-sm px-4 py-1.5 rounded-full font-medium",
              employee.isActive
                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
            )}>
              {employee.isActive ? "&#10003; Actif" : "&#10007; Inactif"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function EditModal({
  employee,
  departments,
  onClose,
  onSaved,
}: {
  employee: Employee;
  departments: { id: string; name: string }[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    firstName:    employee.firstName,
    lastName:     employee.lastName,
    email:        employee.email,
    phone:        employee.phone ?? "",
    contractType: employee.contractType,
    contractEnd:  employee.contractEnd ?? "",
    baseSalary:   employee.baseSalary,
  });

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setForm(prev => ({ ...prev, [name]: value }));
    },
    []
  );

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/employees/${employee.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          workEmail: form.email,
          phone: form.phone,
          contractType: form.contractType,
          contractEnd: form.contractEnd,
          baseSalary: form.baseSalary,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Erreur serveur");
      toast.success("Employ&#233; mis &#224; jour !");
      onSaved();
      onClose();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white font-outfit">
            Modifier &#8212; {employee.firstName} {employee.lastName}
          </h2>
          <button onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 grid grid-cols-2 gap-4">
          {[
            { name: "firstName",  label: "Pr&#233;nom",    type: "text",   placeholder: "Aminata" },
            { name: "lastName",   label: "Nom",       type: "text",   placeholder: "Coulibaly" },
            { name: "email",      label: "Email",     type: "email",  placeholder: "a.coulibaly@amsode.ml" },
            { name: "phone",      label: "T&#233;l&#233;phone", type: "tel",    placeholder: "+223 70 00 00 00" },
            { name: "baseSalary", label: "Salaire (FCFA)", type: "number", placeholder: "300000" },
            { name: "contractEnd", label: "Fin contrat", type: "date", placeholder: "" },
          ].map(field => (
            <div key={field.name} className={field.name === "email" ? "col-span-2" : ""}>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                {field.label}
              </label>
              <input
                name={field.name}
                type={field.type}
                value={(form as any)[field.name]}
                onChange={handleChange}
                placeholder={field.placeholder}
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ))}

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Type contrat
            </label>
            <select
              name="contractType"
              value={form.contractType}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500">
              {["CDI", "CDD", "STAGE", "CONSULTANT"].map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose}
            className="flex-1 px-4 py-2.5 text-sm font-medium border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            Annuler
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium bg-blue-700 hover:bg-blue-800 text-white rounded-lg transition-colors disabled:opacity-60">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteModal({
  employee,
  onClose,
  onDeleted,
}: {
  employee: Employee;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/employees/${employee.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error ?? "Erreur serveur");
      toast.success(`${employee.firstName} ${employee.lastName} archiv&#233;.`);
      onDeleted();
      onClose();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-sm p-6 text-center"
        onClick={e => e.stopPropagation()}>
        <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
          <Trash2 className="w-7 h-7 text-red-600" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
          Archiver cet employ&#233; ?
        </h3>
        <p className="text-sm text-gray-500 mb-6">
          <strong>{employee.firstName} {employee.lastName}</strong> sera d&#233;sactiv&#233;
          (soft delete &#8212; les donn&#233;es sont conserv&#233;es).
        </p>
        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 px-4 py-2.5 text-sm font-medium border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
            Annuler
          </button>
          <button onClick={handleDelete} disabled={deleting}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-60">
            {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
            {deleting ? "Archivage..." : "Archiver"}
          </button>
        </div>
      </div>
    </div>
  );
}

const EmployeeRow = memo(function EmployeeRow({
  emp,
  onView,
  onEdit,
  onDelete,
}: TableRowProps) {
  return (
    <tr>
      <td>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-800 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {emp.photoUrl
              ? <img src={emp.photoUrl} alt="" className="w-9 h-9 rounded-full object-cover" />
              : `${emp.firstName[0]}${emp.lastName[0]}`}
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white text-sm">
              {emp.firstName} {emp.lastName}
            </p>
            <p className="text-xs text-gray-500">{emp.employeeNumber} &#8226; {emp.email}</p>
          </div>
        </div>
      </td>
      <td>
        <p className="text-sm text-gray-700 dark:text-gray-300">{emp.positionTitle ?? "&#8212;"}</p>
        <p className="text-xs text-gray-500">{emp.departmentName ?? "&#8212;"}</p>
      </td>
      <td>
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {emp.managerName ?? "—"}
        </span>
      </td>
      <td>
        <div className="space-y-1">
          <span className={cn(
            "text-xs px-2 py-0.5 rounded-full font-medium",
            CONTRACT_COLORS[emp.contractType] ?? "bg-gray-100 text-gray-700"
          )}>
            {emp.contractType}
          </span>
          {isExpiringSoon(emp.contractEnd) && (
            <p className="text-xs text-red-500 font-medium">&#9888; Expire bient&#244;t</p>
          )}
        </div>
      </td>
      <td>
        <span className="text-sm font-medium text-gray-900 dark:text-white">
          {formatSalary(emp.baseSalary)}
        </span>
      </td>
      <td>
        <span className={cn(
          "text-xs px-2 py-1 rounded-full font-medium",
          emp.isActive ? "badge-approved" : "badge-rejected"
        )}>
          {emp.isActive ? "Actif" : "Inactif"}
        </span>
      </td>
      <td>
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => onView?.(emp)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
            title="Voir le profil">
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => onEdit?.(emp)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
            title="Modifier">
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete?.(emp)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            title="Archiver">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
});

export function EmployeesTable({
  employees,
  departments,
  total,
  page,
  pageSize,
  searchParams,
  onView,
  onEdit,
  onDelete,
  managers,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState(searchParams.q ?? "");

  const [modal, setModal] = useState<{
    type: "view" | "edit" | "delete";
    employee: EmployeeTableRow;
    fullEmployee?: Employee;
  } | null>(null);

  const closeModal = useCallback(() => setModal(null), []);

  const handleView   = useCallback((emp: Employee) => setModal({ type: "view",   employee: emp as EmployeeTableRow, fullEmployee: emp }), []);
  const handleEdit   = useCallback((emp: Employee) => setModal({ type: "edit",   employee: emp as EmployeeTableRow, fullEmployee: emp }), []);
  const handleDelete = useCallback((emp: Employee) => setModal({ type: "delete", employee: emp as EmployeeTableRow, fullEmployee: emp }), []);

  const updateQuery = useCallback((params: Record<string, string>) => {
    const sp = new URLSearchParams();
    Object.entries({ q: search, ...searchParams, ...params })
      .filter(([, v]) => v)
      .forEach(([k, v]) => sp.set(k, v));
    startTransition(() => router.push(`${pathname}?${sp.toString()}`));
  }, [search, searchParams, pathname, router]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateQuery({ page: "1" });
  };

  const handleSaved = useCallback(() => {
    startTransition(() => router.refresh());
  }, [router]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <>
      {modal?.type === "view" && modal.fullEmployee && (
        <EmployeeProfile 
          employee={modal.fullEmployee} 
          onClose={closeModal} 
          userRole="ADMIN_RH" 
        />
      )}
      {modal?.type === "edit" && modal.fullEmployee && (
        <EditEmployeeModal
          employee={modal.fullEmployee}
          departments={departments}
          positions={[]}
          managers={managers || []}
          onClose={closeModal}
          onSuccess={handleSaved}
        />
      )}
      {modal?.type === "delete" && (
        <DeleteModal
          employee={modal.employee}
          onClose={closeModal}
          onDeleted={handleSaved}
        />
      )}

      <div className="space-y-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4 flex flex-col sm:flex-row gap-3">
          <form onSubmit={handleSearch} className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher par nom, email, matricule&#8230;"
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </form>

          <select
            defaultValue={searchParams.department ?? ""}
            onChange={e => updateQuery({ department: e.target.value, page: "1" })}
            className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Tous les d&#233;partements</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>

          <select
            defaultValue={searchParams.contract ?? ""}
            onChange={e => updateQuery({ contract: e.target.value, page: "1" })}
            className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Tous contrats</option>
            {["CDI", "CDD", "STAGE", "CONSULTANT"].map(c =>
              <option key={c} value={c}>{c}</option>
            )}
          </select>

          <button
            type="button"
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <Download className="w-4 h-4" /> Excel
          </button>
        </div>

        <div className={cn(
          "bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden transition-opacity",
          isPending && "opacity-60 pointer-events-none"
        )}>
          {isPending && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full data-table">
              <thead>
                <tr>
                  <th className="text-left">Employ&#233;</th>
                  <th className="text-left">Poste / D&#233;partement</th>
                  <th className="text-left">Manager</th>
                  <th className="text-left">Contrat</th>
                  <th className="text-left">Salaire de base</th>
                  <th className="text-left">Statut</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-gray-400">
                      Aucun employ&#233; trouv&#233;
                    </td>
                  </tr>
                ) : employees.map(emp => (
                  <EmployeeRow
                    key={emp.id}
                    emp={emp}
                    onView={handleView}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    fullEmployee={emp as Employee}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-800">
              <p className="text-xs text-gray-500">
                Affichage {((page - 1) * pageSize) + 1}&#8211;{Math.min(page * pageSize, total)} sur {total}
              </p>
              <div className="flex gap-1">
                <button
                  onClick={() => updateQuery({ page: String(page - 1) })}
                  disabled={page <= 1 || isPending}
                  className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map(p => (
                  <button key={p}
                    onClick={() => updateQuery({ page: String(p) })}
                    disabled={isPending}
                    className={cn(
                      "w-8 h-8 text-xs rounded-lg border transition-colors",
                      p === page
                        ? "bg-blue-600 text-white border-blue-600"
                        : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                    )}>
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => updateQuery({ page: String(page + 1) })}
                  disabled={page >= totalPages || isPending}
                  className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
