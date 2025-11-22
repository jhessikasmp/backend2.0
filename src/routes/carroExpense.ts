import { Router } from 'express';
import { addCarroExpense, getCarroExpenses, getCarroExpensesTotal, getCarroExpensesGrouped, deleteCarroExpense } from '../controllers/CarroExpenseController';

const router = Router();

router.post('/', addCarroExpense);
router.get('/user/:userId', getCarroExpenses);
router.get('/user/:userId/total', getCarroExpensesTotal);
router.get('/user/:userId/grouped', getCarroExpensesGrouped);
// DELETE /api/carro-expense/:id
router.delete('/:id', deleteCarroExpense);

export default router;
