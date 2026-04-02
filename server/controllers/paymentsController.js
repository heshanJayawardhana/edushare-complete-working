const Order = require('../models/Order');
const Resource = require('../models/Resource');
const Transaction = require('../models/Transaction');
const Withdrawal = require('../models/Withdrawal');
const { createNotification } = require('../utils/notifications');

const todayString = () => new Date().toISOString().split('T')[0];

function toTransactionDto(t) {
  return {
    id: t._id?.toString?.() ?? String(t._id),
    date: t.date,
    resourceName: t.resourceName,
    resourceId: t.resourceId?.toString?.() ?? String(t.resourceId),
    amount: t.amount,
    status: t.status,
    buyerId: t.buyerId?.toString?.() ?? String(t.buyerId),
    sellerId: t.sellerId?.toString?.() ?? String(t.sellerId),
    paymentMethod: t.paymentMethod || null
  };
}

function normalizeItems(items) {
  const arr = Array.isArray(items) ? items : [];

  const normalized = arr
    .map((item) => {
      const resourceId = item?.resourceId || item?._id || item?.id;
      const quantity = item?.quantity ?? 1;
      const qtyNumber = Number(quantity);
      return { resourceId, quantity: qtyNumber };
    })
    .filter((x) => x.resourceId);

  return normalized;
}

function validateCardPayload(card) {
  if (!card || typeof card !== 'object') return { ok: false, message: 'Card details are required.' };
  const { cardLast4, expiryMonth, expiryYear } = card;

  const last4Ok = typeof cardLast4 === 'string' && /^\d{4}$/.test(cardLast4);
  const monthOk = Number.isInteger(Number(expiryMonth)) && Number(expiryMonth) >= 1 && Number(expiryMonth) <= 12;
  const yearOk = Number.isInteger(Number(expiryYear)) && Number(expiryYear) >= 2000 && Number(expiryYear) <= 2099;

  if (!last4Ok) return { ok: false, message: 'cardLast4 must be exactly 4 digits.' };
  if (!monthOk) return { ok: false, message: 'expiryMonth must be between 1 and 12.' };
  if (!yearOk) return { ok: false, message: 'expiryYear must be between 2000 and 2099.' };

  return { ok: true };
}

async function checkout(req, res) {
  const buyer = req.user;
  if (buyer.role !== 'student') return res.status(403).json({ message: 'Only students can checkout.' });

  const { paymentMethod, items, card } = req.body || {};

  if (!['card', 'paypal'].includes(paymentMethod)) {
    return res.status(400).json({ message: "paymentMethod must be 'card' or 'paypal'." });
  }

  const normalizedItems = normalizeItems(items);
  if (!normalizedItems.length) return res.status(400).json({ message: 'Cart is empty.' });

  const consolidated = new Map(); // resourceId(string) -> quantity(sum)
  for (const it of normalizedItems) {
    const qty = Math.max(1, Math.floor(Number(it.quantity)));
    if (qty < 1 || qty > 20) return res.status(400).json({ message: 'Invalid quantity.' });
    const key = String(it.resourceId);
    consolidated.set(key, (consolidated.get(key) || 0) + qty);
  }

  const resourceIds = [...consolidated.keys()];
  const resources = await Resource.find({ _id: { $in: resourceIds } });
  if (resources.length !== resourceIds.length) {
    return res.status(400).json({ message: 'One or more resources were not found.' });
  }

  const byId = new Map(resources.map((r) => [String(r._id), r]));
  const missing = resourceIds.filter((id) => !byId.has(id));
  if (missing.length) return res.status(400).json({ message: `Invalid resource(s): ${missing.join(', ')}` });

  for (const r of resources) {
    if (typeof r.price !== 'number' || r.price < 0) return res.status(400).json({ message: `Invalid price for: ${r.title}` });
  }

  if (paymentMethod === 'card') {
    const cardValidation = validateCardPayload(card);
    if (!cardValidation.ok) return res.status(400).json({ message: cardValidation.message });
  }

  const date = todayString();

  const orderItems = [];
  let totalPrice = 0;
  const resourcesForTxn = []; // [{ resource, qty }]

  for (const [rid, qty] of consolidated.entries()) {
    const r = byId.get(rid);
    const lineAmount = r.price * qty;
    orderItems.push({
      resourceId: r._id,
      title: r.title,
      price: lineAmount,
      fileUrl: r.fileUrl,
      fileName: r.fileName
    });
    totalPrice += lineAmount;
    resourcesForTxn.push({ resource: r, qty });
  }

  const order = await Order.create({
    userId: buyer._id,
    items: orderItems,
    totalPrice,
    status: 'completed'
  });

  const txns = resourcesForTxn.map(({ resource }) => {
    // Find the consolidated qty again (keeps logic simple)
    const qty = consolidated.get(String(resource._id)) || 1;

    const amountForTxn = resource.price * qty;

    const txn = {
      date,
      resourceName: resource.title,
      resourceId: resource._id,
      buyerId: buyer._id,
      sellerId: resource.uploaderId,
      orderId: order._id,
      amount: amountForTxn,
      status: 'pending',
      paymentMethod
    };

    if (paymentMethod === 'card' && card) {
      txn.cardLast4 = card.cardLast4;
      txn.expiryMonth = Number(card.expiryMonth);
      txn.expiryYear = Number(card.expiryYear);
    }

    return txn;
  });

  const createdTxns = await Transaction.insertMany(txns);

  // Update seller earnings + notify sellers
  await Promise.all(
    resourcesForTxn
      .filter(({ resource }) => String(resource.uploaderId) !== String(buyer._id))
      .map(async ({ resource }) => {
        return createNotification({
          userId: resource.uploaderId,
          type: 'order',
          title: 'Resource purchased',
          message: `${buyer.name} purchased "${resource.title}".`,
          relatedId: order._id
        });
      })
  );

  return res.status(201).json({
    message: 'Payment successful.',
    order,
    transactions: createdTxns.map(toTransactionDto)
  });
}

async function getTransactions(req, res) {
  const { role, _id } = req.user;
  const query = role === 'admin' ? {} : { $or: [{ buyerId: _id }, { sellerId: _id }] };

  const txns = await Transaction.find(query).sort({ createdAt: -1 }).lean();
  return res.json({ transactions: txns.map(toTransactionDto) });
}

async function updateTransactionStatus(req, res) {
  const { transactionId } = req.params;
  const { status } = req.body || {};

  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status value.' });
  }

  const txn = await Transaction.findById(transactionId);
  if (!txn) return res.status(404).json({ message: 'Transaction not found.' });

  const from = txn.status;
  const allowed =
    from === 'pending' && (status === 'approved' || status === 'rejected');

  if (!allowed) {
    return res.status(400).json({ message: `Invalid status transition from '${from}' to '${status}'.` });
  }

  txn.status = status;
  await txn.save();

  return res.json({ transaction: toTransactionDto(txn) });
}

async function withdraw(req, res) {
  const sellerId = req.user._id;
  if (req.user.role !== 'student') return res.status(403).json({ message: 'Only students can withdraw.' });

  const paid = await Transaction.aggregate([
    { $match: { sellerId, status: 'approved' } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);
  const grossPaid = paid[0]?.total ?? 0;

  const withdrawn = await Withdrawal.aggregate([
    { $match: { sellerId, status: 'completed' } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);
  const alreadyWithdrawn = withdrawn[0]?.total ?? 0;

  const availableNet = Math.max(0, grossPaid - alreadyWithdrawn);
  if (availableNet <= 0) return res.status(400).json({ message: 'No available earnings to withdraw.' });

  const withdrawal = await Withdrawal.create({
    id: `w${Date.now()}-${sellerId}`,
    sellerId,
    amount: availableNet,
    status: 'completed',
    date: todayString()
  });

  return res.status(201).json({
    message: 'Withdrawal processed successfully',
    withdrawal: {
      id: withdrawal.id,
      sellerId: withdrawal.sellerId.toString(),
      amount: withdrawal.amount,
      status: withdrawal.status,
      date: withdrawal.date
    }
  });
}

async function getWithdrawals(req, res) {
  const sellerId = req.user._id;
  const withdrawals = await Withdrawal.find({ sellerId }).sort({ createdAt: -1 }).lean();

  return res.json({
    withdrawals: withdrawals.map((w) => ({
      id: w.id,
      sellerId: w.sellerId.toString(),
      amount: w.amount,
      status: w.status,
      date: w.date
    }))
  });
}

module.exports = {
  checkout,
  getTransactions,
  updateTransactionStatus,
  withdraw,
  getWithdrawals
};

