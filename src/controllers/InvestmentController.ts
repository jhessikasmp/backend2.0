// Listar todos os investimentos de todos os usuários
export const listAllInvestments = async (req: Request, res: Response) => {
  try {
    const investments = await Investment.find({}).populate('user', 'name email').sort({ data: -1 });
    return res.json({ success: true, data: investments });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Erro ao listar todos os investimentos', error });
  }
};
import { Request, Response } from 'express';
import Investment from '../models/Investment';
import InvestmentEntry from '../models/InvestmentEntry';

export const addInvestment = async (req: Request, res: Response) => {
  try {
    const { user, nome, tipo, valor, moeda, data } = req.body;
    if (!user || !nome || !tipo || !valor || !moeda || !data) {
      return res.status(400).json({ success: false, message: 'Dados obrigatórios faltando' });
    }
    const investment = await Investment.create({ user, nome, tipo, valor, moeda, data });
    return res.json({ success: true, data: investment });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Erro ao adicionar investimento', error });
  }
};


// Listar todos os investimentos de um usuário
export const listInvestments = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ success: false, message: 'ID do usuário é obrigatório' });
    }
    const investments = await Investment.find({ user: userId }).sort({ data: -1 });
    return res.json({ success: true, data: investments });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Erro ao listar investimentos', error });
  }
};

// Editar um investimento
export const editInvestment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const update = req.body;
    if (!id) {
      return res.status(400).json({ success: false, message: 'ID do investimento é obrigatório' });
    }
    const investment = await Investment.findByIdAndUpdate(id, update, { new: true });
    if (!investment) {
      return res.status(404).json({ success: false, message: 'Investimento não encontrado' });
    }
    return res.json({ success: true, data: investment });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Erro ao editar investimento', error });
  }
};

// Excluir um investimento
export const deleteInvestment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, message: 'ID do investimento é obrigatório' });
    }
    const investment = await Investment.findByIdAndDelete(id);
    if (!investment) {
      return res.status(404).json({ success: false, message: 'Investimento não encontrado' });
    }
    return res.json({ success: true, message: 'Investimento excluído com sucesso' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Erro ao excluir investimento', error });
  }
};
