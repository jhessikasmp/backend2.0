
import { Router } from 'express';
import { addViagemExpense, getViagemExpenses, getViagemExpensesTotal, getViagemExpensesGrouped, getAllViagemExpenses, deleteViagemExpense } from '../controllers/ViagemExpenseController';

const router = Router();

router.post('/', addViagemExpense);
router.get('/user/:userId', getViagemExpenses);
router.get('/user/:userId/total', getViagemExpensesTotal);
router.get('/user/:userId/grouped', getViagemExpensesGrouped);
// Nova rota global para despesas de viagem
router.get('/all', getAllViagemExpenses);
// DELETE /api/viagem-expense/:id
router.delete('/:id', deleteViagemExpense);

export default router;
