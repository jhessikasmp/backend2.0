import { Router } from 'express';
import { addEmergencyExpense, getEmergencyExpenses, getEmergencyExpensesTotal, getEmergencyExpensesGrouped } from '../controllers/EmergencyExpenseController';

const router = Router();


router.post('/', addEmergencyExpense);
router.get('/user/:userId', getEmergencyExpenses);
router.get('/user/:userId/total', getEmergencyExpensesTotal);

// Nova rota para despesas agrupadas por mês/ano
router.get('/user/:userId/grouped', getEmergencyExpensesGrouped);

export default router;
