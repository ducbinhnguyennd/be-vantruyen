const router = require("express").Router();
const Notification = require('../models/NotifyModel')


router.get('/unread-count', async (req, res) => {
    try {
      const unreadCount = await Notification.countDocuments({ title: { $regex: /Duyệt sửa truyện|Duyệt thêm truyện|Duyệt thêm chap|Duyệt sửa chap|Report/ } });
  
      res.json({ unreadCount });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
  
  router.get('/unread-count-nhomdich', async (req, res) => {
    try {
      const userId = req.session.userId;
  
      // Đếm số lượng thông báo chưa đọc
      const unreadCount = await Notification.countDocuments({ userId: userId, title: { $regex: /Được phê duyệt|Đã bị hủy/ } });
  
      res.json({ unreadCount });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
  
  router.get('/rendernotifi', async (req, res) => {
    const notification = await Notification.find({ title: { $regex: /Duyệt sửa truyện|Duyệt thêm truyện|Duyệt thêm chap|Duyệt sửa chap|Report/ } });
    res.render('notification', { notification });
  });

  router.get('/rendernotifinhomdich', async (req, res) => {
    try {
      const userId = req.session.userId
      const notifications = await Notification.find({ userId: userId, title: { $regex: /Được phê duyệt|Đã bị hủy/ } });
      res.json(notifications);
    } catch (error) {
      console.error('Lỗi khi lấy thông báo:', error);
      res.status(500).json({ message: 'Đã xảy ra lỗi khi lấy thông báo' });
    }
  });

  router.post('/delete-selected-notifications', async (req, res) => {
    try {
      const selectedIds = req.body.ids;
      if (!selectedIds || !Array.isArray(selectedIds)) {
        return res.status(400).json({ error: 'Danh sách ID không hợp lệ.' });
      }
  
      // Xóa các thông báo có ID trong danh sách đã chọn
      await Notification.deleteMany({ _id: { $in: selectedIds } });
  
      return res.render("nhomdich")
    } catch (error) {
      console.error('Lỗi khi xóa thông báo:', error);
      res.status(500).json({ error: 'Đã xảy ra lỗi khi xóa thông báo.' });
    }
  });

  module.exports=router;