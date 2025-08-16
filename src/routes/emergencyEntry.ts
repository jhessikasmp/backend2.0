import { Router } from 'express';
import { addEmergencyEntry, getEmergencyEntries, getEmergencyEntriesYear } from '../controllers/EmergencyEntryController';

const router = Router();


router.post('/', addEmergencyEntry);
router.get('/user/:userId', getEmergencyEntries);
router.get('/year/:userId/:year', getEmergencyEntriesYear);

export default router;
