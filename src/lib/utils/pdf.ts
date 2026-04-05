import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { formatCurrency, MONTHS_FR } from './payroll';

interface PayslipData {
  employee: {
    firstName: string;
    lastName: string;
    employeeNumber: string;
    position: string;
    department: string;
    startDate: string;
  };
  period: { month: number; year: number };
  payroll: {
    baseSalary: number;
    transportAllowance: number;
    housingAllowance: number;
    mealAllowance: number;
    performanceBonus: number;
    otherBonuses: number;
    grossSalary: number;
    cnssEmployee: number;
    cnssEmployer: number;
    imuEmployee: number;
    advanceDeduction: number;
    otherDeductions: number;
    netSalary: number;
  };
  logoBase64?: string;
}

export async function generatePayslipPDF(data: PayslipData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4
  const { width, height } = page.getSize();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const blue = rgb(0.07, 0.27, 0.60);
  const gray = rgb(0.5, 0.5, 0.5);
  const darkGray = rgb(0.2, 0.2, 0.2);
  const white = rgb(1, 1, 1);

  // Header background
  page.drawRectangle({ x: 0, y: height - 110, width, height: 110, color: blue });

  // Title
  page.drawText('BULLETIN DE PAIE', { x: 40, y: height - 45, size: 20, font: fontBold, color: white });
  page.drawText(`AMSODE — Association Malienne pour le Développement`, { x: 40, y: height - 65, size: 9, font, color: rgb(0.8, 0.9, 1) });
  page.drawText(`Période : ${MONTHS_FR[data.period.month - 1]} ${data.period.year}`, { x: 40, y: height - 85, size: 11, font: fontBold, color: white });
  page.drawText(`Confidentiel`, { x: width - 120, y: height - 85, size: 9, font, color: rgb(0.7, 0.8, 0.95) });

  // Espace logo (coin droit)
  page.drawText('[LOGO]', { x: width - 100, y: height - 55, size: 10, font, color: rgb(0.7, 0.8, 0.95) });

  let y = height - 140;

  // Employee info box
  page.drawRectangle({ x: 30, y: y - 60, width: width - 60, height: 70, color: rgb(0.96, 0.97, 0.99), borderColor: rgb(0.85, 0.88, 0.95), borderWidth: 1 });
  page.drawText(`Employé(e) : ${data.employee.firstName} ${data.employee.lastName}`, { x: 45, y: y - 15, size: 11, font: fontBold, color: darkGray });
  page.drawText(`N° Matricule : ${data.employee.employeeNumber}`, { x: 45, y: y - 30, size: 9, font, color: gray });
  page.drawText(`Poste : ${data.employee.position}`, { x: 45, y: y - 45, size: 9, font, color: gray });
  page.drawText(`Département : ${data.employee.department}`, { x: 280, y: y - 30, size: 9, font, color: gray });
  page.drawText(`Date d'embauche : ${data.employee.startDate}`, { x: 280, y: y - 45, size: 9, font, color: gray });

  y -= 80;

  // Section Gains
  const drawSectionHeader = (title: string, yPos: number) => {
    page.drawRectangle({ x: 30, y: yPos - 18, width: width - 60, height: 22, color: blue });
    page.drawText(title, { x: 45, y: yPos - 12, size: 10, font: fontBold, color: white });
    page.drawText('Montant (FCFA)', { x: width - 150, y: yPos - 12, size: 10, font: fontBold, color: white });
  };

  const drawRow = (label: string, amount: number, yPos: number, isTotal = false) => {
    if (isTotal) {
      page.drawRectangle({ x: 30, y: yPos - 14, width: width - 60, height: 18, color: rgb(0.93, 0.96, 1) });
    }
    const f = isTotal ? fontBold : font;
    const c = isTotal ? blue : darkGray;
    page.drawText(label, { x: 45, y: yPos - 8, size: isTotal ? 10 : 9, font: f, color: c });
    page.drawText(formatCurrency(amount), { x: width - 160, y: yPos - 8, size: isTotal ? 10 : 9, font: f, color: c });
    if (yPos % 2 === 0 && !isTotal) {
      page.drawRectangle({ x: 30, y: yPos - 14, width: width - 60, height: 18, color: rgb(0.98, 0.98, 0.98) });
      page.drawText(label, { x: 45, y: yPos - 8, size: 9, font, color: darkGray });
      page.drawText(formatCurrency(amount), { x: width - 160, y: yPos - 8, size: 9, font, color: darkGray });
    }
  };

  drawSectionHeader('ÉLÉMENTS DE RÉMUNÉRATION (GAINS)', y);
  y -= 25;
  const gainRows = [
    ['Salaire de base', data.payroll.baseSalary],
    ['Indemnité de transport', data.payroll.transportAllowance],
    ['Indemnité de logement', data.payroll.housingAllowance],
    ['Indemnité de repas', data.payroll.mealAllowance],
    ['Prime de performance', data.payroll.performanceBonus],
    ['Autres primes', data.payroll.otherBonuses],
  ] as [string, number][];

  gainRows.forEach(([label, amount]) => {
    if (amount > 0) {
      drawRow(label, amount, y);
      y -= 20;
    }
  });

  drawRow('SALAIRE BRUT', data.payroll.grossSalary, y, true);
  y -= 30;

  drawSectionHeader('RETENUES ET COTISATIONS', y);
  y -= 25;
  const deductionRows = [
    ['CNSS (part salarié 3.6%)', data.payroll.cnssEmployee],
    ['IMU (Impôt sur traitement)', data.payroll.imuEmployee],
    ['Avance sur salaire', data.payroll.advanceDeduction],
    ['Autres retenues', data.payroll.otherDeductions],
  ] as [string, number][];

  deductionRows.forEach(([label, amount]) => {
    if (amount > 0) {
      drawRow(label, amount, y);
      y -= 20;
    }
  });

  y -= 10;
  // Net à payer - highlighted
  page.drawRectangle({ x: 30, y: y - 30, width: width - 60, height: 38, color: blue });
  page.drawText('NET À PAYER', { x: 45, y: y - 16, size: 14, font: fontBold, color: white });
  page.drawText(formatCurrency(data.payroll.netSalary), { x: width - 200, y: y - 16, size: 14, font: fontBold, color: white });

  y -= 60;

  // CNSS Patronal info
  page.drawText(`Cotisation CNSS patronale (9.6%) : ${formatCurrency(data.payroll.cnssEmployer)}`, { x: 45, y, size: 8, font, color: gray });

  y -= 30;
  // Signature block
  page.drawText('Signature du Président / DG', { x: width - 200, y, size: 9, font: fontBold, color: darkGray });
  page.drawLine({ start: { x: width - 200, y: y - 40 }, end: { x: width - 40, y: y - 40 }, thickness: 0.5, color: gray });

  // Footer
  page.drawLine({ start: { x: 30, y: 50 }, end: { x: width - 30, y: 50 }, thickness: 0.5, color: rgb(0.8, 0.8, 0.8) });
  page.drawText('Document confidentiel — AMSODE RH PRO © 2026 — Ne pas diffuser', { x: 30, y: 35, size: 7, font, color: gray });
  page.drawText(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, { x: width - 130, y: 35, size: 7, font, color: gray });

  return pdfDoc.save();
}
