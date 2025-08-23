// Modificação forçada para commit: ajuste de comentário
import CarroEntry from '../models/CarroEntry';
import { Request, Response } from 'express';
// Retorna o total de entradas de carro de um usuário
export const getCarroEntriesTotal = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const entries = await CarroEntry.find({ user: userId });
    const total = entries.reduce((sum, e) => sum + (e.valor || 0), 0);
    console.log('Entradas de carro encontradas:', entries);
    console.log('Total calculado:', total);
    res.json({ success: true, total });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erro ao buscar total de entradas de carro', error: err });
  }
};

export const addCarroEntry = async (req: Request, res: Response) => {
  try {
    const { nome, descricao, valor, data, user } = req.body;
    const entry = await CarroEntry.create({ nome, descricao, valor, data, user });
    res.json({ success: true, data: entry });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erro ao adicionar entrada', error: err });
  }
};

export const getCarroEntries = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const entries = await CarroEntry.find({ user: userId }).sort({ data: -1 });
    res.json({ success: true, data: entries });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erro ao buscar entradas', error: err });
  }
};

export const getCarroEntriesYear = async (req: Request, res: Response) => {
  try {
    const { userId, year } = req.params;
    const start = new Date(Number(year), 0, 1);
    const end = new Date(Number(year) + 1, 0, 1);
    const entries = await CarroEntry.find({ user: userId, data: { $gte: start, $lt: end } });
    res.json({ success: true, data: entries });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erro ao buscar entradas do ano', error: err });
  }
}// alguma coisa
