import { Request, Response } from 'express';
import Expense from '../models/Expense';
import Salary from '../models/Salary';
// ...existing code...

// Soma anual de despesas + entradas de todas as coleções por usuário
export const getAnnualTotalWithEntriesByUser = async (req: Request, res: Response) => {
  try {
    const { year } = req.params;
    if (!year) return res.status(400).json({ success: false, message: 'Ano é obrigatório' });
    const firstDay = new Date(Number(year), 0, 1);
    const lastDay = new Date(Number(year) + 1, 0, 1);

    // Expenses
    const expenses = await Expense.aggregate([
      { $match: { date: { $gte: firstDay, $lt: lastDay } } },
      { $group: { _id: "$user", total: { $sum: "$value" } } }
    ]);

    // InvestmentEntry
    const investmentEntries = await InvestmentEntry.aggregate([
      { $match: { date: { $gte: firstDay, $lt: lastDay } } },
      { $group: { _id: "$user", total: { $sum: "$value" } } }
    ]);
    // EmergencyEntry
    const emergencyEntries = await EmergencyEntry.aggregate([
      { $match: { data: { $gte: firstDay, $lt: lastDay } } },
      { $group: { _id: "$user", total: { $sum: "$valor" } } }
    ]);
    // ViagemEntry
    const viagemEntries = await ViagemEntry.aggregate([
      { $match: { data: { $gte: firstDay, $lt: lastDay } } },
      { $group: { _id: "$user", total: { $sum: "$valor" } } }
    ]);
    // CarroEntry
    const carroEntries = await CarroEntry.aggregate([
      { $match: { data: { $gte: firstDay, $lt: lastDay } } },
      { $group: { _id: "$user", total: { $sum: "$valor" } } }
    ]);
    // MesadaEntry
    const mesadaEntries = await MesadaEntry.aggregate([
      { $match: { data: { $gte: firstDay, $lt: lastDay } } },
      { $group: { _id: "$user", total: { $sum: "$valor" } } }
    ]);

    // Agrupa por usuário
    const userTotals: Record<string, number> = {};
    for (const arr of [expenses, investmentEntries, emergencyEntries, viagemEntries, carroEntries, mesadaEntries]) {
      arr.forEach(e => {
        const id = String(e._id);
        userTotals[id] = (userTotals[id] || 0) + (e.total || 0);
      });
    }
    // Formata para frontend
    const result = Object.entries(userTotals).map(([userId, total]) => ({ _id: userId, total }));
    return res.json({ success: true, data: result });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Erro ao calcular despesas anuais com entradas', error });
  }
};
// Soma despesas e entradas do mês atual
export const getCurrentMonthTotalWithEntries = async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0, 23, 59, 59, 999);

    const expenseTotal = await Expense.aggregate([
      { $match: { date: { $gte: firstDay, $lte: lastDay } } },
      { $group: { _id: null, total: { $sum: "$value" } } }
    ]);
    const investmentTotal = await require('../models/InvestmentEntry').default.aggregate([
      { $match: { date: { $gte: firstDay, $lte: lastDay } } },
      { $group: { _id: null, total: { $sum: "$value" } } }
    ]);
    const emergencyTotal = await require('../models/EmergencyEntry').default.aggregate([
      { $match: { data: { $gte: firstDay, $lte: lastDay } } },
      { $group: { _id: null, total: { $sum: "$valor" } } }
    ]);
    const viagemTotal = await require('../models/ViagemEntry').default.aggregate([
      { $match: { data: { $gte: firstDay, $lte: lastDay } } },
      { $group: { _id: null, total: { $sum: "$valor" } } }
    ]);
    const carroTotal = await require('../models/CarroEntry').default.aggregate([
      { $match: { data: { $gte: firstDay, $lte: lastDay } } },
      { $group: { _id: null, total: { $sum: "$valor" } } }
    ]);
    const mesadaTotal = await require('../models/MesadaEntry').default.aggregate([
      { $match: { data: { $gte: firstDay, $lte: lastDay } } },
      { $group: { _id: null, total: { $sum: "$valor" } } }
    ]);
    const total =
      (expenseTotal[0]?.total || 0) +
      (investmentTotal[0]?.total || 0) +
      (emergencyTotal[0]?.total || 0) +
      (viagemTotal[0]?.total || 0) +
      (carroTotal[0]?.total || 0) +
      (mesadaTotal[0]?.total || 0);
    return res.json({ success: true, total });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Erro ao calcular despesas do mês com entradas', error });
  }
};
// Soma total de despesas considerando também as entradas de outras coleções
import InvestmentEntry from '../models/InvestmentEntry';
import EmergencyEntry from '../models/EmergencyEntry';
import ViagemEntry from '../models/ViagemEntry';
import CarroEntry from '../models/CarroEntry';
import MesadaEntry from '../models/MesadaEntry';

export const getTotalWithEntries = async (req: Request, res: Response) => {
  try {
    const expenseTotal = await Expense.aggregate([
      { $group: { _id: null, total: { $sum: "$value" } } }
    ]);
    const investmentTotal = await InvestmentEntry.aggregate([
      { $group: { _id: null, total: { $sum: "$value" } } }
    ]);
    const emergencyTotal = await EmergencyEntry.aggregate([
      { $group: { _id: null, total: { $sum: "$valor" } } }
    ]);
    const viagemTotal = await ViagemEntry.aggregate([
      { $group: { _id: null, total: { $sum: "$valor" } } }
    ]);
    const carroTotal = await CarroEntry.aggregate([
      { $group: { _id: null, total: { $sum: "$valor" } } }
    ]);
    const mesadaTotal = await MesadaEntry.aggregate([
      { $group: { _id: null, total: { $sum: "$valor" } } }
    ]);
    const total =
      (expenseTotal[0]?.total || 0) +
      (investmentTotal[0]?.total || 0) +
      (emergencyTotal[0]?.total || 0) +
      (viagemTotal[0]?.total || 0) +
      (carroTotal[0]?.total || 0) +
      (mesadaTotal[0]?.total || 0);
    return res.json({ success: true, total });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Erro ao calcular despesas totais com entradas', error });
  }
};
// Endpoint de debug para listar todas as despesas
export const debugAllExpenses = async (req: Request, res: Response) => {
  try {
    const expenses = await Expense.find({}, { user: 1, value: 1, date: 1, name: 1, category: 1 }).sort({ date: -1 });
    return res.json({ success: true, data: expenses });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Erro ao buscar despesas (debug)', error });
  }
};
// Busca todas as despesas do usuário em um ano
export const getUserAnnualExpenses = async (req: Request, res: Response) => {
  try {
    const { userId, year } = req.params;
    const firstDay = new Date(Number(year), 0, 1);
    const lastDay = new Date(Number(year) + 1, 0, 1); // Corrigido para incluir todo o ano
    const expenses = await Expense.find({
      user: userId,
      date: { $gte: firstDay, $lt: lastDay }
    });
    res.json({ success: true, data: expenses });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao buscar despesas anuais', error });
  }
};
// Retorna soma anual de despesas agrupadas por usuário
export const getAnnualExpensesByUser = async (req: Request, res: Response) => {
  try {
    const { year } = req.params;
    const firstDay = new Date(Number(year), 0, 1);
    const lastDay = new Date(Number(year) + 1, 0, 1);
    const result = await Expense.aggregate([
      {
        $match: {
          date: { $gte: firstDay, $lt: lastDay }
        }
      },
      {
        $group: {
          _id: "$user",
          total: { $sum: "$value" }
        }
      }
    ]);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao buscar despesas anuais agrupadas', error });
  }
};
// Soma total das despesas de todos os usuários agrupado por mês
export const getAllUsersMonthlyExpenses = async (req: Request, res: Response) => {
  try {
    const result = await Expense.aggregate([
      {
        $group: {
          _id: {
            year: { $year: "$date" },
            month: { $month: "$date" }
          },
          total: { $sum: "$value" }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);
    return res.json({ success: true, data: result });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Erro ao agrupar despesas mensais', error });
  }
};
// Lista todas as despesas do usuário
export const getUserAllExpenses = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const expenses = await Expense.find({ user: userId }).sort({ date: -1 });
    return res.json({ success: true, data: expenses });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Erro ao buscar despesas', error });
  }
};

// DELETE /api/expense/:id - Remove uma despesa geral pelo id
export const deleteExpense = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ success: false, message: 'ID é obrigatório' });
    const removed = await Expense.findByIdAndDelete(id);
    if (!removed) return res.status(404).json({ success: false, message: 'Despesa não encontrada' });
    return res.json({ success: true, message: 'Despesa removida', data: removed });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Erro ao remover despesa', error });
  }
};

// Lista todas as despesas de todos os usuários
export const getAllExpenses = async (req: Request, res: Response) => {
  try {
    const expenses = await Expense.find({}).populate('user', 'name email').sort({ date: -1 });
    return res.json({ success: true, data: expenses });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Erro ao buscar despesas de todos os usuários', error });
  }
};
// ...existing code...

// Adiciona uma nova despesa
export const addExpense = async (req: Request, res: Response) => {
  try {
    const { user, name, value, category, description, date } = req.body;
    if (!user || !name || typeof value !== 'number' || !category || !date) {
      console.log('addExpense - Dados obrigatórios faltando:', { user, name, value, category, date });
      return res.status(400).json({ success: false, message: 'Dados obrigatórios faltando' });
    }
    const expense = await Expense.create({ user, name, value, category, description, date });

    // ATENÇÃO: Nunca modificar documentos de Salário ao registrar despesas.
    // O saldo deve ser calculado dinamicamente: total de salários do mês - total de despesas/entradas do mês.

    console.log('addExpense - Despesa criada:', expense);
    return res.json({ success: true, data: expense });
  } catch (error) {
    console.error('addExpense - Erro ao adicionar despesa:', error);
  return res.status(500).json({ success: false, message: 'Erro ao adicionar despesa', error: typeof error === 'object' && error !== null && 'message' in error ? (error as any).message : String(error) });
  }
};

// Lista despesas do mês atual do usuário
export const getUserCurrentMonthExpenses = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    const expenses = await Expense.find({
      user: userId,
      date: { $gte: firstDay, $lte: lastDay }
    });
    return res.json({ success: true, data: expenses });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Erro ao buscar despesas', error });
  }
};

// Soma total das despesas do mês atual de todos os usuários
export const getCurrentMonthTotalExpenses = async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    const result = await Expense.aggregate([
      {
        $match: {
          date: { $gte: firstDay, $lte: lastDay }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$value' }
        }
      }
    ]);
    const total = result.length > 0 ? result[0].total : 0;
    return res.json({ success: true, total });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Erro ao somar despesas', error });
  }
};
