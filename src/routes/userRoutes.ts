
import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import User from '../models/User';

const router = Router();

// Rota de login
router.post('/login', async (req, res) => {
	const { name } = req.body;
	if (!name) {
		return res.status(400).json({ success: false, message: 'Nome é obrigatório' });
	}
	try {
		const user = await User.findOne({ name });
		if (!user) {
			return res.status(404).json({ success: false, message: 'Usuário não encontrado' });
		}
		return res.json({ success: true, user });
	} catch (err) {
		const errorMsg = err instanceof Error ? err.message : String(err);
		return res.status(500).json({ success: false, message: 'Erro no login', error: errorMsg });
	}
});

// Rotas para usuários
router.post('/', UserController.create);        // POST /api/users - Criar usuário
router.get('/', UserController.getAll);         // GET /api/users - Listar todos
router.get('/:id', UserController.getById);     // GET /api/users/:id - Buscar por ID
router.put('/:id', UserController.update);      // PUT /api/users/:id - Atualizar
router.delete('/:id', UserController.delete);   // DELETE /api/users/:id - Deletar

export default router;
