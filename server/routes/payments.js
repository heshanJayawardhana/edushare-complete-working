const express = require('express');
const { auth, requireAdmin } = require('../middleware/auth');
const paymentsController = require('../controllers/paymentsController');

const router = express.Router();

router.use(auth);

router.post('/checkout', paymentsController.checkout);
router.get('/transactions', paymentsController.getTransactions);
router.patch('/transactions/:transactionId/status', requireAdmin, paymentsController.updateTransactionStatus);
router.post('/withdraw', paymentsController.withdraw);
router.get('/withdrawals', paymentsController.getWithdrawals);

module.exports = router;

