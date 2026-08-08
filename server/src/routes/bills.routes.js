import { Router } from 'express';
import { listBills, listBillDefinitions, createBill, payBill } from '../controllers/bills.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, listBills);
router.get('/definitions', requireAuth, requireRole('parent'), listBillDefinitions);
router.post('/', requireAuth, requireRole('parent'), createBill);
router.post('/:id/pay', requireAuth, requireRole('teen'), payBill);

export default router;
