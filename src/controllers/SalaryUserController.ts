// Busca todos os salários do usuário em um ano
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

// Adiciona ou atualiza salário do mês para o usuário
export const upsertSalary = async (req: Request, res: Response) => {
  try {
    const { user, value, date } = req.body;
    if (!user || typeof value !== 'number' || !date) {
      res.status(400).json({ success: false, message: 'Dados inválidos' });
      return;
    }
    const salaryDate = new Date(date);
    const firstDay = new Date(salaryDate.getFullYear(), salaryDate.getMonth(), 1);
    const lastDay = new Date(salaryDate.getFullYear(), salaryDate.getMonth() + 1, 0, 23, 59, 59, 999);

    // Atualiza se já existe salário para o mês, senão cria
    const salary = await Salary.findOneAndUpdate(
      {
        user,
        date: { $gte: firstDay, $lte: lastDay }
      },
      {
        user,
        value,
        date: salaryDate
      },
      { upsert: true, new: true }
    );
    return res.json({ success: true, data: salary });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Erro ao salvar salário', error });
  }
};

// Busca salário do mês atual do usuário
export const getUserCurrentMonthSalary = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    const salary = await Salary.findOne({
      user: userId,
      date: { $gte: firstDay, $lte: lastDay }
    });
    res.json({ success: true, data: salary });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao buscar salário', error });
  }
};
