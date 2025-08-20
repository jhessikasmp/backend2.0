import { Router } from 'express';
import { addInvestmentEntry, listInvestmentEntries, listInvestmentEntriesYear } from '../controllers/InvestmentEntryController';

const router = Router();

// POST /api/investment-entry - Adiciona entrada de investimento
router.post('/', addInvestmentEntry);

// GET /api/investment-entry/user/:userId - Lista entradas de um usuário
router.get('/user/:userId', listInvestmentEntries);

// GET /api/investment-entry/year/:year - Lista todas as entradas de investimento do ano
router.get('/year/:year', listInvestmentEntriesYear);

export default router;
