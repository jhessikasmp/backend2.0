import MesadaEntry from '../models/MesadaEntry';
import { Request, Response } from 'express';

export const addMesadaEntry = async (req: Request, res: Response) => {
  try {
    const { nome, descricao, valor, data, user } = req.body;
    const entry = await MesadaEntry.create({ nome, descricao, valor, data, user });
    res.json({ success: true, data: entry });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erro ao adicionar entrada', error: err });
  }
};

export const getMesadaEntries = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const entries = await MesadaEntry.find({ user: userId }).sort({ data: -1 });
    res.json({ success: true, data: entries });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erro ao buscar entradas', error: err });
  }
};

export const getMesadaEntriesYear = async (req: Request, res: Response) => {
  try {
    const { userId, year } = req.params;
    const start = new Date(Number(year), 0, 1);
    const end = new Date(Number(year) + 1, 0, 1);
    const entries = await MesadaEntry.find({ user: userId, data: { $gte: start, $lt: end } });
    res.json({ success: true, data: entries });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erro ao buscar entradas do ano', error: err });
  }
};
