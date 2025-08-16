import { Router } from 'express';
import { addInvestment, listInvestments, editInvestment, deleteInvestment, listAllInvestments } from '../controllers/InvestmentController';

const router = Router();

// GET /api/investment/all - Lista todos os investimentos de todos os usuários
router.get('/all', listAllInvestments);

// POST /api/investment - Adiciona investimento
router.post('/', addInvestment);

// GET /api/investment/user/:userId - Lista investimentos de um usuário
router.get('/user/:userId', listInvestments);

// PUT /api/investment/:id - Edita um investimento
router.put('/:id', editInvestment);

// DELETE /api/investment/:id - Exclui um investimento
router.delete('/:id', deleteInvestment);

export default router;
