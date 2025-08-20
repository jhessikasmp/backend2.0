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

// Lista todas as despesas de todos os usuários
export const getAllExpenses = async (req: Request, res: Response) => {
  try {
    const expenses = await Expense.find({}).populate('user', 'name email').sort({ date: -1 });
    return res.json({ success: true, data: expenses });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Erro ao buscar despesas de todos os usuários', error });
  }
};
import { Request, Response } from 'express';
import Expense from '../models/Expense';
import Salary from '../models/Salary';

// Adiciona uma nova despesa
export const addExpense = async (req: Request, res: Response) => {
  try {
    const { user, name, value, category, description, date } = req.body;
    if (!user || !name || typeof value !== 'number' || !category || !date) {
      console.log('addExpense - Dados obrigatórios faltando:', { user, name, value, category, date });
      return res.status(400).json({ success: false, message: 'Dados obrigatórios faltando' });
    }
    const expense = await Expense.create({ user, name, value, category, description, date });

    // Subtrair valor da despesa do salário do mês do usuário
    const expenseDate = new Date(date);
    const firstDay = new Date(expenseDate.getFullYear(), expenseDate.getMonth(), 1);
    const lastDay = new Date(expenseDate.getFullYear(), expenseDate.getMonth() + 1, 0, 23, 59, 59, 999);
    const salaryDoc = await Salary.findOne({
      user: user,
      date: { $gte: firstDay, $lte: lastDay }
    });

    if (salaryDoc) {
      salaryDoc.value -= value;
      await salaryDoc.save();
    } else {
      // Cria salário negativo para o mês
      await Salary.create({
        user: user,
        value: -value,
        date: expenseDate
      });
    }

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
