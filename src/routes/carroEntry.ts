import { Router } from 'express';
import { addCarroEntry, getCarroEntries, getCarroEntriesYear, getCarroEntriesTotal } from '../controllers/CarroEntryController';

const router = Router();

router.post('/', addCarroEntry);
router.get('/user/:userId', getCarroEntries);
router.get('/year/:userId/:year', getCarroEntriesYear);
// GET /api/carro-entry/total/:userId - total de entradas de carro do usuário
router.get('/total/:userId', getCarroEntriesTotal);

export default router;
