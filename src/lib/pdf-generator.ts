// src/lib/pdf-generator.ts
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { formatXOF } from "./payroll-engine";

export interface PayslipData {
  employee: {
    name: string;
    position: string;
    department: string;
    employeeNumber: string;
    contractType: string;
  };
  period: { month: number; year: number };
  payroll: {
    baseSalary: number;
    transportAllowance: number;
    housingAllowance: number;
    performanceBonus: number;
    otherAllowances: number;
    grossSalary: number;
    cnssEmployee: number;
    incomeTax: number;
    totalDeductions: number;
    netSalary: number;
  };
  organization: {
    name: string;
    logoUrl?: string;
    address?: string;
    cnssNumber?: string;
    presidentName?: string;
  };
}

const MONTHS_FR = [
  "", "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

export async function generatePayslipPDF(data: PayslipData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4
  const { width, height } = page.getSize();

  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const blue = rgb(0.051, 0.376, 0.651);
  const darkGray = rgb(0.2, 0.2, 0.2);
  const lightGray = rgb(0.95, 0.95, 0.95);
  const white = rgb(1, 1, 1);

  // ── Header ──────────────────────────────────────────────────────────────────
  page.drawRectangle({ x: 0, y: height - 80, width, height: 80, color: blue });

  page.drawText(data.organization.name, {
    x: 30, y: height - 45,
    size: 20, font: fontBold, color: white,
  });
  page.drawText("BULLETIN DE PAIE", {
    x: width - 200, y: height - 35,
    size: 16, font: fontBold, color: white,
  });
  page.drawText(`${MONTHS_FR[data.period.month]} ${data.period.year}`, {
    x: width - 200, y: height - 55,
    size: 12, font: fontRegular, color: white,
  });

  // ── Infos employé ──────────────────────────────────────────────────────────
  let y = height - 110;
  page.drawRectangle({ x: 20, y: y - 10, width: width - 40, height: 80, color: lightGray });

  const leftCol = 30;
  const rightCol = width / 2 + 20;

  page.drawText("INFORMATIONS EMPLOYÉ", { x: leftCol, y, size: 9, font: fontBold, color: blue });
  y -= 18;
  page.drawText(`Nom & Prénom : ${data.employee.name}`, { x: leftCol, y, size: 9, font: fontRegular, color: darkGray });
  page.drawText(`N° Employé : ${data.employee.employeeNumber}`, { x: rightCol, y, size: 9, font: fontRegular, color: darkGray });
  y -= 14;
  page.drawText(`Poste : ${data.employee.position}`, { x: leftCol, y, size: 9, font: fontRegular, color: darkGray });
  page.drawText(`Contrat : ${data.employee.contractType}`, { x: rightCol, y, size: 9, font: fontRegular, color: darkGray });
  y -= 14;
  page.drawText(`Département : ${data.employee.department}`, { x: leftCol, y, size: 9, font: fontRegular, color: darkGray });

  // ── Table rémunérations ────────────────────────────────────────────────────
  y -= 30;
  page.drawText("RÉMUNÉRATIONS ET PRIMES", { x: leftCol, y, size: 10, font: fontBold, color: blue });
  y -= 6;
  page.drawLine({ start: { x: 20, y }, end: { x: width - 20, y }, thickness: 1.5, color: blue });

  const drawRow = (label: string, amount: number, isBold = false, bg?: ReturnType<typeof rgb>) => {
    y -= 20;
    if (bg) page.drawRectangle({ x: 20, y: y - 4, width: width - 40, height: 18, color: bg });
    const font = isBold ? fontBold : fontRegular;
    page.drawText(label, { x: leftCol, y, size: 9, font, color: darkGray });
    page.drawText(formatXOF(amount), { x: width - 160, y, size: 9, font, color: darkGray });
  };

  drawRow("Salaire de base", data.payroll.baseSalary);
  if (data.payroll.transportAllowance > 0) drawRow("Indemnité de transport", data.payroll.transportAllowance);
  if (data.payroll.housingAllowance > 0) drawRow("Indemnité de logement", data.payroll.housingAllowance);
  if (data.payroll.performanceBonus > 0) drawRow("Prime de performance", data.payroll.performanceBonus);
  if (data.payroll.otherAllowances > 0) drawRow("Autres primes", data.payroll.otherAllowances);
  drawRow("SALAIRE BRUT", data.payroll.grossSalary, true, lightGray);

  // ── Table retenues ─────────────────────────────────────────────────────────
  y -= 20;
  page.drawText("RETENUES ET COTISATIONS", { x: leftCol, y, size: 10, font: fontBold, color: rgb(0.7, 0.1, 0.1) });
  y -= 6;
  page.drawLine({ start: { x: 20, y }, end: { x: width - 20, y }, thickness: 1.5, color: rgb(0.7, 0.1, 0.1) });

  drawRow("Cotisation CNSS (3.3%)", data.payroll.cnssEmployee);
  drawRow("Impôt sur le Revenu (IRG)", data.payroll.incomeTax);
  drawRow("TOTAL RETENUES", data.payroll.totalDeductions, true, lightGray);

  // ── NET À PAYER ────────────────────────────────────────────────────────────
  y -= 25;
  page.drawRectangle({ x: 20, y: y - 8, width: width - 40, height: 30, color: blue });
  page.drawText("NET À PAYER", { x: leftCol, y: y + 6, size: 12, font: fontBold, color: white });
  page.drawText(formatXOF(data.payroll.netSalary), { x: width - 200, y: y + 6, size: 14, font: fontBold, color: white });

  // ── Signature ──────────────────────────────────────────────────────────────
  y -= 60;
  page.drawText(`Fait à Bamako, le ${new Date().toLocaleDateString("fr-ML")}`, {
    x: leftCol, y, size: 8, font: fontRegular, color: darkGray,
  });
  page.drawText("Signature et cachet :", {
    x: width - 200, y, size: 8, font: fontBold, color: darkGray,
  });
  if (data.organization.presidentName) {
    page.drawText(data.organization.presidentName, {
      x: width - 200, y: y - 40, size: 8, font: fontRegular, color: darkGray,
    });
  }
  page.drawText("Le Président / DG", {
    x: width - 200, y: y - 55, size: 8, font: fontRegular, color: darkGray,
  });

  // ── Footer ─────────────────────────────────────────────────────────────────
  page.drawLine({ start: { x: 20, y: 30 }, end: { x: width - 20, y: 30 }, thickness: 0.5, color: rgb(0.8, 0.8, 0.8) });
  page.drawText(`${data.organization.name} — Document confidentiel — CNSS N° ${data.organization.cnssNumber ?? "–"}`, {
    x: 30, y: 18, size: 7, font: fontRegular, color: rgb(0.6, 0.6, 0.6),
  });

  return pdfDoc.save();
}

export async function generateExcelPayrollReport(payslips: any[]): Promise<Buffer> {
  const XLSX = await import("xlsx");
  const headers = ["Employé", "Matricule", "Département", "Brut", "CNSS", "IRG", "Net"];
  const rows = payslips.map((p) => [
    p.employeeName,
    p.employeeNumber,
    p.department,
    p.grossSalary,
    p.cnssEmployee,
    p.incomeTax,
    p.netSalary,
  ]);

  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Rapport Paie");
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
}
