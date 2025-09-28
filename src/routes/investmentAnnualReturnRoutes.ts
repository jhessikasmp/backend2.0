import { Router } from 'express';
import { listReturns, upsertReturn, deleteReturn } from '../controllers/InvestmentAnnualReturnController';

const router = Router();

router.get('/', listReturns);
router.put('/:year', upsertReturn);
router.delete('/:year', deleteReturn);

export default router;
