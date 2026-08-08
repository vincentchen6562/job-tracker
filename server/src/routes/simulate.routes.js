import { Router } from 'express';
import { simulateWhatIf, requestBNPLPlan, approveBNPLPlan } from '../controllers/simulate.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.post('/purchase', requireAuth, requireRole('teen'), simulateWhatIf);
router.post('/bnpl', requireAuth, requireRole('teen'), requestBNPLPlan);
router.patch('/bnpl/:id/approve', requireAuth, requireRole('parent'), approveBNPLPlan);

export default router;
