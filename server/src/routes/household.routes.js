import { Router } from 'express';
import { getHousehold, updateHousehold } from '../controllers/household.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, getHousehold);
router.patch('/', requireAuth, requireRole('parent'), updateHousehold);

export default router;
