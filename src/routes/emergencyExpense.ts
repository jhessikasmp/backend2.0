
import { Router } from 'express';
import { addEmergencyExpense, getEmergencyExpenses, getEmergencyExpensesTotal, getEmergencyExpensesGrouped, getAllEmergencyExpenses, deleteEmergencyExpense } from '../controllers/EmergencyExpenseController';

const router = Router();
// GET /api/emergency-expense/all - Retorna todas as despesas de emergência
router.get('/all', getAllEmergencyExpenses);


router.post('/', addEmergencyExpense);
router.get('/user/:userId', getEmergencyExpenses);
router.get('/user/:userId/total', getEmergencyExpensesTotal);

// Nova rota para despesas agrupadas por mês/ano
router.get('/user/:userId/grouped', getEmergencyExpensesGrouped);

// DELETE /api/emergency-expense/:id
router.delete('/:id', deleteEmergencyExpense);

export default router;
