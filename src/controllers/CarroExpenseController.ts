import CarroExpense from '../models/CarroExpense';
import { Request, Response } from 'express';
import mongoose from 'mongoose';

export const addCarroExpense = async (req: Request, res: Response) => {
  try {
    const { nome, descricao, valor, data, user } = req.body;
    const expense = await CarroExpense.create({ nome, descricao, valor, data, user });
    res.json({ success: true, data: expense });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erro ao adicionar despesa', error: err });
  }
};

export const getCarroExpenses = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const expenses = await CarroExpense.find({ user: userId }).sort({ data: -1 });
    res.json({ success: true, data: expenses });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erro ao buscar despesas', error: err });
  }
};

export const getCarroExpensesTotal = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const expenses = await CarroExpense.find({ user: userId });
    const total = expenses.reduce((sum, exp) => sum + (exp.valor || 0), 0);
    res.json({ success: true, total });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erro ao calcular total de despesas', error: err });
  }
};

export const getCarroExpensesGrouped = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const grouped = await CarroExpense.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: {
            year: { $year: "$data" },
            month: { $month: "$data" }
          },
          expenses: { $push: "$$ROOT" },
          total: { $sum: "$valor" }
        }
      },
      { $sort: { "_id.year": -1, "_id.month": -1 } }
    ]);
    res.json({ success: true, data: grouped });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erro ao agrupar despesas', error: err });
  }
};
