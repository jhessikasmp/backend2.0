// Busca todas as entradas do ano atual (global, sem userId)
export const getAllEmergencyEntriesYear = async (req: Request, res: Response) => {
  try {
    const { year } = req.params;
    const start = new Date(`${year}-01-01T00:00:00.000Z`);
    const end = new Date(`${year}-12-31T23:59:59.999Z`);
    const entries = await EmergencyEntry.find({
      data: { $gte: start, $lte: end }
    });
    res.json({ success: true, data: entries });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erro ao buscar entradas anuais globais', error: err });
  }
};
import EmergencyEntry from '../models/EmergencyEntry';
import { Request, Response } from 'express';

export const addEmergencyEntry = async (req: Request, res: Response) => {
  try {
    const { valor, data, user } = req.body;
    const entry = await EmergencyEntry.create({ valor, data, user });
    res.json({ success: true, data: entry });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erro ao adicionar entrada', error: err });
  }
};


export const getEmergencyEntries = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const entries = await EmergencyEntry.find({ user: userId }).sort({ data: -1 });
    res.json({ success: true, data: entries });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erro ao buscar entradas', error: err });
  }
};

// Busca todas as entradas do ano atual para o card "Entradas Anual"
export const getEmergencyEntriesYear = async (req: Request, res: Response) => {
  try {
    const { userId, year } = req.params;
    const start = new Date(`${year}-01-01T00:00:00.000Z`);
    const end = new Date(`${year}-12-31T23:59:59.999Z`);
    const entries = await EmergencyEntry.find({
      user: userId,
      data: { $gte: start, $lte: end }
    });
    res.json({ success: true, data: entries });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erro ao buscar entradas anuais', error: err });
  }
};
