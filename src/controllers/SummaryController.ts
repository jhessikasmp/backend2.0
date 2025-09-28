import { Request, Response } from 'express';
import Salary from '../models/Salary';
import Expense from '../models/Expense';
import InvestmentEntry from '../models/InvestmentEntry';
import EmergencyEntry from '../models/EmergencyEntry';
import ViagemEntry from '../models/ViagemEntry';
import CarroEntry from '../models/CarroEntry';
import MesadaEntry from '../models/MesadaEntry';

// GET /api/summary/current-month
// Retorna um resumo consolidado do mês atual sem alterar nenhum documento no banco:
// - total de salários do mês (todos os usuários)
// - total de despesas do mês (todos os usuários)
// - total de outras saídas (entradas) do mês (investment/emergency/viagem/carro/mesada)
// - saldo considerando apenas despesas
// - saldo considerando despesas + outras saídas
async function computeSummary(firstDay: Date, lastDay: Date) {
  const [salariesAgg, expensesAgg, investmentAgg, emergencyAgg, viagemAgg, carroAgg, mesadaAgg] = await Promise.all([
    Salary.aggregate([
      { $match: { date: { $gte: firstDay, $lte: lastDay } } },
      { $group: { _id: null, total: { $sum: '$value' } } }
    ]),
    Expense.aggregate([
      { $match: { date: { $gte: firstDay, $lte: lastDay } } },
      { $group: { _id: null, total: { $sum: '$value' } } }
    ]),
    InvestmentEntry.aggregate([
      { $match: { date: { $gte: firstDay, $lte: lastDay } } },
      { $group: { _id: null, total: { $sum: '$value' } } }
    ]),
    EmergencyEntry.aggregate([
      { $match: { data: { $gte: firstDay, $lte: lastDay } } },
      { $group: { _id: null, total: { $sum: '$valor' } } }
    ]),
    ViagemEntry.aggregate([
      { $match: { data: { $gte: firstDay, $lte: lastDay } } },
      { $group: { _id: null, total: { $sum: '$valor' } } }
    ]),
    CarroEntry.aggregate([
      { $match: { data: { $gte: firstDay, $lte: lastDay } } },
      { $group: { _id: null, total: { $sum: '$valor' } } }
    ]),
    MesadaEntry.aggregate([
      { $match: { data: { $gte: firstDay, $lte: lastDay } } },
      { $group: { _id: null, total: { $sum: '$valor' } } }
    ])
  ]);

  const salariesTotal = salariesAgg[0]?.total || 0;
  const expensesTotal = expensesAgg[0]?.total || 0;
  const entriesTotal =
    (investmentAgg[0]?.total || 0) +
    (emergencyAgg[0]?.total || 0) +
    (viagemAgg[0]?.total || 0) +
    (carroAgg[0]?.total || 0) +
    (mesadaAgg[0]?.total || 0);

  const balanceOnlyExpenses = salariesTotal - expensesTotal;
  const balanceWithEntries = salariesTotal - (expensesTotal + entriesTotal);

  return { salariesTotal, expensesTotal, entriesTotal, balanceOnlyExpenses, balanceWithEntries };
}

export const getCurrentMonthSummary = async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    const summary = await computeSummary(firstDay, lastDay);
    return res.json({ success: true, data: { ...summary, period: { from: firstDay, to: lastDay } } });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Erro ao gerar resumo do mês atual', error });
  }
};

// GET /api/summary/by-month?month=MM&year=YYYY
export const getSummaryByMonth = async (req: Request, res: Response) => {
  try {
    const month = Number(req.query.month); // 1-12
    const year = Number(req.query.year);
    if (!month || !year || month < 1 || month > 12) {
      return res.status(400).json({ success: false, message: 'Parâmetros inválidos: use month=1..12 e year=YYYY' });
    }
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0, 23, 59, 59, 999);
    const summary = await computeSummary(firstDay, lastDay);
    return res.json({ success: true, data: { ...summary, period: { from: firstDay, to: lastDay } } });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Erro ao gerar resumo por mês', error });
  }
};

// GET /api/summary/year/:year — retorna array de 12 meses com os totais
export const getYearlyMonthlySummary = async (req: Request, res: Response) => {
  try {
    const year = Number(req.params.year);
    if (!year) {
      return res.status(400).json({ success: false, message: 'Ano inválido' });
    }
    const results: Array<{ month: number; salariesTotal: number; expensesTotal: number; entriesTotal: number; balanceOnlyExpenses: number; balanceWithEntries: number; }>
      = [];
    for (let m = 1; m <= 12; m++) {
      const firstDay = new Date(year, m - 1, 1);
      const lastDay = new Date(year, m, 0, 23, 59, 59, 999);
      const s = await computeSummary(firstDay, lastDay);
      results.push({ month: m, ...s });
    }
    return res.json({ success: true, data: { year, months: results } });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Erro ao gerar resumo anual por mês', error });
  }
};

export default { getCurrentMonthSummary, getSummaryByMonth, getYearlyMonthlySummary };

// GET /api/summary/year/:year/by-user — consolida salários, despesas e outras saídas por usuário no ano
export const getYearlySummaryByUser = async (req: Request, res: Response) => {
  try {
    const year = Number(req.params.year);
    if (!year) {
      return res.status(400).json({ success: false, message: 'Ano inválido' });
    }
    const firstDay = new Date(year, 0, 1);
    const lastDay = new Date(year + 1, 0, 1);

    const [salariesAgg, expensesAgg, invAgg, emgAgg, viaAgg, carAgg, mesAgg] = await Promise.all([
      Salary.aggregate([
        { $match: { date: { $gte: firstDay, $lt: lastDay } } },
        { $group: { _id: '$user', total: { $sum: '$value' } } },
      ]),
      Expense.aggregate([
        { $match: { date: { $gte: firstDay, $lt: lastDay } } },
        { $group: { _id: '$user', total: { $sum: '$value' } } },
      ]),
      InvestmentEntry.aggregate([
        { $match: { date: { $gte: firstDay, $lt: lastDay } } },
        { $group: { _id: '$user', total: { $sum: '$value' } } },
      ]),
      EmergencyEntry.aggregate([
        { $match: { data: { $gte: firstDay, $lt: lastDay } } },
        { $group: { _id: '$user', total: { $sum: '$valor' } } },
      ]),
      ViagemEntry.aggregate([
        { $match: { data: { $gte: firstDay, $lt: lastDay } } },
        { $group: { _id: '$user', total: { $sum: '$valor' } } },
      ]),
      CarroEntry.aggregate([
        { $match: { data: { $gte: firstDay, $lt: lastDay } } },
        { $group: { _id: '$user', total: { $sum: '$valor' } } },
      ]),
      MesadaEntry.aggregate([
        { $match: { data: { $gte: firstDay, $lt: lastDay } } },
        { $group: { _id: '$user', total: { $sum: '$valor' } } },
      ]),
    ]);

    const salaryMap = new Map<string, number>(salariesAgg.map(s => [String(s._id), s.total || 0]));
    const expenseMap = new Map<string, number>(expensesAgg.map(e => [String(e._id), e.total || 0]));

    const entriesMap = new Map<string, number>();
    for (const arr of [invAgg, emgAgg, viaAgg, carAgg, mesAgg]) {
      for (const r of arr) {
        const id = String(r._id);
        entriesMap.set(id, (entriesMap.get(id) || 0) + (r.total || 0));
      }
    }

    // Consolida todos os usuários existentes em qualquer um dos mapas
    const userIds = new Set<string>([
      ...Array.from(salaryMap.keys()),
      ...Array.from(expenseMap.keys()),
      ...Array.from(entriesMap.keys()),
    ]);

    const data = Array.from(userIds).map(userId => {
      const salariesTotal = salaryMap.get(userId) || 0;
      const expensesTotal = expenseMap.get(userId) || 0;
      const entriesTotal = entriesMap.get(userId) || 0;
      return {
        _id: userId,
        salariesTotal,
        expensesTotal,
        entriesTotal,
        balanceOnlyExpenses: salariesTotal - expensesTotal,
        balanceWithEntries: salariesTotal - (expensesTotal + entriesTotal),
      };
    });

    return res.json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Erro ao gerar resumo anual por usuário', error });
  }
};
