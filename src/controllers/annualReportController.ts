import path from 'path';
import { Request, Response } from 'express';
import { authorize, uploadFileToDrive } from '../services/googleDriveService';
import { AnnualReportData, AnnualCategoryTotal, generateAnnualReportPDF } from '../services/pdfReportService';
import Salary from '../models/Salary';
import Expense from '../models/Expense';
import InvestmentEntry from '../models/InvestmentEntry';
import EmergencyEntry from '../models/EmergencyEntry';
import EmergencyExpense from '../models/EmergencyExpense';
import ViagemEntry from '../models/ViagemEntry';
import ViagemExpense from '../models/ViagemExpense';
import CarroEntry from '../models/CarroEntry';
import CarroExpense from '../models/CarroExpense';
import MesadaEntry from '../models/MesadaEntry';
import MesadaExpense from '../models/MesadaExpense';

// Pasta do Drive (mesma usada no mensal por padrão)
const GOOGLE_DRIVE_FOLDER_ID = '1ARdpGJ11ZWI7JnDPpozQyHQGI7Tt0k0M';

export async function generateAndSendAnnualReport(req: Request, res: Response) {
  try {
    // Se não for passado ?year, usa o ano corrente
    const now = new Date();
    const targetYear = req.query.year ? Number(req.query.year) : now.getFullYear();

    const start = new Date(targetYear, 0, 1, 0, 0, 0, 0);
    const end = new Date(targetYear, 11, 31, 23, 59, 59, 999);

    // Totais principais
    const salariesAgg = await Salary.aggregate([
      { $match: { date: { $gte: start, $lte: end } } },
      { $group: { _id: null, total: { $sum: '$value' } } }
    ]);
    const salariesTotalBRL = salariesAgg[0]?.total || 0;

    const expensesAgg = await Expense.aggregate([
      { $match: { date: { $gte: start, $lte: end } } },
      { $group: { _id: null, total: { $sum: '$value' } } }
    ]);
    const expensesTotalBRL = expensesAgg[0]?.total || 0;

    // Entradas por fundo (BRL por padrão nos fundos)
    const [invEntriesAgg, emeEntriesAgg, viaEntriesAgg, carEntriesAgg, mesEntriesAgg] = await Promise.all([
      InvestmentEntry.aggregate([
        { $match: { date: { $gte: start, $lte: end } } },
        { $group: { _id: null, total: { $sum: '$value' } } }
      ]),
      EmergencyEntry.aggregate([
        { $match: { data: { $gte: start, $lte: end } } },
        { $group: { _id: null, total: { $sum: '$valor' } } }
      ]),
      ViagemEntry.aggregate([
        { $match: { data: { $gte: start, $lte: end } } },
        { $group: { _id: null, total: { $sum: '$valor' } } }
      ]),
      CarroEntry.aggregate([
        { $match: { data: { $gte: start, $lte: end } } },
        { $group: { _id: null, total: { $sum: '$valor' } } }
      ]),
      MesadaEntry.aggregate([
        { $match: { data: { $gte: start, $lte: end } } },
        { $group: { _id: null, total: { $sum: '$valor' } } }
      ])
    ]);
    const fundEntries = {
      investmentBRL: invEntriesAgg[0]?.total || 0,
      emergencyBRL: emeEntriesAgg[0]?.total || 0,
      viagemBRL: viaEntriesAgg[0]?.total || 0,
      carroBRL: carEntriesAgg[0]?.total || 0,
      mesadaBRL: mesEntriesAgg[0]?.total || 0,
    };
    const fundEntriesTotal = Object.values(fundEntries).reduce((a, b) => a + (b as number), 0);

    // Despesas por fundo
    const [emeExpAgg, viaExpAgg, carExpAgg, mesExpAgg] = await Promise.all([
      EmergencyExpense.aggregate([
        { $match: { data: { $gte: start, $lte: end } } },
        { $group: { _id: null, total: { $sum: '$valor' } } }
      ]),
      ViagemExpense.aggregate([
        { $match: { data: { $gte: start, $lte: end } } },
        { $group: { _id: null, total: { $sum: '$valor' } } }
      ]),
      CarroExpense.aggregate([
        { $match: { data: { $gte: start, $lte: end } } },
        { $group: { _id: null, total: { $sum: '$valor' } } }
      ]),
      MesadaExpense.aggregate([
        { $match: { data: { $gte: start, $lte: end } } },
        { $group: { _id: null, total: { $sum: '$valor' } } }
      ])
    ]);
    const fundExpenses = {
      emergencyBRL: emeExpAgg[0]?.total || 0,
      viagemBRL: viaExpAgg[0]?.total || 0,
      carroBRL: carExpAgg[0]?.total || 0,
      mesadaBRL: mesExpAgg[0]?.total || 0,
    };
    const fundExpensesTotal = Object.values(fundExpenses).reduce((a, b) => a + (b as number), 0);

    // Despesas pessoais por categoria
    const expenseCategoriesAgg = await Expense.aggregate([
      { $match: { date: { $gte: start, $lte: end } } },
      { $group: { _id: '$category', total: { $sum: '$value' } } },
      { $sort: { total: -1 } }
    ]);
    const expenseCategories: AnnualCategoryTotal[] = expenseCategoriesAgg.map((c) => ({ label: c._id, total: c.total }));

    // Comparação de gastos: categorias + despesas dos fundos como "categorias"
    const comparison: AnnualCategoryTotal[] = [
      ...expenseCategories,
      { label: 'Fundo: Emergência (despesas)', total: fundExpenses.emergencyBRL },
      { label: 'Fundo: Viagem (despesas)', total: fundExpenses.viagemBRL },
      { label: 'Fundo: Carro (despesas)', total: fundExpenses.carroBRL },
      { label: 'Fundo: Mesada (despesas)', total: fundExpenses.mesadaBRL },
    ].sort((a, b) => b.total - a.total);
    const biggestSpending = comparison[0];

    const data: AnnualReportData = {
      year: targetYear,
      salariesTotalBRL,
      expensesTotalBRL,
      fundEntries: { ...fundEntries, totalBRL: fundEntriesTotal },
      fundExpenses: { ...fundExpenses, totalBRL: fundExpensesTotal },
      expenseCategories,
      topSpending: comparison.slice(0, 10),
      biggestSpending,
    };

    const fileName = `relatorio-anual-${targetYear}.pdf`;
    const outputPath = path.join(process.cwd(), fileName);

    await generateAnnualReportPDF(data, outputPath);

    const auth = await authorize();
    const fileId = await uploadFileToDrive(auth, outputPath, GOOGLE_DRIVE_FOLDER_ID, fileName);

    res.json({ success: true, fileId });
  } catch (error) {
    console.error('Erro ao gerar/enviar relatório anual:', error);
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : String(error) });
  }
}
