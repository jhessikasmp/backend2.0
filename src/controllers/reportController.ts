import { Request, Response } from 'express';
import { generateMonthlyReportPDF, MonthlyReportUser, generateAnnualReportPDF, AnnualReportData, AnnualCategoryTotal, CategoryTotal } from '../services/pdfReportService';
import User from '../models/User';
import Salary from '../models/Salary';
import Expense from '../models/Expense';
import InvestmentEntry from '../models/InvestmentEntry';
import Investment from '../models/Investment';
import EmergencyEntry from '../models/EmergencyEntry';
import ViagemEntry from '../models/ViagemEntry';
import CarroEntry from '../models/CarroEntry';
// Mesada removida do relatório
import EmergencyExpense from '../models/EmergencyExpense';
import ViagemExpense from '../models/ViagemExpense';
import CarroExpense from '../models/CarroExpense';
// Mesada removida do relatório

// Relatório customizado com período específico
export async function generateCustomPeriodReport(req: Request, res: Response): Promise<void> {
  try {
    // Aceita tanto via query (GET) quanto via body (POST)
    const startDateRaw = (req.query.startDate as string) || (req.body?.startDate as string);
    const endDateRaw = (req.query.endDate as string) || (req.body?.endDate as string);

    if (!startDateRaw || !endDateRaw) {
      res.status(400).json({ 
        success: false, 
        error: 'Parâmetros startDate e endDate são obrigatórios (formato: YYYY-MM-DD)' 
      });
      return;
    }

    const start = new Date(startDateRaw);
    const end = new Date(endDateRaw);
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
      console.log(`Gerando dados para usuário: ${user._id} - ${user.name} (${startDateRaw} a ${endDateRaw})`);

      // Salários no período
      const salaries = await Salary.find({
        user: user._id,
        date: { $gte: start, $lte: end }
      });
      const salary = salaries.reduce((sum, s) => sum + s.value, 0);

      // Despesas por categoria no período (Expense)
      const expensesAgg = await Expense.aggregate([
        { $match: { user: user._id, date: { $gte: start, $lte: end } } },
        { $group: { _id: '$category', total: { $sum: '$value' } } },
        { $sort: { total: -1 } }
      ]);
      let expensesByCategory: CategoryTotal[] = expensesAgg.map((c: any) => ({ label: c._id, total: c.total }));

      // Entradas de fundos no período DEVEM aparecer como despesas no PDF
      const [invInPeriodAgg, emeInPeriodAgg, viaInPeriodAgg, carInPeriodAgg] = await Promise.all([
        InvestmentEntry.aggregate([
          { $match: { user: user._id, date: { $gte: start, $lte: end } } },
          { $group: { _id: null, total: { $sum: '$value' } } }
        ]),
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
        ])
      ]);

      const fundEntriesAsExpenses: CategoryTotal[] = [
        { label: 'Entrada Investimento', total: invInPeriodAgg[0]?.total || 0 },
        { label: 'Entrada Emergência', total: emeInPeriodAgg[0]?.total || 0 },
        { label: 'Entrada Viagem', total: viaInPeriodAgg[0]?.total || 0 },
        { label: 'Entrada Carro', total: carInPeriodAgg[0]?.total || 0 },
      ].filter((c) => c.total > 0);

      expensesByCategory = [...expensesByCategory, ...fundEntriesAsExpenses];
      const expensesTotal = expensesByCategory.reduce((a, b) => a + b.total, 0);

      // Saldos dos fundos (globais - vida toda)
      const [emeInAgg, emeOutAgg, viaInAgg, viaOutAgg, carInAgg, carOutAgg] = await Promise.all([
        EmergencyEntry.aggregate([
          { $match: { user: user._id } },
          { $group: { _id: null, total: { $sum: '$valor' } } }
        ]),
        EmergencyExpense.aggregate([
          { $match: { user: user._id } },
          { $group: { _id: null, total: { $sum: '$valor' } } }
        ]),
        ViagemEntry.aggregate([
          { $match: { user: user._id } },
          { $group: { _id: null, total: { $sum: '$valor' } } }
        ]),
        ViagemExpense.aggregate([
          { $match: { user: user._id } },
          { $group: { _id: null, total: { $sum: '$valor' } } }
        ]),
        CarroEntry.aggregate([
          { $match: { user: user._id } },
          { $group: { _id: null, total: { $sum: '$valor' } } }
        ]),
        CarroExpense.aggregate([
          { $match: { user: user._id } },
          { $group: { _id: null, total: { $sum: '$valor' } } }
        ])
      ]);
      const fundBalances = {
        emergencyBRL: (emeInAgg[0]?.total || 0) - (emeOutAgg[0]?.total || 0),
        viagemBRL: (viaInAgg[0]?.total || 0) - (viaOutAgg[0]?.total || 0),
        carroBRL: (carInAgg[0]?.total || 0) - (carOutAgg[0]?.total || 0),
      };

      // Total de ativos (snapshot até o final do período)
      const investments = await Investment.find({ user: user._id, data: { $lte: end } });
      const assetsTotalBRL = investments.reduce((sum, inv) => sum + toBRL(inv.valor, inv.moeda), 0);
      const assetsTotalEUR = investments.reduce((sum, inv) => sum + toEUR(inv.valor, inv.moeda), 0);

      reportData.push({
        name: user.name,
        email: user.email,
        salary,
        expensesTotal,
        expensesByCategory,
        fundBalances,
        assetsTotalBRL,
        assetsTotalEUR,
        balance: salary - expensesTotal,
      });
    }

    // Gerar PDF
    const startStr = start.toLocaleDateString('pt-BR');
    const endStr = end.toLocaleDateString('pt-BR');
    const pdfBuffer = await generateMonthlyReportPDF(reportData, `${startStr} a ${endStr}`, new Date().getFullYear());

    // Retornar PDF como download
  const fileName = `relatorio-periodo-${startDateRaw}-${endDateRaw}.pdf`;
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
      // Salário do mês (assume 1 por mês; se houver múltiplos, some)
      const salariesMonth = await Salary.find({
        user: user._id,
        date: { $gte: firstDay, $lte: lastDay }
      });
      const salary = salariesMonth.reduce((sum, s) => sum + s.value, 0);

      // Despesas por categoria do mês (Expense)
      const expensesAgg = await Expense.aggregate([
        { $match: { user: user._id, date: { $gte: firstDay, $lte: lastDay } } },
        { $group: { _id: '$category', total: { $sum: '$value' } } },
        { $sort: { total: -1 } }
      ]);
      let expensesByCategory: CategoryTotal[] = expensesAgg.map((c: any) => ({ label: c._id, total: c.total }));

      // Entradas de fundos do mês DEVEM aparecer como despesas no PDF
      const [invInMonthAgg, emeInMonthAgg, viaInMonthAgg, carInMonthAgg] = await Promise.all([
        InvestmentEntry.aggregate([
          { $match: { user: user._id, date: { $gte: firstDay, $lte: lastDay } } },
          { $group: { _id: null, total: { $sum: '$value' } } }
        ]),
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
        ])
      ]);

      const fundEntriesAsExpensesMonth: CategoryTotal[] = [
        { label: 'Entrada Investimento', total: invInMonthAgg[0]?.total || 0 },
        { label: 'Entrada Emergência', total: emeInMonthAgg[0]?.total || 0 },
        { label: 'Entrada Viagem', total: viaInMonthAgg[0]?.total || 0 },
        { label: 'Entrada Carro', total: carInMonthAgg[0]?.total || 0 },
      ].filter((c) => c.total > 0);

      expensesByCategory = [...expensesByCategory, ...fundEntriesAsExpensesMonth];
      const expensesTotal = expensesByCategory.reduce((a, b) => a + b.total, 0);

      // Fundos - Saldo global (vida toda): entradas acumuladas - despesas acumuladas
      const [emeInAgg, emeOutAgg, viaInAgg, viaOutAgg, carInAgg, carOutAgg] = await Promise.all([
        EmergencyEntry.aggregate([
          { $match: { user: user._id } },
          { $group: { _id: null, total: { $sum: '$valor' } } }
        ]),
        EmergencyExpense.aggregate([
          { $match: { user: user._id } },
          { $group: { _id: null, total: { $sum: '$valor' } } }
        ]),
        ViagemEntry.aggregate([
          { $match: { user: user._id } },
          { $group: { _id: null, total: { $sum: '$valor' } } }
        ]),
        ViagemExpense.aggregate([
          { $match: { user: user._id } },
          { $group: { _id: null, total: { $sum: '$valor' } } }
        ]),
        CarroEntry.aggregate([
          { $match: { user: user._id } },
          { $group: { _id: null, total: { $sum: '$valor' } } }
        ]),
        CarroExpense.aggregate([
          { $match: { user: user._id } },
          { $group: { _id: null, total: { $sum: '$valor' } } }
        ])
      ]);
      const fundBalances = {
        emergencyBRL: (emeInAgg[0]?.total || 0) - (emeOutAgg[0]?.total || 0),
        viagemBRL: (viaInAgg[0]?.total || 0) - (viaOutAgg[0]?.total || 0),
        carroBRL: (carInAgg[0]?.total || 0) - (carOutAgg[0]?.total || 0),
      };

      // Investimentos: montante de ativos em BRL e EUR (snapshot até o fim do mês)
      const investments = await Investment.find({ user: user._id, data: { $lte: lastDay } });
      const assetsTotalBRL = investments.reduce((sum, inv) => sum + toBRL(inv.valor, inv.moeda), 0);
      const assetsTotalEUR = investments.reduce((sum, inv) => sum + toEUR(inv.valor, inv.moeda), 0);

      reportData.push({
        name: user.name,
        email: user.email,
        salary,
        expensesTotal,
        expensesByCategory,
        fundBalances,
        assetsTotalBRL,
        assetsTotalEUR,
        balance: salary - expensesTotal,
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
    const [salariesAgg, salariesByUserAgg, users] = await Promise.all([
      Salary.aggregate([
        { $match: { date: { $gte: start, $lte: end } } },
        { $group: { _id: null, total: { $sum: '$value' } } }
      ]),
      Salary.aggregate([
        { $match: { date: { $gte: start, $lte: end } } },
        { $group: { _id: '$user', total: { $sum: '$value' } } }
      ]),
      User.find({}, { _id: 1, name: 1 })
    ]);
    const salariesTotalBRL = salariesAgg[0]?.total || 0;
    const userNameById = new Map<string, string>(users.map((u: any) => [String(u._id), u.name]));
    const salariesByUser = salariesByUserAgg.map((row: any) => ({
      name: userNameById.get(String(row._id)) || String(row._id),
      totalBRL: row.total || 0
    }));

    const expensesAgg = await Expense.aggregate([
      { $match: { date: { $gte: start, $lte: end } } },
      { $group: { _id: null, total: { $sum: '$value' } } }
    ]);
    let expensesTotalBRL = expensesAgg[0]?.total || 0;

    const [invEntriesAgg, emeEntriesAgg, viaEntriesAgg, carEntriesAgg] = await Promise.all([
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
      ])
    ]);

    const fundEntries = {
      investmentBRL: invEntriesAgg[0]?.total || 0,
      emergencyBRL: emeEntriesAgg[0]?.total || 0,
      viagemBRL: viaEntriesAgg[0]?.total || 0,
      carroBRL: carEntriesAgg[0]?.total || 0,
    };
    const fundEntriesTotal = Object.values(fundEntries).reduce((a, b) => a + (b as number), 0);

    const [emeExpAgg, viaExpAgg, carExpAgg] = await Promise.all([
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
      ])
    ]);

    const fundExpenses = {
      emergencyBRL: emeExpAgg[0]?.total || 0,
      viagemBRL: viaExpAgg[0]?.total || 0,
      carroBRL: carExpAgg[0]?.total || 0,
    };
    const fundExpensesTotal = Object.values(fundExpenses).reduce((a, b) => a + (b as number), 0);

    const expenseCategoriesAgg = await Expense.aggregate([
      { $match: { date: { $gte: start, $lte: end } } },
      { $group: { _id: '$category', total: { $sum: '$value' } } },
      { $sort: { total: -1 } }
    ]);
    let expenseCategories: AnnualCategoryTotal[] = expenseCategoriesAgg.map((c) => ({ label: c._id, total: c.total }));

    // Entradas de fundos no ano DEVEM aparecer como despesas no PDF (categorias extras)
    const entriesAsExpenses: AnnualCategoryTotal[] = [
      { label: 'Entrada Investimento', total: invEntriesAgg[0]?.total || 0 },
      { label: 'Entrada Emergência', total: emeEntriesAgg[0]?.total || 0 },
      { label: 'Entrada Viagem', total: viaEntriesAgg[0]?.total || 0 },
      { label: 'Entrada Carro', total: carEntriesAgg[0]?.total || 0 },
    ].filter((c) => c.total > 0);

    if (entriesAsExpenses.length > 0) {
      expenseCategories = [...expenseCategories, ...entriesAsExpenses];
      expensesTotalBRL += entriesAsExpenses.reduce((a, b) => a + b.total, 0);
    }

    const comparison: AnnualCategoryTotal[] = [
      ...expenseCategories,
      { label: 'Fundo: Emergência (despesas)', total: fundExpenses.emergencyBRL },
      { label: 'Fundo: Viagem (despesas)', total: fundExpenses.viagemBRL },
      { label: 'Fundo: Carro (despesas)', total: fundExpenses.carroBRL },
    ].sort((a, b) => b.total - a.total);
    
    const biggestSpending = comparison[0];

    const data: AnnualReportData = {
      year: targetYear,
      salariesTotalBRL,
      expensesTotalBRL,
      salariesByUser,
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