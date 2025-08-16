import { Router } from 'express';
import { addCarroExpense, getCarroExpenses, getCarroExpensesTotal, getCarroExpensesGrouped } from '../controllers/CarroExpenseController';

const router = Router();

router.post('/', addCarroExpense);
router.get('/user/:userId', getCarroExpenses);
router.get('/user/:userId/total', getCarroExpensesTotal);
router.get('/user/:userId/grouped', getCarroExpensesGrouped);

export default router;
