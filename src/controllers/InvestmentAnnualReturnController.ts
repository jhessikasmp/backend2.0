import { Request, Response } from 'express';
import InvestmentAnnualReturn from '../models/InvestmentAnnualReturn';

// GET /api/investment-returns
export const listReturns = async (_req: Request, res: Response) => {
  try {
    const data = await InvestmentAnnualReturn.find({}).sort({ year: -1 });
    return res.json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Erro ao listar retornos', error });
  }
};

// PUT /api/investment-returns/:year
export const upsertReturn = async (req: Request, res: Response) => {
  try {
    const year = Number(req.params.year);
    const { percent } = req.body as { percent: number };
    if (!Number.isFinite(year) || !Number.isFinite(percent)) {
      return res.status(400).json({ success: false, message: 'Parâmetros inválidos' });
    }
    const doc = await InvestmentAnnualReturn.findOneAndUpdate(
      { year },
      { $set: { percent } },
      { upsert: true, new: true }
    );
    return res.json({ success: true, data: doc });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Erro ao salvar retorno', error });
  }
};

// DELETE /api/investment-returns/:year
export const deleteReturn = async (req: Request, res: Response) => {
  try {
    const year = Number(req.params.year);
    if (!Number.isFinite(year)) {
      return res.status(400).json({ success: false, message: 'Ano inválido' });
    }
    await InvestmentAnnualReturn.deleteOne({ year });
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Erro ao remover retorno', error });
  }
};

export default { listReturns, upsertReturn, deleteReturn };
