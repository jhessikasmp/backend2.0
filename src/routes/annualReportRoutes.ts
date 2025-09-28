import { Router } from 'express';
import { generateAndSendAnnualReport } from '../controllers/annualReportController';

const router = Router();

// Gera o relatório anual do ano corrente ou do ano especificado via query ?year=YYYY
router.post('/generate', generateAndSendAnnualReport);

export default router;
