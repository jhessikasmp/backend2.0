import { Router } from 'express';
import { addCarroEntry, getCarroEntries, getCarroEntriesYear } from '../controllers/CarroEntryController';

const router = Router();

router.post('/', addCarroEntry);
router.get('/user/:userId', getCarroEntries);
router.get('/year/:userId/:year', getCarroEntriesYear);

export default router;
