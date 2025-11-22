// Busca todos os salários de um usuário em um ano
export const getUserAnnualSalary = async (req: Request, res: Response) => {
  try {
    const { userId, year } = req.params;
    const firstDay = new Date(Number(year), 0, 1);
    const lastDay = new Date(Number(year), 11, 31, 23, 59, 59, 999);
    const salaries = await Salary.find({
      user: userId,
      date: { $gte: firstDay, $lte: lastDay }
    });
    res.json({ success: true, data: salaries });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao buscar salários anuais', error });
  }
};
import { Request, Response } from 'express';
import Salary from '../models/Salary';
import mongoose from 'mongoose';

export const getCurrentMonthTotal = async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const result = await Salary.aggregate([
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
    res.json({ success: true, total });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao buscar salários do mês', error });
  }
};

// GET list of salary documents for current month (with populated user)
export const getCurrentMonthList = async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    const salaries = await Salary.find({ date: { $gte: firstDay, $lte: lastDay } }).populate('user', 'name email');
    res.json({ success: true, data: salaries });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao listar salários do mês', error });
  }
};

