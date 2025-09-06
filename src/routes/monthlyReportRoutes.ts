import { Router } from 'express';
import { generateAndSendMonthlyReport } from '../controllers/monthlyReportController';

const router = Router();

// Rota manual para gerar relatório do mês anterior
router.post('/generate', generateAndSendMonthlyReport);

export default router;
