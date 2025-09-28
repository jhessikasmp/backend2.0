import { Router } from 'express';
import { getCurrentMonthSummary, getYearlyMonthlySummary, getYearlySummaryByUser, getSummaryByMonth } from '../controllers/SummaryController';

const router = Router();

router.get('/current-month', getCurrentMonthSummary);
router.get('/by-month', getSummaryByMonth);
router.get('/year/:year/by-user', getYearlySummaryByUser);
router.get('/year/:year', getYearlyMonthlySummary);

export default router;
