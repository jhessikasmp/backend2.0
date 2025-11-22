import { Router } from 'express';
import { upsertSalary, getUserCurrentMonthSalary, getUserAnnualSalary } from '../controllers/SalaryUserController';

const router = Router();

// POST /api/salary/user - Adiciona ou edita salário do mês para o usuário
router.post('/user', upsertSalary);

// GET /api/salary/user/:userId - Busca salário do mês atual do usuário
router.get('/user/:userId', getUserCurrentMonthSalary);

// (delete route removed) salary deletion route was reverted

// GET /api/salary/user/:userId/year/:year - Busca todos os salários do usuário no ano
router.get('/user/:userId/year/:year', getUserAnnualSalary);

export default router;
