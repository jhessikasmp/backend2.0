import { Router } from 'express';
import { addMesadaExpense, getMesadaExpenses, getMesadaExpensesTotal, getMesadaExpensesGrouped } from '../controllers/MesadaExpenseController';

const router = Router();

router.post('/', addMesadaExpense);
router.get('/user/:userId', getMesadaExpenses);
router.get('/user/:userId/total', getMesadaExpensesTotal);
router.get('/user/:userId/grouped', getMesadaExpensesGrouped);

export default router;
