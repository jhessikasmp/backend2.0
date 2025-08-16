import { Router } from 'express';
import { getEmergencyEntriesYear } from '../controllers/EmergencyDashboardController';

const router = Router();

router.get('/entries/year/:userId/:year', getEmergencyEntriesYear);

export default router;
