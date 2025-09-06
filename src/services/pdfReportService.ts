import PDFDocument from 'pdfkit';
import fs from 'fs';

export interface MonthlyReportUser {
  name: string;
  email?: string;
  salary: number;
  expenses: number;
  balance: number;
}

export async function generateMonthlyReportPDF(
  users: MonthlyReportUser[],
  month: string,
  year: number,
  outputPath: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);

    doc.fontSize(20).text(`Relatório Mensal - ${month}/${year}`, { align: 'center' });
    doc.moveDown();

    users.forEach((user, idx) => {
      doc.fontSize(14).text(`Usuário: ${user.name}${user.email ? ` (${user.email})` : ''}`);
      doc.fontSize(12).text(`Salário: € ${user.salary.toLocaleString('de-DE', { minimumFractionDigits: 2 })}`);
      doc.text(`Despesas: € ${user.expenses.toLocaleString('de-DE', { minimumFractionDigits: 2 })}`);
      doc.text(`Saldo: € ${user.balance.toLocaleString('de-DE', { minimumFractionDigits: 2 })}`);
      doc.moveDown();
      if (idx < users.length - 1) doc.moveDown();
    });

    doc.end();
    stream.on('finish', resolve);
    stream.on('error', reject);
  });
}
