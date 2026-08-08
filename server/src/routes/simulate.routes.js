import { Router } from 'express';
import {
  simulateWhatIf,
  requestBNPLPlan,
  approveBNPLPlan,
  declineBNPLPlan,
  listBNPLPlans,
} from '../controllers/simulate.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.post('/purchase', requireAuth, requireRole('teen'), simulateWhatIf);
router.get('/bnpl', requireAuth, listBNPLPlans);
router.post('/bnpl', requireAuth, requireRole('teen'), requestBNPLPlan);
router.patch('/bnpl/:id/approve', requireAuth, requireRole('parent'), approveBNPLPlan);
router.patch('/bnpl/:id/decline', requireAuth, requireRole('parent'), declineBNPLPlan);

export default router;
