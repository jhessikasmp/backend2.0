// Lista todas as entradas de investimento de um ano (global)
export const listInvestmentEntriesYear = async (req: Request, res: Response) => {
  try {
    const { year } = req.params;
    if (!year) {
      return res.status(400).json({ success: false, message: 'Ano é obrigatório' });
    }
    const firstDay = new Date(Number(year), 0, 1);
    const lastDay = new Date(Number(year), 11, 31, 23, 59, 59, 999);
    const entries = await InvestmentEntry.find({ date: { $gte: firstDay, $lte: lastDay } }).sort({ date: -1 });
    return res.json({ success: true, data: entries });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Erro ao listar entradas anuais', error });
  }
};
  // Soma total de todas as entradas de investimento (global, independente do ano)
  export const getTotalInvestmentEntries = async (req: Request, res: Response) => {
    try {
      const result = await InvestmentEntry.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: "$value" }
          }
        }
      ]);
      const total = result.length > 0 ? result[0].total : 0;
      return res.json({ success: true, total });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Erro ao calcular total de entradas de investimento', error });
    }
  };
import { Request, Response } from 'express';
import InvestmentEntry from '../models/InvestmentEntry';
import Salary from '../models/Salary';

// Adiciona uma nova entrada de investimento e subtrai do salário do mês
export const addInvestmentEntry = async (req: Request, res: Response) => {
  try {
    const { user, value, moeda } = req.body;
    if (!user || typeof value !== 'number' || !moeda) {
      return res.status(400).json({ success: false, message: 'Dados obrigatórios faltando' });
    }
    // Cria a entrada (date será default)
    const entry = await InvestmentEntry.create({ user, value, moeda });

    // Subtrai do salário do mês
    const entryDate = entry.date;
    const firstDay = new Date(entryDate.getFullYear(), entryDate.getMonth(), 1);
    const lastDay = new Date(entryDate.getFullYear(), entryDate.getMonth() + 1, 0, 23, 59, 59, 999);
    const salaryDoc = await Salary.findOne({
      user: user,
      date: { $gte: firstDay, $lte: lastDay }
    });
    if (salaryDoc) {
      salaryDoc.value -= value;
      await salaryDoc.save();
    } else {
      await Salary.create({ user: user, value: -value, date: entryDate });
    }

    return res.json({ success: true, data: entry });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Erro ao adicionar entrada de investimento', error });
  }
};

// Lista todas as entradas de um usuário
export const listInvestmentEntries = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ success: false, message: 'ID do usuário é obrigatório' });
    }
    const entries = await InvestmentEntry.find({ user: userId }).sort({ date: -1 });
    return res.json({ success: true, data: entries });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Erro ao listar entradas', error });
  }
};
