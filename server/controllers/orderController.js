const Order = require('../models/Order');
const Resource = require('../models/Resource');
const { createNotification } = require('../utils/notifications');

async function createOrder(req, res) {
  const items = Array.isArray(req.body.items) ? req.body.items : [];
  if (!items.length) return res.status(400).json({ message: 'Cart is empty.' });

  const resourceIds = items.map((item) => item.resourceId || item._id || item.id);
  const resources = await Resource.find({ _id: { $in: resourceIds } });

  if (resources.length !== resourceIds.length) {
    return res.status(400).json({ message: 'One or more resources were not found.' });
  }

  const orderItems = resources.map((resource) => ({
    resourceId: resource._id,
    title: resource.title,
    price: resource.price,
    fileUrl: resource.fileUrl,
    fileName: resource.fileName
  }));

  const totalPrice = orderItems.reduce((sum, item) => sum + item.price, 0);

  const order = await Order.create({
    userId: req.user._id,
    items: orderItems,
    totalPrice,
    status: 'completed'
  });

  await Promise.all(
    resources
      .filter((resource) => resource.uploaderId.toString() !== req.user._id.toString())
      .map((resource) =>
        createNotification({
          userId: resource.uploaderId,
          type: 'order',
          title: 'Resource purchased',
          message: `${req.user.name} purchased "${resource.title}".`,
          relatedId: order._id
        })
      )
  );

  res.status(201).json({ message: 'Order completed.', order });
}

async function getUserOrders(req, res) {
  const orders = await Order.find({ userId: req.user._id }).sort({ createdAt: -1 });
  res.json({ orders });
}

async function getUserLibrary(req, res) {
  const orders = await Order.find({ userId: req.user._id, status: 'completed' }).sort({ createdAt: -1 });
  const library = orders.flatMap((order) => order.items.map((item) => ({ ...item.toObject(), orderId: order._id, purchasedAt: order.createdAt })));
  res.json({ library });
}

async function getAllOrders(req, res) {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin access required.' });
  const orders = await Order.find().populate('userId', 'name email').sort({ createdAt: -1 });
  res.json({ orders });
}

module.exports = { createOrder, getUserOrders, getUserLibrary, getAllOrders };
