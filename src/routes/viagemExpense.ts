
import { Router } from 'express';
import { addViagemExpense, getViagemExpenses, getViagemExpensesTotal, getViagemExpensesGrouped, getAllViagemExpenses } from '../controllers/ViagemExpenseController';

const router = Router();

router.post('/', addViagemExpense);
router.get('/user/:userId', getViagemExpenses);
router.get('/user/:userId/total', getViagemExpensesTotal);
router.get('/user/:userId/grouped', getViagemExpensesGrouped);
// Nova rota global para despesas de viagem
router.get('/all', getAllViagemExpenses);

export default router;
