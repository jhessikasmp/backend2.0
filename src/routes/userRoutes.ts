import { Router } from 'express';
import { UserController } from '../controllers/UserController';

const router = Router();

// Rotas para usuários
router.post('/', UserController.create);        // POST /api/users - Criar usuário
router.get('/', UserController.getAll);         // GET /api/users - Listar todos
router.get('/:id', UserController.getById);     // GET /api/users/:id - Buscar por ID
router.put('/:id', UserController.update);      // PUT /api/users/:id - Atualizar
router.delete('/:id', UserController.delete);   // DELETE /api/users/:id - Deletar

export default router;
