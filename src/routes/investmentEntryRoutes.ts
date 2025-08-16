import { Router } from 'express';
import { addInvestmentEntry, listInvestmentEntries } from '../controllers/InvestmentEntryController';

const router = Router();

// POST /api/investment-entry - Adiciona entrada de investimento
router.post('/', addInvestmentEntry);

// GET /api/investment-entry/user/:userId - Lista entradas de um usuário
router.get('/user/:userId', listInvestmentEntries);

export default router;
