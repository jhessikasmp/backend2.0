import PDFDocument from 'pdfkit';
import fs from 'fs';

export interface MonthlyReportUser {
  name: string;
  email?: string;
  salary: number;
  expenses: number;
  entriesTotal?: number;
  // Total de ativos de investimento convertido para BRL
  assetsTotalBRL?: number;
  // Total de ativos de investimento convertido para EUR
  assetsTotalEUR?: number;
  balance: number;
}

// Gerar PDF como buffer para download direto
export async function generateMonthlyReportPDF(
  users: MonthlyReportUser[],
  month: string,
  year: number
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const buffers: Buffer[] = [];

    doc.on('data', (chunk) => buffers.push(chunk));
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(buffers);
      resolve(pdfBuffer);
    });
    doc.on('error', reject);

    doc.fontSize(20).text(`Relatório Mensal - ${month}/${year}`, { align: 'center' });
    doc.moveDown();

    const fmt = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const fmtEUR = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'EUR' });

    users.forEach((user, idx) => {
      doc.fontSize(14).text(`Usuário: ${user.name}${user.email ? ` (${user.email})` : ''}`);
      doc.fontSize(12).text(`Salário: ${fmt(user.salary)}`);
      doc.text(`Despesas: ${fmt(user.expenses)}`);
      if (typeof user.entriesTotal === 'number') {
        doc.text(`Outras saídas (investimentos, emergência, viagens, carro, mesada): ${fmt(user.entriesTotal)}`);
      }
      if (typeof user.assetsTotalBRL === 'number' || typeof user.assetsTotalEUR === 'number') {
        const parts: string[] = [];
        if (typeof user.assetsTotalBRL === 'number') parts.push(fmt(user.assetsTotalBRL));
        if (typeof user.assetsTotalEUR === 'number') parts.push(fmtEUR(user.assetsTotalEUR));
        doc.text(`Total de Ativos (Investimentos): ${parts.join(' | ')}`);
      }
      doc.text(`Saldo: ${fmt(user.balance)}`);
      doc.moveDown();
      if (idx < users.length - 1) doc.moveDown();
    });

    doc.end();
  });
}

// =========================
// Relatório Anual (PDF)
// =========================
export interface AnnualCategoryTotal {
  label: string;
  total: number;
}

export interface AnnualReportData {
  year: number;
  salariesTotalBRL: number;
  expensesTotalBRL: number;
  // Entradas por fundo
  fundEntries: {
    investmentBRL: number;
    emergencyBRL: number;
    viagemBRL: number;
    carroBRL: number;
    mesadaBRL: number;
    totalBRL: number;
  };
  // Despesas por fundo
  fundExpenses: {
    emergencyBRL: number;
    viagemBRL: number;
    carroBRL: number;
    mesadaBRL: number;
    totalBRL: number;
  };
  // Categorias de despesas pessoais (Expense)
  expenseCategories: AnnualCategoryTotal[];
  // Comparação de gastos (categorias + fundos como categorias)
  topSpending: AnnualCategoryTotal[]; // já ordenado desc
  biggestSpending?: AnnualCategoryTotal; // o maior
}

export async function generateAnnualReportPDF(
  data: AnnualReportData
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const buffers: Buffer[] = [];

    doc.on('data', (chunk) => buffers.push(chunk));
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(buffers);
      resolve(pdfBuffer);
    });
    doc.on('error', reject);

    const fmtBRL = (n: number) => (n || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    // Header
    doc.fontSize(20).text(`Relatório Anual - ${data.year}`, { align: 'center' });
    doc.moveDown();

    // Totais principais
    doc.fontSize(14).text('Totais Gerais');
    doc.fontSize(12).text(`Salários (Total Anual): ${fmtBRL(data.salariesTotalBRL)}`);
    doc.text(`Despesas (Total Anual - pessoais): ${fmtBRL(data.expensesTotalBRL)}`);
    doc.moveDown();

    // Entradas por fundo
    doc.fontSize(14).text('Entradas por Fundo (Total Anual)');
    doc.fontSize(12).text(`Investimentos (aportes): ${fmtBRL(data.fundEntries.investmentBRL)}`);
    doc.text(`Emergência (entradas): ${fmtBRL(data.fundEntries.emergencyBRL)}`);
    doc.text(`Viagem (entradas): ${fmtBRL(data.fundEntries.viagemBRL)}`);
    doc.text(`Carro (entradas): ${fmtBRL(data.fundEntries.carroBRL)}`);
    doc.text(`Mesada (entradas): ${fmtBRL(data.fundEntries.mesadaBRL)}`);
    doc.text(`Total de Entradas (Fundos): ${fmtBRL(data.fundEntries.totalBRL)}`);
    doc.moveDown();

    // Despesas por fundo
    doc.fontSize(14).text('Despesas por Fundo (Total Anual)');
    doc.fontSize(12).text(`Emergência (despesas): ${fmtBRL(data.fundExpenses.emergencyBRL)}`);
    doc.text(`Viagem (despesas): ${fmtBRL(data.fundExpenses.viagemBRL)}`);
    doc.text(`Carro (despesas): ${fmtBRL(data.fundExpenses.carroBRL)}`);
    doc.text(`Mesada (despesas): ${fmtBRL(data.fundExpenses.mesadaBRL)}`);
    doc.text(`Total de Despesas (Fundos): ${fmtBRL(data.fundExpenses.totalBRL)}`);
    doc.moveDown();

    // Categorias de despesas pessoais
    doc.fontSize(14).text('Despesas Pessoais por Categoria (Anual)');
    doc.fontSize(12);
    if (data.expenseCategories.length === 0) {
      doc.text('Sem despesas pessoais registradas no ano.');
    } else {
      data.expenseCategories.forEach((c) => {
        doc.text(`${c.label}: ${fmtBRL(c.total)}`);
      });
    }
    doc.moveDown();

    // Comparação de gastos
    doc.fontSize(14).text('Comparação de Gastos (Top)');
    doc.fontSize(12);
    if (data.topSpending.length === 0) {
      doc.text('Sem dados para comparação.');
    } else {
      data.topSpending.forEach((c, idx) => {
        doc.text(`${idx + 1}. ${c.label}: ${fmtBRL(c.total)}`);
      });
      if (data.biggestSpending) {
        doc.moveDown();
        doc.fontSize(13).text(`Maior gasto: ${data.biggestSpending.label} (${fmtBRL(data.biggestSpending.total)})`);
      }
    }

    doc.end();
  });
}
