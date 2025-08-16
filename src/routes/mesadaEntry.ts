import { Router } from 'express';
import { addMesadaEntry, getMesadaEntries, getMesadaEntriesYear } from '../controllers/MesadaEntryController';

const router = Router();

router.post('/', addMesadaEntry);
router.get('/user/:userId', getMesadaEntries);
router.get('/year/:userId/:year', getMesadaEntriesYear);

export default router;
