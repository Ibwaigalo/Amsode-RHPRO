import * as XLSX from 'xlsx';

export function exportEmployeesToExcel(employees: any[]): Buffer {
  const ws = XLSX.utils.json_to_sheet(employees.map(e => ({
    'N° Matricule': e.employeeNumber,
    'Prénom': e.firstName,
    'Nom': e.lastName,
    'Département': e.department?.name || '',
    'Poste': e.position?.title || '',
    'Type Contrat': e.contractType,
    'Date Embauche': e.startDate,
    'Salaire Base (FCFA)': e.baseSalary,
    'Statut': e.isActive ? 'Actif' : 'Inactif',
    'Téléphone': e.phone || '',
    'Email Pro': e.workEmail || '',
  })));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Employés');
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

export function exportPayrollToExcel(payslips: any[], period: string): Buffer {
  const ws = XLSX.utils.json_to_sheet(payslips.map(p => ({
    'Période': period,
    'N° Matricule': p.employee?.employeeNumber || '',
    'Prénom': p.employee?.firstName || '',
    'Nom': p.employee?.lastName || '',
    'Salaire Base': p.baseSalary,
    'Transport': p.transportAllowance,
    'Logement': p.housingAllowance,
    'Repas': p.mealAllowance,
    'Perf. Bonus': p.performanceBonus,
    'Salaire Brut': p.grossSalary,
    'CNSS Salarié': p.cnssEmployee,
    'CNSS Patronal': p.cnssEmployer,
    'IMU': p.imuEmployee,
    'Autres Retenues': p.otherDeductions,
    'Net à Payer': p.netSalary,
  })));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, `Paie ${period}`);
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}
