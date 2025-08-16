import { Router } from 'express';
import { addViagemEntry, getViagemEntries, getViagemEntriesYear } from '../controllers/ViagemEntryController';

const router = Router();

router.post('/', addViagemEntry);
router.get('/user/:userId', getViagemEntries);
router.get('/year/:userId/:year', getViagemEntriesYear);

export default router;
