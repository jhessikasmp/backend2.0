import { Router } from 'express';
import { createReminder, getUserReminders, updateReminder, deleteReminder } from '../controllers/ReminderController';
import { getAllReminders } from '../controllers/ReminderController';

const router = Router();

// POST /api/reminder - Criar lembrete
router.post('/', createReminder);

// GET /api/reminder/user/:userId - Listar lembretes do usuário
router.get('/user/:userId', getUserReminders);

// GET /api/reminder/all - Listar todos os lembretes de todos os usuários
router.get('/all', getAllReminders);

// PUT /api/reminder/:id - Editar lembrete
router.put('/:id', updateReminder);

// DELETE /api/reminder/:id - Deletar lembrete
router.delete('/:id', deleteReminder);

export default router;
