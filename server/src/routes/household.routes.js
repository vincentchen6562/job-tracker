import { Router } from 'express';
import { getHousehold, updateHousehold, updateIndependenceLevel } from '../controllers/household.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, getHousehold);
router.patch('/', requireAuth, requireRole('parent'), updateHousehold);
router.patch('/teens/:teenId/independence-level', requireAuth, requireRole('parent'), updateIndependenceLevel);

export default router;
