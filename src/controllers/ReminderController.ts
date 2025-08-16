import { Request, Response } from 'express';
import Reminder from '../models/Reminder';

// Criar lembrete
export const createReminder = async (req: Request, res: Response) => {
  try {
    const { user, title, content, date } = req.body;
    if (!user || !title) {
      return res.status(400).json({ success: false, message: 'Dados obrigatórios faltando' });
    }
    const reminder = await Reminder.create({ user, title, content, date });
    return res.json({ success: true, data: reminder });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Erro ao criar lembrete', error });
  }
};

// Listar lembretes do usuário
export const getUserReminders = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const reminders = await Reminder.find({ user: userId }).sort({ date: 1 });
    return res.json({ success: true, data: reminders });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Erro ao buscar lembretes', error });
  }
};

// Listar todos os lembretes de todos os usuários
export const getAllReminders = async (req: Request, res: Response) => {
  try {
    const reminders = await Reminder.find({}).populate('user', 'name email').sort({ date: 1 });
    return res.json({ success: true, data: reminders });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Erro ao buscar todos os lembretes', error });
  }
};

// Editar lembrete
export const updateReminder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, content, date } = req.body;
    const reminder = await Reminder.findByIdAndUpdate(id, { title, content, date }, { new: true });
    if (!reminder) return res.status(404).json({ success: false, message: 'Lembrete não encontrado' });
    return res.json({ success: true, data: reminder });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Erro ao editar lembrete', error });
  }
};

// Deletar lembrete
export const deleteReminder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const reminder = await Reminder.findByIdAndDelete(id);
    if (!reminder) return res.status(404).json({ success: false, message: 'Lembrete não encontrado' });
    return res.json({ success: true, data: reminder });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Erro ao deletar lembrete', error });
  }
};
