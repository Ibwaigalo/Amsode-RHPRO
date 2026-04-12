// src/lib/excel-import.ts
import * as XLSX from "xlsx";

export interface EmployeeImportRow {
  firstName: string;
  lastName: string;
  workEmail?: string;
  personalEmail?: string;
  phone?: string;
  cin?: string;
  dateOfBirth?: string;
  gender?: "M" | "F";
  nationality?: string;
  address?: string;
  city?: string;
  zone?: string;
  statutMatrimonial?: string;
  nbEnfantsCharge?: number;
  emergencyContact?: string;
  emergencyPhone?: string;
  role?: string;
  contractType: "CDI" | "CDD" | "STAGE" | "CONSULTANT";
  startDate: string;
  endDate?: string;
  departmentId?: string;
  positionId?: string;
  baseSalary: string;
  managerId?: string;
  bloodGroup?: string;
  educationLevel?: string;
  fieldOfStudy?: string;
  firstContractDate?: string;
  contractRenewals?: number;
  globalSalaryCost?: string;
  inpsNumber?: string;
  amoNumber?: string;
  departureReason?: string;
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

// AJOUT: Fonction pour normaliser le statut matrimonial
function normalizeMaritalStatus(value: string | undefined): string {
  if (!value) return "Célibataire";
  
  const normalized = String(value).trim().toLowerCase();
  
  // Mapping des valeurs FR/EN vers les valeurs standard
  const statusMap: Record<string, string> = {
    'celibataire': 'Célibataire',
    'celib': 'Célibataire',
    'single': 'Célibataire',
    'marié': 'Marié',
    'marie': 'Marié',
    'married': 'Marié',
    'veuf': 'Veuf/Veuve',
    'veuve': 'Veuf/Veuve',
    'widowed': 'Veuf/Veuve',
    'divorcé': 'Divorcé/Séparé',
    'divorce': 'Divorcé/Séparé',
    'divorced': 'Divorcé/Séparé',
    'separé': 'Divorcé/Séparé',
    'separe': 'Divorcé/Séparé',
    'separated': 'Divorcé/Séparé',
  };
  
  return statusMap[normalized] || "Célibataire";
}

function normalizeRole(value: string | undefined): string {
  if (!value) return "EMPLOYE";
  
  const normalized = String(value).trim().toUpperCase();
  
  const roleMap: Record<string, string> = {
    'EMPLOYE': 'EMPLOYE',
    'EMPLOYEE': 'EMPLOYE',
    'STAFF': 'EMPLOYE',
    'MANAGER': 'MANAGER',
    'CHEF': 'MANAGER',
    'RESPONSABLE': 'MANAGER',
    'ADMIN_RH': 'ADMIN_RH',
    'ADMIN': 'ADMIN_RH',
    'RH': 'ADMIN_RH',
    'HR': 'ADMIN_RH',
    'ADMINISTRATEUR': 'ADMIN_RH',
  };
  
  return roleMap[normalized] || "EMPLOYE";
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
    "firstName": "firstName",
    "Nom": "lastName",
    "lastName": "lastName",
    "Email professionnel": "workEmail",
    "Email": "workEmail",
    "email": "workEmail",
    "workEmail": "workEmail",
    "Email personnel": "personalEmail",
    "personalEmail": "personalEmail",
    "Téléphone": "phone",
    "phone": "phone",
    "CIN": "cin",
    "cin": "cin",
    "Date de naissance": "dateOfBirth",
    "dateOfBirth": "dateOfBirth",
    "Sexe": "gender",
    "gender": "gender",
    "Nationalité": "nationality",
    "nationality": "nationality",
    "Adresse": "address",
    "address": "address",
    "Ville": "city",
    "city": "city",
    "Statut matrimonial": "statutMatrimonial",
    "statutMatrimonial": "statutMatrimonial",
    "statut": "statutMatrimonial",
    "Marital Status": "statutMatrimonial",
    "Enfants à charge": "nbEnfantsCharge",
    "nbEnfantsCharge": "nbEnfantsCharge",
    "enfants": "nbEnfantsCharge",
    "Nb enfants": "nbEnfantsCharge",
    "Children": "nbEnfantsCharge",
    "Contact urgence": "emergencyContact",
    "emergencyContact": "emergencyContact",
    "Téléphone urgence": "emergencyPhone",
    "emergencyPhone": "emergencyPhone",
    "Rôle": "role",
    "role": "role",
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
    "Salaire brut": "baseSalary",
    "Supérieur Hiérarchique": "managerId",
    "managerId": "managerId",
    "Groupe sanguin": "bloodGroup",
    "bloodGroup": "bloodGroup",
    "Niveau d'étude": "educationLevel",
    "educationLevel": "educationLevel",
    "Niveau d'étude": "educationLevel",
    "Niveau étude": "educationLevel",
    "Domaine d'étude": "fieldOfStudy",
    "fieldOfStudy": "fieldOfStudy",
    "Domaine étude": "fieldOfStudy",
    "Date 1er contrat": "firstContractDate",
    "firstContractDate": "firstContractDate",
    "Date entrée": "firstContractDate",
    "Date d'entrée": "firstContractDate",
    "Nbre renouvellements": "contractRenewals",
    "contractRenewals": "contractRenewals",
    "Renouvellements": "contractRenewals",
    "Coût salarial global": "globalSalaryCost",
    "globalSalaryCost": "globalSalaryCost",
    "Coût global": "globalSalaryCost",
    "N° INPS": "inpsNumber",
    "inpsNumber": "inpsNumber",
    "INPS": "inpsNumber",
    "N° AMO": "amoNumber",
    "amoNumber": "amoNumber",
    "AMO": "amoNumber",
    "Motif de départ": "departureReason",
    "departureReason": "departureReason",
    "Motif départ": "departureReason",
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
        personalEmail: normalizedRow.personalEmail ? String(normalizedRow.personalEmail).trim() : undefined,
        phone: normalizedRow.phone ? String(normalizedRow.phone).trim() : undefined,
        cin: normalizedRow.cin ? String(normalizedRow.cin).trim() : undefined,
        dateOfBirth: parseDate(normalizedRow.dateOfBirth),
        gender: normalizedRow.gender && ["M", "F"].includes(String(normalizedRow.gender).toUpperCase()) 
          ? String(normalizedRow.gender).toUpperCase() as "M" | "F" 
          : undefined,
        nationality: normalizedRow.nationality ? String(normalizedRow.nationality).trim() : undefined,
        address: normalizedRow.address ? String(normalizedRow.address).trim() : undefined,
        city: normalizedRow.city ? String(normalizedRow.city).trim() : undefined,
        zone: normalizedRow.zone ? String(normalizedRow.zone).trim() : undefined,
        statutMatrimonial: normalizeMaritalStatus(normalizedRow.statutMatrimonial),
        nbEnfantsCharge: normalizedRow.nbEnfantsCharge !== undefined 
          ? parseInt(String(normalizedRow.nbEnfantsCharge)) || 0 
          : 0,
        emergencyContact: normalizedRow.emergencyContact ? String(normalizedRow.emergencyContact).trim() : undefined,
        emergencyPhone: normalizedRow.emergencyPhone ? String(normalizedRow.emergencyPhone).trim() : undefined,
        role: normalizeRole(normalizedRow.role),
        contractType: normalizedRow.contractType as "CDI" | "CDD" | "STAGE" | "CONSULTANT",
        startDate: parseDate(normalizedRow.startDate) || "",
        endDate: parseDate(normalizedRow.endDate) || undefined,
        departmentId: normalizedRow.departmentId ? String(normalizedRow.departmentId) : undefined,
        positionId: normalizedRow.positionId ? String(normalizedRow.positionId) : undefined,
        baseSalary: String(normalizedRow.baseSalary),
        managerId: normalizedRow.managerId ? String(normalizedRow.managerId).trim() : undefined,
        bloodGroup: normalizedRow.bloodGroup ? String(normalizedRow.bloodGroup).trim() : undefined,
        educationLevel: normalizedRow.educationLevel ? String(normalizedRow.educationLevel).trim() : undefined,
        fieldOfStudy: normalizedRow.fieldOfStudy ? String(normalizedRow.fieldOfStudy).trim() : undefined,
        firstContractDate: parseDate(normalizedRow.firstContractDate) || undefined,
        contractRenewals: normalizedRow.contractRenewals !== undefined 
          ? parseInt(String(normalizedRow.contractRenewals)) || 0 
          : 0,
        globalSalaryCost: normalizedRow.globalSalaryCost ? String(normalizedRow.globalSalaryCost) : undefined,
        inpsNumber: normalizedRow.inpsNumber ? String(normalizedRow.inpsNumber).trim() : undefined,
        amoNumber: normalizedRow.amoNumber ? String(normalizedRow.amoNumber).trim() : undefined,
        departureReason: normalizedRow.departureReason ? String(normalizedRow.departureReason).trim() : undefined,
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
      "Email professionnel": "a.coulibaly@amsode.ml",
      "Email personnel": "aminata@gmail.com",
      "Téléphone": "+223 70 00 00 00",
      "CIN": "ML-2024-001",
      "Date de naissance": "1990-01-15",
      "Sexe": "F",
      "Nationalité": "Malienne",
      "Adresse": "Hamdallaye, Rue 123",
      "Ville": "Bamako",
      "Statut matrimonial": "Marié",
      "Enfants à charge": 2,
      "Contact urgence": "Moussa Coulibaly",
      "Téléphone urgence": "+223 70 00 00 01",
      "Rôle": "EMPLOYE",
      "Type de contrat": "CDI",
      "Date d'entrée": "2024-01-15",
      "Date début": "2024-01-15",
      "Date fin": "",
      "Projet": "",
      "Poste": "",
      "Zone": "Bamako",
      "Salaire de base": "250000",
      "Coût salarial global": "",
      "Supérieur Hiérarchique": "",
      "Groupe sanguin": "O+",
      "Niveau d'étude": "BAC+5",
      "Domaine d'étude": "Informatique",
      "Nbre renouvellements": 0,
      "N° INPS": "",
      "N° AMO": "",
      "Motif de départ": "",
    },
    {
      "Prénom": "Mamadou",
      "Nom": "Diallo",
      "Email professionnel": "m.diallo@amsode.ml",
      "Email personnel": "mamadou@gmail.com",
      "Téléphone": "+223 76 00 00 00",
      "CIN": "ML-2024-002",
      "Date de naissance": "1985-06-20",
      "Sexe": "M",
      "Nationalité": "Malienne",
      "Adresse": "ACI 2000, Rue 45",
      "Ville": "Bamako",
      "Statut matrimonial": "Célibataire",
      "Enfants à charge": 0,
      "Contact urgence": "",
      "Téléphone urgence": "",
      "Rôle": "EMPLOYE",
      "Type de contrat": "CDI",
      "Date d'entrée": "2024-02-01",
      "Date début": "2024-02-01",
      "Date fin": "",
      "Projet": "",
      "Poste": "",
      "Zone": "Kayes",
      "Salaire de base": "300000",
      "Coût salarial global": "",
      "Supérieur Hiérarchique": "",
      "Groupe sanguin": "A+",
      "Niveau d'étude": "BAC+3",
      "Domaine d'étude": "Gestion",
      "Nbre renouvellements": 0,
      "N° INPS": "",
      "N° AMO": "",
      "Motif de départ": "",
    },
  ];

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Employés");
  
  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  return buffer as unknown as Buffer;
}
