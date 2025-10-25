import PDFDocument from 'pdfkit';
import fs from 'fs';

export interface CategoryTotal {
  label: string;
  total: number;
}

export interface MonthlyReportUser {
  name: string;
  email?: string;
  salary: number;
  expensesTotal: number;
  expensesByCategory?: CategoryTotal[];
  // Total de ativos de investimento convertido para BRL
  assetsTotalBRL?: number;
  // Total de ativos de investimento convertido para EUR
  assetsTotalEUR?: number;
  // Saldos dos fundos (entradas - despesas)
  fundBalances?: {
    emergencyBRL: number;
    viagemBRL: number;
    carroBRL: number;
  };
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

  const fmt = (n: number) => (n || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const fmtEUR = (n: number) => (n || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'EUR' });

    users.forEach((user, idx) => {
      doc.fontSize(14).text(`Usuário: ${user.name}${user.email ? ` (${user.email})` : ''}`);
      doc.fontSize(12).text(`Salário do mês: ${fmt(user.salary)}`);
      
      // Despesas por categoria
      doc.text(`Despesas por categoria:`);
      if (user.expensesByCategory && user.expensesByCategory.length > 0) {
        user.expensesByCategory.forEach((c) => {
          doc.text(` • ${c.label}: ${fmt(c.total)}`);
        });
      } else {
        doc.text(' • Sem despesas registradas no período.');
      }
      doc.text(`Total de Despesas: ${fmt(user.expensesTotal)}`);

      // Fundos - saldos
      if (user.fundBalances) {
        doc.moveDown(0.5);
        doc.text(`Fundos - Saldos:`);
        doc.text(` • Emergência: ${fmt(user.fundBalances.emergencyBRL)}`);
        doc.text(` • Viagem: ${fmt(user.fundBalances.viagemBRL)}`);
        doc.text(` • Carro: ${fmt(user.fundBalances.carroBRL)}`);
      }

      // Investimentos (montante de ativos em BRL e EUR)
      if (typeof user.assetsTotalBRL === 'number' || typeof user.assetsTotalEUR === 'number') {
        const parts: string[] = [];
        if (typeof user.assetsTotalBRL === 'number') parts.push(`BRL: ${fmt(user.assetsTotalBRL)}`);
        if (typeof user.assetsTotalEUR === 'number') parts.push(`EUR: ${fmtEUR(user.assetsTotalEUR)}`);
        doc.text(`Ativos (Investimentos): ${parts.join(' | ')}`);
      }
      doc.moveDown(0.5);
      doc.text(`Saldo do Mês (Salário - Despesas): ${fmt(user.balance)}`);
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
  // Lista de salários por usuário (nome e total no ano)
  salariesByUser: Array<{ name: string; totalBRL: number }>;
  // Entradas por fundo
  fundEntries: {
    investmentBRL: number;
    emergencyBRL: number;
    viagemBRL: number;
    carroBRL: number;
    totalBRL: number;
  };
  // Despesas por fundo
  fundExpenses: {
    emergencyBRL: number;
    viagemBRL: number;
    carroBRL: number;
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

    // Salários por usuário
    doc.fontSize(14).text('Salários por Usuário (Anual)');
    doc.fontSize(12);
    if (!data.salariesByUser || data.salariesByUser.length === 0) {
      doc.text('Sem salários registrados no ano.');
    } else {
      data.salariesByUser.forEach((s) => {
        doc.text(`${s.name}: ${fmtBRL(s.totalBRL)}`);
      });
    }
    doc.moveDown();

    // Entradas por fundo
    doc.fontSize(14).text('Entradas por Fundo (Total Anual)');
    doc.fontSize(12).text(`Investimentos (aportes): ${fmtBRL(data.fundEntries.investmentBRL)}`);
    doc.text(`Emergência (entradas): ${fmtBRL(data.fundEntries.emergencyBRL)}`);
    doc.text(`Viagem (entradas): ${fmtBRL(data.fundEntries.viagemBRL)}`);
    doc.text(`Carro (entradas): ${fmtBRL(data.fundEntries.carroBRL)}`);
    doc.text(`Total de Entradas (Fundos): ${fmtBRL(data.fundEntries.totalBRL)}`);
    doc.moveDown();

    // Despesas por fundo
    doc.fontSize(14).text('Despesas por Fundo (Total Anual)');
    doc.fontSize(12).text(`Emergência (despesas): ${fmtBRL(data.fundExpenses.emergencyBRL)}`);
    doc.text(`Viagem (despesas): ${fmtBRL(data.fundExpenses.viagemBRL)}`);
    doc.text(`Carro (despesas): ${fmtBRL(data.fundExpenses.carroBRL)}`);
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
