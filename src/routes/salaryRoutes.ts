import { Router } from 'express';
import { getCurrentMonthTotal, getUserAnnualSalary } from '../controllers/SalaryController';

const router = Router();


// GET /api/salary/current-month-total
router.get('/current-month-total', getCurrentMonthTotal);

// (route removed) previously provided a per-user salary list

// GET /api/salary/user/:userId/year/:year - salários anuais do usuário
router.get('/user/:userId/year/:year', getUserAnnualSalary);

export default router;
