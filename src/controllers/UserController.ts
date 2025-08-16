import { Request, Response } from 'express';
import User, { IUser } from '../models/User';

export class UserController {
  // Criar usuário (registro)
  static async create(req: Request, res: Response): Promise<Response> {
    try {
      const { name } = req.body;

      if (!name) {
        return res.status(400).json({
          success: false,
          message: 'Nome é obrigatório'
        });
      }

      const user = new User({ name });
      await user.save();

      return res.status(201).json({
        success: true,
        message: 'Usuário criado com sucesso',
        data: user
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: 'Erro ao criar usuário',
        error: error.message
      });
    }
  }

  // Listar todos os usuários
  static async getAll(req: Request, res: Response): Promise<Response> {
    try {
      const users = await User.find().sort({ createdAt: -1 });

      return res.json({
        success: true,
        data: users,
        total: users.length
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar usuários',
        error: error.message
      });
    }
  }

  // Buscar usuário por ID
  static async getById(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const user = await User.findById(id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado'
        });
      }

      return res.json({
        success: true,
        data: user
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar usuário',
        error: error.message
      });
    }
  }

  // Atualizar usuário
  static async update(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const { name } = req.body;

      const user = await User.findByIdAndUpdate(
        id,
        { name },
        { new: true, runValidators: true }
      );

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado'
        });
      }

      return res.json({
        success: true,
        message: 'Usuário atualizado com sucesso',
        data: user
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: 'Erro ao atualizar usuário',
        error: error.message
      });
    }
  }

  // Deletar usuário
  static async delete(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;

      const user = await User.findByIdAndDelete(id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado'
        });
      }

      return res.json({
        success: true,
        message: 'Usuário deletado com sucesso'
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: 'Erro ao deletar usuário',
        error: error.message
      });
    }
  }
}
