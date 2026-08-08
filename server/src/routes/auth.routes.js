import { Router } from 'express';
import { registerHousehold, inviteTeen, login } from '../controllers/auth.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.post('/register-household', registerHousehold);
router.post('/login', login);
router.post('/invite-teen', requireAuth, requireRole('parent'), inviteTeen);

export default router;
