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
