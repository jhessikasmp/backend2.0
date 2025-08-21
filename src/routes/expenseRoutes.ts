import { Router } from 'express';
import { addExpense, getUserCurrentMonthExpenses, getCurrentMonthTotalExpenses, getUserAllExpenses, getAllUsersMonthlyExpenses, getUserAnnualExpenses, getAllExpenses, debugAllExpenses, getAnnualExpensesByUser, getTotalWithEntries } from '../controllers/ExpenseController';

const router = Router();
// GET /api/expense/total-with-entries - Soma total de despesas considerando entradas de outras coleções
router.get('/total-with-entries', getTotalWithEntries);

// Endpoint de debug para listar todas as despesas
router.get('/debug-all', debugAllExpenses);

// POST /api/expense - Adiciona despesa
router.post('/', addExpense);

// GET /api/expense/user/:userId - Lista despesas do mês atual do usuário
// GET /api/expense/user/:userId/all - Lista todas as despesas do usuário
router.get('/user/:userId/all', getUserAllExpenses);

// GET /api/expense/all - Lista todas as despesas de todos os usuários
router.get('/all', getAllExpenses);

// GET /api/expense/user/:userId - Lista despesas do mês atual do usuário
router.get('/user/:userId', getUserCurrentMonthExpenses);

// GET /api/expense/user/:userId/year/:year - Lista todas as despesas do usuário no ano
router.get('/user/:userId/year/:year', getUserAnnualExpenses);
router.get('/annual-by-user/:year', getAnnualExpensesByUser);

// GET /api/expense/current-month-total - Soma total das despesas do mês atual de todos os usuários
router.get('/current-month-total', getCurrentMonthTotalExpenses);

// GET /api/expense/monthly-total - Soma total das despesas de todos os usuários agrupado por mês
router.get('/monthly-total', getAllUsersMonthlyExpenses);

export default router;
