import { Router } from 'express';
import { addViagemExpense, getViagemExpenses, getViagemExpensesTotal, getViagemExpensesGrouped } from '../controllers/ViagemExpenseController';

const router = Router();

router.post('/', addViagemExpense);
router.get('/user/:userId', getViagemExpenses);
router.get('/user/:userId/total', getViagemExpensesTotal);
router.get('/user/:userId/grouped', getViagemExpensesGrouped);

export default router;
