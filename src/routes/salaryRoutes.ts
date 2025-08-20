import { Router } from 'express';
import { getCurrentMonthTotal, getUserAnnualSalary } from '../controllers/SalaryController';

const router = Router();


// GET /api/salary/current-month-total
router.get('/current-month-total', getCurrentMonthTotal);

// GET /api/salary/user/:userId/year/:year - salários anuais do usuário
router.get('/user/:userId/year/:year', getUserAnnualSalary);

export default router;
