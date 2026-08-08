import { Router } from 'express';
import { listTransactions, getSummary, getCategoryBreakdown, createSpend } from '../controllers/transactions.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, listTransactions);
router.get('/summary', requireAuth, getSummary);
router.get('/category-breakdown', requireAuth, getCategoryBreakdown);
router.post('/spend', requireAuth, requireRole('teen'), createSpend);

export default router;
