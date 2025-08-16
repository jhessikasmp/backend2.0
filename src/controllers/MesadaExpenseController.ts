import MesadaExpense from '../models/MesadaExpense';
import { Request, Response } from 'express';
import mongoose from 'mongoose';

export const addMesadaExpense = async (req: Request, res: Response) => {
  try {
    const { nome, descricao, valor, data, user } = req.body;
    const expense = await MesadaExpense.create({ nome, descricao, valor, data, user });
    res.json({ success: true, data: expense });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erro ao adicionar despesa', error: err });
  }
};

export const getMesadaExpenses = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const expenses = await MesadaExpense.find({ user: userId }).sort({ data: -1 });
    res.json({ success: true, data: expenses });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erro ao buscar despesas', error: err });
  }
};

export const getMesadaExpensesTotal = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const expenses = await MesadaExpense.find({ user: userId });
    const total = expenses.reduce((sum, exp) => sum + (exp.valor || 0), 0);
    res.json({ success: true, total });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erro ao calcular total de despesas', error: err });
  }
};

export const getMesadaExpensesGrouped = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const grouped = await MesadaExpense.aggregate([
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
