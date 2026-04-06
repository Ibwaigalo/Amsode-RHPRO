// src/lib/excel-import.ts
import * as XLSX from "xlsx";

export interface EmployeeImportRow {
  firstName: string;
  lastName: string;
  workEmail?: string;
  phone?: string;
  cin?: string;
  dateOfBirth?: string;
  gender?: "M" | "F";
  contractType: "CDI" | "CDD" | "STAGE" | "CONSULTANT";
  startDate: string;
  endDate?: string;
  departmentId?: string;
  positionId?: string;
  baseSalary: string;
  managerId?: string;
}

export interface ImportResult {
  success: number;
  errors: { row: number; message: string }[];
  employees: EmployeeImportRow[];
}

function parseDate(value: any): string | undefined {
  if (!value) return undefined;
  
  const strValue = String(value).trim();
  
  if (/^\d+$/.test(strValue)) {
    const excelDate = parseInt(strValue);
    if (excelDate > 20000 && excelDate < 60000) {
      const date = new Date((excelDate - 25569) * 86400 * 1000);
      return date.toISOString().substring(0, 10);
    }
  }
  
  if (strValue.includes('-') || strValue.includes('/')) {
    const match = strValue.match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (match) {
      return `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;
    }
  }
  
  return strValue.substring(0, 10);
}

export function parseExcelFile(file: Buffer): ImportResult {
  const workbook = XLSX.read(file, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const json = XLSX.utils.sheet_to_json<any>(worksheet);

  const employees: EmployeeImportRow[] = [];
  const errors: { row: number; message: string }[] = [];

  const requiredHeaders = ["firstName", "lastName", "contractType", "startDate", "baseSalary"];
  const headers = Object.keys(json[0] || {});

  const headerMap: Record<string, string> = {
    "Prénom": "firstName",
    "Nom": "lastName",
    "firstName": "firstName",
    "lastName": "lastName",
    "Email": "workEmail",
    "email": "workEmail",
    "workEmail": "workEmail",
    "Téléphone": "phone",
    "phone": "phone",
    "CIN": "cin",
    "cin": "cin",
    "Date de naissance": "dateOfBirth",
    "dateOfBirth": "dateOfBirth",
    "Sexe": "gender",
    "gender": "gender",
    "Type de contrat": "contractType",
    "contractType": "contractType",
    "Date début": "startDate",
    "startDate": "startDate",
    "Date fin": "endDate",
    "endDate": "endDate",
    "Projet": "departmentId",
    "departmentId": "departmentId",
    "Poste": "positionId",
    "positionId": "positionId",
    "Zone": "zone",
    "zone": "zone",
    "Salaire": "baseSalary",
    "baseSalary": "baseSalary",
    "Salaire de base": "baseSalary",
    "Supérieur Hiérarchique": "managerId",
    "managerId": "managerId",
  };

  json.forEach((row: any, index: number) => {
    try {
      const normalizedRow: any = {};
      
      for (const [originalHeader, value] of Object.entries(row)) {
        const mappedHeader = headerMap[originalHeader] || headerMap[originalHeader.trim()] || originalHeader;
        if (mappedHeader) {
          normalizedRow[mappedHeader] = value;
        }
      }

      if (!normalizedRow.firstName || !normalizedRow.lastName) {
        errors.push({ row: index + 2, message: "Prénom et Nom requis" });
        return;
      }

      if (!normalizedRow.contractType || !["CDI", "CDD", "STAGE", "CONSULTANT"].includes(normalizedRow.contractType)) {
        errors.push({ row: index + 2, message: `Type de contrat invalide: ${normalizedRow.contractType}` });
        return;
      }

      if (!normalizedRow.startDate) {
        errors.push({ row: index + 2, message: "Date de début requise" });
        return;
      }

      if (!normalizedRow.baseSalary || isNaN(parseFloat(normalizedRow.baseSalary))) {
        errors.push({ row: index + 2, message: "Salaire invalide" });
        return;
      }

      employees.push({
        firstName: String(normalizedRow.firstName).trim(),
        lastName: String(normalizedRow.lastName).trim(),
        workEmail: normalizedRow.workEmail ? String(normalizedRow.workEmail).trim() : undefined,
        phone: normalizedRow.phone ? String(normalizedRow.phone).trim() : undefined,
        cin: normalizedRow.cin ? String(normalizedRow.cin).trim() : undefined,
        dateOfBirth: parseDate(normalizedRow.dateOfBirth),
        gender: normalizedRow.gender && ["M", "F"].includes(String(normalizedRow.gender).toUpperCase()) 
          ? String(normalizedRow.gender).toUpperCase() as "M" | "F" 
          : undefined,
        contractType: normalizedRow.contractType as "CDI" | "CDD" | "STAGE" | "CONSULTANT",
        startDate: parseDate(normalizedRow.startDate) || "",
        endDate: parseDate(normalizedRow.endDate) || undefined,
        departmentId: normalizedRow.departmentId ? String(normalizedRow.departmentId) : undefined,
        positionId: normalizedRow.positionId ? String(normalizedRow.positionId) : undefined,
        baseSalary: String(normalizedRow.baseSalary),
        managerId: normalizedRow.managerId ? String(normalizedRow.managerId).trim() : undefined,
      });
    } catch (e: any) {
      errors.push({ row: index + 2, message: e.message });
    }
  });

  return { success: employees.length, errors, employees };
}

export function generateEmployeeTemplate(): Buffer {
  const data = [
    {
      "Prénom": "Aminata",
      "Nom": "Coulibaly",
      "Email": "a.coulibaly@amsode.ml",
      "Téléphone": "+223 70 00 00 00",
      "CIN": "ML-2024-001",
      "Date de naissance": "1990-01-15",
      "Sexe": "F",
      "Type de contrat": "CDI",
      "Date début": "2024-01-15",
      "Date fin": "",
      "Projet": "",
      "Poste": "",
      "Zone": "Bamako",
      "Salaire de base": "250000",
      "Supérieur Hiérarchique": "",
    },
    {
      "Prénom": "Mamadou",
      "Nom": "Diallo",
      "Email": "m.diallo@amsode.ml",
      "Téléphone": "+223 76 00 00 00",
      "CIN": "ML-2024-002",
      "Date de naissance": "1985-06-20",
      "Sexe": "M",
      "Type de contrat": "CDI",
      "Date début": "2024-02-01",
      "Date fin": "",
      "Projet": "",
      "Poste": "",
      "Zone": "Kayes",
      "Salaire de base": "300000",
      "Supérieur Hiérarchique": "",
    },
  ];

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Employés");
  
  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  return buffer as unknown as Buffer;
}
