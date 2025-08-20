
import { Router } from 'express';
import { addViagemEntry, getViagemEntries, getViagemEntriesYear, getAllViagemEntriesYear } from '../controllers/ViagemEntryController';

const router = Router();

router.post('/', addViagemEntry);
router.get('/user/:userId', getViagemEntries);
router.get('/year/:userId/:year', getViagemEntriesYear);
// Nova rota global para entradas anuais
router.get('/year/:year', getAllViagemEntriesYear);

export default router;
