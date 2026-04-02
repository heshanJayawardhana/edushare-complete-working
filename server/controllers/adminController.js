const User = require('../models/User');
const Resource = require('../models/Resource');
const Comment = require('../models/Comment');
const Inquiry = require('../models/Inquiry');
const Order = require('../models/Order');

async function getDashboard(req, res) {
  const [users, resources, comments, inquiries, orders] = await Promise.all([
    User.find(),
    Resource.find().populate('uploaderId', 'name email badge'),
    Comment.find({ isDeleted: false }).populate('userId', 'name').populate('resourceId', 'title'),
    Inquiry.find().sort({ createdAt: -1 }).limit(10),
    Order.find()
  ]);

  const revenue = orders.reduce((sum, item) => sum + item.totalPrice, 0);

  res.json({
    stats: {
      totalUsers: users.length,
      totalResources: resources.length,
      totalComments: comments.length,
      totalOrders: orders.length,
      totalRevenue: revenue,
      totalDownloads: resources.reduce((sum, item) => sum + item.downloads, 0)
    },
    users,
    resources,
    comments,
    inquiries
  });
}

async function approveResource(req, res) {
  const resource = await Resource.findByIdAndUpdate(
    req.params.id,
    { isApproved: req.body.isApproved !== false },
    { new: true }
  ).populate('uploaderId', 'name email badge');

  if (!resource) return res.status(404).json({ message: 'Resource not found.' });
  res.json({ message: 'Resource approval updated.', resource });
}

async function deleteComment(req, res) {
  const comment = await Comment.findById(req.params.id);
  if (!comment) return res.status(404).json({ message: 'Comment not found.' });
  comment.isDeleted = true;
  await comment.save();
  res.json({ message: 'Comment deleted.' });
}

async function updateUserBadge(req, res) {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found.' });
  user.badge = req.body.badge || user.badge;
  await user.save();
  res.json({ message: 'User badge updated.', user });
}

module.exports = { getDashboard, approveResource, deleteComment, updateUserBadge };
