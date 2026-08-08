import { Router } from 'express';
import { listGoals, createGoal, updateGoal } from '../controllers/goals.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, requireRole('teen'), listGoals);
router.post('/', requireAuth, requireRole('teen'), createGoal);
router.patch('/:id', requireAuth, requireRole('teen'), updateGoal);

export default router;
