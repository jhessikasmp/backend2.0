import { Request, Response } from 'express';
import { generateMonthlyReportPDF, MonthlyReportUser, generateAnnualReportPDF, AnnualReportData, AnnualCategoryTotal } from '../services/pdfReportService';
import User from '../models/User';
import Salary from '../models/Salary';
import Expense from '../models/Expense';
import InvestmentEntry from '../models/InvestmentEntry';
import Investment from '../models/Investment';
import EmergencyEntry from '../models/EmergencyEntry';
import ViagemEntry from '../models/ViagemEntry';
import CarroEntry from '../models/CarroEntry';
import MesadaEntry from '../models/MesadaEntry';
import EmergencyExpense from '../models/EmergencyExpense';
import ViagemExpense from '../models/ViagemExpense';
import CarroExpense from '../models/CarroExpense';
import MesadaExpense from '../models/MesadaExpense';

// Relatório customizado com período específico
export async function generateCustomPeriodReport(req: Request, res: Response): Promise<void> {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      res.status(400).json({ 
        success: false, 
        error: 'Parâmetros startDate e endDate são obrigatórios (formato: YYYY-MM-DD)' 
      });
      return;
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);
    end.setHours(23, 59, 59, 999); // Final do dia

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      res.status(400).json({ 
        success: false, 
        error: 'Datas inválidas. Use o formato YYYY-MM-DD' 
      });
      return;
    }

    if (start > end) {
      res.status(400).json({ 
        success: false, 
        error: 'Data inicial deve ser anterior à data final' 
      });
      return;
    }

    // Buscar dados dos usuários
    const users = await User.find();
    const reportData: MonthlyReportUser[] = [];

    // Conversão de moedas (igual ao sistema existente)
    const EUR_TO_BRL = 1 / 0.18; // ~5.5555
    const toBRL = (valor: number, moeda?: string): number => {
      if (!valor || !Number.isFinite(valor as number)) return 0;
      switch (moeda) {
        case 'Real':
          return valor;
        case 'Euro':
          return valor * EUR_TO_BRL;
        case 'Dolar':
          return valor * (0.90 * EUR_TO_BRL);
        default:
          return valor;
      }
    };
    const toEUR = (valor: number, moeda?: string): number => {
      if (!valor || !Number.isFinite(valor as number)) return 0;
      switch (moeda) {
        case 'Euro':
          return valor;
        case 'Real':
          return valor * 0.18;
        case 'Dolar':
          return valor * 0.90;
        default:
          return valor;
      }
    };

    for (const user of users) {
      console.log(`Gerando dados para usuário: ${user._id} - ${user.name} (${startDate} a ${endDate})`);
      
      // Buscar salários do período
      const salaries = await Salary.find({
        user: user._id,
        date: { $gte: start, $lte: end }
      });
      const salary = salaries.reduce((sum, s) => sum + s.value, 0);

      // Despesas do período
      const expenses = await Expense.find({
        user: user._id,
        date: { $gte: start, $lte: end }
      });
      const expensesTotal = expenses.reduce((sum, exp) => sum + exp.value, 0);

      // Outras saídas do período
      const [invEntries, emeSum, viaSum, carSum, mesSum] = await Promise.all([
        InvestmentEntry.find({ user: user._id, date: { $gte: start, $lte: end } }),
        EmergencyEntry.aggregate([
          { $match: { user: user._id, data: { $gte: start, $lte: end } } },
          { $group: { _id: null, total: { $sum: '$valor' } } }
        ]),
        ViagemEntry.aggregate([
          { $match: { user: user._id, data: { $gte: start, $lte: end } } },
          { $group: { _id: null, total: { $sum: '$valor' } } }
        ]),
        CarroEntry.aggregate([
          { $match: { user: user._id, data: { $gte: start, $lte: end } } },
          { $group: { _id: null, total: { $sum: '$valor' } } }
        ]),
        MesadaEntry.aggregate([
          { $match: { user: user._id, data: { $gte: start, $lte: end } } },
          { $group: { _id: null, total: { $sum: '$valor' } } }
        ])
      ]);

      const invEntriesTotalBRL = invEntries.reduce((sum, e: any) => sum + toBRL(e.value, e.moeda), 0);
      const entriesTotal = invEntriesTotalBRL + (emeSum[0]?.total || 0) + (viaSum[0]?.total || 0) + (carSum[0]?.total || 0) + (mesSum[0]?.total || 0);

      // Total de ativos (snapshot até o final do período)
      const investments = await Investment.find({ user: user._id, data: { $lte: end } });
      const assetsTotalBRL = investments.reduce((sum, inv) => sum + toBRL(inv.valor, inv.moeda), 0);
      const assetsTotalEUR = investments.reduce((sum, inv) => sum + toEUR(inv.valor, inv.moeda), 0);

      reportData.push({
        name: user.name,
        email: user.email,
        salary,
        expenses: expensesTotal,
        entriesTotal,
        assetsTotalBRL,
        assetsTotalEUR,
        balance: salary - (expensesTotal + entriesTotal),
      });
    }

    // Gerar PDF
    const startStr = start.toLocaleDateString('pt-BR');
    const endStr = end.toLocaleDateString('pt-BR');
    const pdfBuffer = await generateMonthlyReportPDF(reportData, `${startStr} a ${endStr}`, new Date().getFullYear());

    // Retornar PDF como download
    const fileName = `relatorio-periodo-${startDate}-${endDate}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(pdfBuffer);

  } catch (err) {
    console.error('Erro ao gerar relatório customizado:', err);
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
}

// Relatório mensal (download direto)
export async function generateMonthlyReportDownload(req: Request, res: Response): Promise<void> {
  try {
    const now = new Date();
    const qMonth = req.query.month ? Number(req.query.month) : undefined;
    const qYear = req.query.year ? Number(req.query.year) : undefined;
    
    let targetYear: number;
    let targetMonthNum: number;
    
    if (qMonth && qYear) {
      targetYear = qYear;
      targetMonthNum = qMonth;
    } else {
      const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      targetYear = prev.getFullYear();
      targetMonthNum = prev.getMonth() + 1;
    }

    const firstDay = new Date(targetYear, targetMonthNum - 1, 1);
    const lastDay = new Date(targetYear, targetMonthNum, 0, 23, 59, 59, 999);

    const users = await User.find();
    const reportData: MonthlyReportUser[] = [];

    const EUR_TO_BRL = 1 / 0.18;
    const toBRL = (valor: number, moeda?: string): number => {
      if (!valor || !Number.isFinite(valor as number)) return 0;
      switch (moeda) {
        case 'Real': return valor;
        case 'Euro': return valor * EUR_TO_BRL;
        case 'Dolar': return valor * (0.90 * EUR_TO_BRL);
        default: return valor;
      }
    };
    const toEUR = (valor: number, moeda?: string): number => {
      if (!valor || !Number.isFinite(valor as number)) return 0;
      switch (moeda) {
        case 'Euro': return valor;
        case 'Real': return valor * 0.18;
        case 'Dolar': return valor * 0.90;
        default: return valor;
      }
    };

    for (const user of users) {
      const salaryDoc = await Salary.findOne({
        user: user._id,
        date: { $gte: firstDay, $lte: lastDay }
      });
      const salary = salaryDoc ? salaryDoc.value : 0;

      const expensesArr = await Expense.find({
        user: user._id,
        date: { $gte: firstDay, $lte: lastDay }
      });
      const expenses = expensesArr.reduce((sum, exp) => sum + exp.value, 0);

      const [invEntries, emeSum, viaSum, carSum, mesSum] = await Promise.all([
        InvestmentEntry.find({ user: user._id, date: { $gte: firstDay, $lte: lastDay } }),
        EmergencyEntry.aggregate([
          { $match: { user: user._id, data: { $gte: firstDay, $lte: lastDay } } },
          { $group: { _id: null, total: { $sum: '$valor' } } }
        ]),
        ViagemEntry.aggregate([
          { $match: { user: user._id, data: { $gte: firstDay, $lte: lastDay } } },
          { $group: { _id: null, total: { $sum: '$valor' } } }
        ]),
        CarroEntry.aggregate([
          { $match: { user: user._id, data: { $gte: firstDay, $lte: lastDay } } },
          { $group: { _id: null, total: { $sum: '$valor' } } }
        ]),
        MesadaEntry.aggregate([
          { $match: { user: user._id, data: { $gte: firstDay, $lte: lastDay } } },
          { $group: { _id: null, total: { $sum: '$valor' } } }
        ])
      ]);

      const invEntriesTotalBRL = invEntries.reduce((sum, e: any) => sum + toBRL(e.value, e.moeda), 0);
      const entriesTotal = invEntriesTotalBRL + (emeSum[0]?.total || 0) + (viaSum[0]?.total || 0) + (carSum[0]?.total || 0) + (mesSum[0]?.total || 0);

      const investments = await Investment.find({ user: user._id, data: { $lte: lastDay } });
      const assetsTotalBRL = investments.reduce((sum, inv) => sum + toBRL(inv.valor, inv.moeda), 0);
      const assetsTotalEUR = investments.reduce((sum, inv) => sum + toEUR(inv.valor, inv.moeda), 0);

      reportData.push({
        name: user.name,
        email: user.email,
        salary,
        expenses,
        entriesTotal,
        assetsTotalBRL,
        assetsTotalEUR,
        balance: salary - (expenses + entriesTotal),
      });
    }

    const monthStr = String(targetMonthNum).padStart(2, '0');
    const pdfBuffer = await generateMonthlyReportPDF(reportData, monthStr, targetYear);

    const fileName = `relatorio-mensal-${monthStr}-${targetYear}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(pdfBuffer);

  } catch (err) {
    console.error('Erro ao gerar relatório mensal:', err);
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
}

// Relatório anual (download direto)
export async function generateAnnualReportDownload(req: Request, res: Response): Promise<void> {
  try {
    const now = new Date();
    const targetYear = req.query.year ? Number(req.query.year) : now.getFullYear();

    const start = new Date(targetYear, 0, 1, 0, 0, 0, 0);
    const end = new Date(targetYear, 11, 31, 23, 59, 59, 999);

    // Aggregações anuais
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

    const expenseCategoriesAgg = await Expense.aggregate([
      { $match: { date: { $gte: start, $lte: end } } },
      { $group: { _id: '$category', total: { $sum: '$value' } } },
      { $sort: { total: -1 } }
    ]);
    const expenseCategories: AnnualCategoryTotal[] = expenseCategoriesAgg.map((c) => ({ label: c._id, total: c.total }));

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

    const pdfBuffer = await generateAnnualReportPDF(data);

    const fileName = `relatorio-anual-${targetYear}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(pdfBuffer);

  } catch (error) {
    console.error('Erro ao gerar relatório anual:', error);
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : String(error) });
  }
}