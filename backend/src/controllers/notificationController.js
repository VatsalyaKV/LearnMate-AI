const Notification = require('../models/Notification');
const asyncHandler = require('../middleware/asyncHandler');

exports.getNotifications = asyncHandler(async (req, res) => {
  const { unread, limit = 20 } = req.query;
  const query = { user: req.user.id };
  if (unread === 'true') query.isRead = false;

  const notifications = await Notification.find(query)
    .sort({ createdAt: -1 })
    .limit(parseInt(limit));

  const unreadCount = await Notification.countDocuments({ user: req.user.id, isRead: false });

  res.json({ success: true, data: notifications, unreadCount });
});

exports.markAsRead = asyncHandler(async (req, res) => {
  await Notification.findOneAndUpdate({ _id: req.params.id, user: req.user.id }, { isRead: true, readAt: new Date() });
  res.json({ success: true, message: 'Marked as read' });
});

exports.markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ user: req.user.id, isRead: false }, { isRead: true, readAt: new Date() });
  res.json({ success: true, message: 'All notifications marked as read' });
});

exports.deleteNotification = asyncHandler(async (req, res) => {
  await Notification.findOneAndDelete({ _id: req.params.id, user: req.user.id });
  res.json({ success: true, message: 'Notification deleted' });
});
