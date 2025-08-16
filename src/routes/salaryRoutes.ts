import { Router } from 'express';
import { getCurrentMonthTotal } from '../controllers/SalaryController';

const router = Router();

// GET /api/salary/current-month-total
router.get('/current-month-total', getCurrentMonthTotal);

export default router;
