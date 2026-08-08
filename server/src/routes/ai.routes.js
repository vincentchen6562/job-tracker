import { Router } from 'express';
import { coachMessage, conversationPrompt, ask } from '../controllers/ai.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/coach-message', requireAuth, coachMessage);
router.post('/conversation-prompt', requireAuth, conversationPrompt);
router.post('/ask', requireAuth, ask);

export default router;
