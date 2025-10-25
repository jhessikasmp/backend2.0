import express from 'express';
import { generateCustomPeriodReport, generateMonthlyReportDownload, generateAnnualReportDownload } from '../controllers/reportController';

const router = express.Router();

// Ping para diagnosticar se as rotas de relatório estão ativas
router.get('/ping', (req, res) => {
	res.json({ ok: true, route: '/api/reports', message: 'reportRoutes ativo' });
});

// Relatório por período personalizado (startDate e endDate)
router.get('/custom-period', generateCustomPeriodReport);
// Alias por segurança/caching: aceitar POST e um alias sem hífen
router.post('/custom-period', generateCustomPeriodReport);
router.get('/period', generateCustomPeriodReport);
router.get('/custom-period/download', generateCustomPeriodReport);

// Relatório mensal para download direto
router.get('/monthly/download', generateMonthlyReportDownload);

// Relatório anual para download direto
router.get('/annual/download', generateAnnualReportDownload);
// Aliases adicionais para robustez
router.get('/annual', generateAnnualReportDownload);
router.post('/annual/download', generateAnnualReportDownload);
router.post('/annual', generateAnnualReportDownload);

export default router;