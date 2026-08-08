import { Router } from 'express';
import { listWeeklyReports, getHabitsScore } from '../controllers/reports.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/weekly', requireAuth, listWeeklyReports);
router.get('/habits-score', requireAuth, getHabitsScore);

export default router;
