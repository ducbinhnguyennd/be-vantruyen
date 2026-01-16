const router = require("express").Router();
const User = require('../models/UserModel')
const moment = require('moment');
const momenttimezone = require('moment-timezone');
const multer = require('multer')
const Payment = require('../models/PaymentModel')
const Baiviet = require('../models/BaiVietModel')
const Notification = require('../models/NotifyModel')
const NotificationBaiviet = require('../models/NotifyBaiVietModel')
const storage = multer.memoryStorage();

const upload = multer({ storage: storage });


router.post('/postbaiviet/:userId', upload.array('images', 10), async (req, res) => {
    try {
      const userId = req.params.userId;
      const { content } = req.body;
  
      if (!req.files) {
        const user = await User.findById(userId);
        if (!user) {
          return res.status(404).json({ message: 'Không tìm thấy user' });
        }
  
        const vietnamTime = momenttimezone().add(7, 'hours').toDate();
  
        const baiviet = new Baiviet({ userId, content, like: 0, images: [], date: vietnamTime });
  
        await baiviet.save();
  
        user.baiviet.push(baiviet._id);
        await user.save();
  
        return res.status(200).json({ message: 'Đăng bài viết thành công' });
      }
  
      const images = req.files.map((file) => file.buffer.toString('base64'));
  
      if (images.length > 2) {
        return res.status(400).json({ message: 'Chỉ được phép tải lên tối đa 2 ảnh.' });
      }
  
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'Không tìm thấy user' });
      }
  
      const vietnamTime = momenttimezone().add(7, 'hours').toDate();
  
      const baiviet = new Baiviet({ userId, content, like: 0, images, date: vietnamTime });
  
      await baiviet.save();
  
      user.baiviet.push(baiviet._id);
      await user.save();
  
      return res.status(200).json({ message: 'Đăng bài viết thành công' });
    } catch (err) {
      console.error('Lỗi khi đăng bài viết:', err);
      res.status(500).json({ error: 'Đã xảy ra lỗi khi đăng bài viết.' });
    }
  });

  router.post('/postbaiviet', upload.array('images', 10), async (req, res) => {
    try {
      const userId = req.session.userId;
      const { content } = req.body;
  
      if (!req.files) {
        const user = await User.findById(userId);
        if (!user) {
          return res.status(404).json({ message: 'Không tìm thấy user' });
        }
  
        const vietnamTime = momenttimezone().add(7, 'hours').toDate();
  
        const baiviet = new Baiviet({ userId, content, like: 0, images: [], date: vietnamTime });
  
        await baiviet.save();
  
        user.baiviet.push(baiviet._id);
        await user.save();
  
        return res.status(200).json({ message: 'Đăng bài viết thành công' });
      }
  
      const images = req.files.map((file) => file.buffer.toString('base64'));
  
      if (images.length > 2) {
        return res.status(400).json({ message: 'Chỉ được phép tải lên tối đa 2 ảnh.' });
      }
  
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'Không tìm thấy user' });
      }
  
      const vietnamTime = momenttimezone().add(7, 'hours').toDate();
  
      const baiviet = new Baiviet({ userId, content, like: 0, images, date: vietnamTime });
  
      await baiviet.save();
  
      user.baiviet.push(baiviet._id);
      await user.save();
      if (user.role === 'nhomdich') {
        res.render("successnhomdich", { message: 'đăng bài viết thành công' })
      }
      else {
        res.render("successadmin", { message: 'đăng bài viết thành công' })
      }
  
    } catch (err) {
      console.error('Lỗi khi đăng bài viết:', err);
      res.status(500).json({ error: 'Đã xảy ra lỗi khi đăng bài viết.' });
    }
  });
  
  router.get('/getbaiviet/:userId', async (req, res) => {
    try {
      const topUsers = await Payment.aggregate([
        {
          $match: { success: 'thanh toán thành công' },
        },
        {
          $group: {
            _id: '$userID',
            totalAmount: { $sum: '$totalAmount' },
          },
        },
        {
          $sort: { totalAmount: -1 },
        },
        {
          $limit: 10,
        },
      ]);
  
      const extendedTopUsers = await Promise.all(
        topUsers.map(async (user) => {
          const userInfo = await User.findById(user._id).select('username role avatar');
  
          return {
            userID: user._id,
            username: userInfo.username,
            role: userInfo.role,
            avatar: userInfo.avatar || '',
            totalAmount: user.totalAmount,
            coin: user.totalAmount * 10,
            rolevip: 'vip'
          };
        })
      );
  
      const allUsers = await User.find();
  
      const topUserIds = new Set(extendedTopUsers.slice(0, 3).map(user => user.userID));
  
      // Tạo một đối tượng để lưu trữ thông tin role và rolevip của mỗi người dùng
      const userRoles = {};
  
      // Xử lý rolevip cho top users
      extendedTopUsers.forEach(user => {
        userRoles[user.userID.toString()] = {
          userId: user.userID,
          username: user.username,
          role: user.role,
          avatar: user.avatar,
          rolevip: 'vip'
        };
      });
  
      // Xử lý rolevip cho những người dùng không phải top users, admin, và nhomdich
      allUsers.forEach(user => {
        if (!topUserIds.has(user._id.toString()) && user.role !== 'admin' && user.role !== 'nhomdich') {
          userRoles[user._id.toString()] = {
            userId: user._id,
            username: user.username,
            role: user.role,
            avatar: user.avatar, rolevip: 'notvip'
          };
        }
        if (topUserIds.has(user._id.toString()) || user.role === 'admin' || user.role === 'nhomdich') {
          userRoles[user._id.toString()] = {
            userId: user._id,
            username: user.username,
            role: user.role,
            avatar: user.avatar,
            rolevip: 'vip'
          };
        }
      });
  
      const userId = req.params.userId;
      const currentUser = await User.findById(userId)
      if (!currentUser) {
        return res.status(404).json({ message: 'Không tìm thấy người dùng.' });
      }
      const baiviet = await Baiviet.find({}).sort({ date: -1 }).populate("userId", "username")
      const formattedBaiviet = await Promise.all(baiviet.map(async (item) => {
        const isLiked = currentUser.favoriteBaiviet.some(favorite => favorite.baivietId.toString() === item._id.toString());
        const formattedDate = moment(item.date).format('DD/MM/YYYY HH:mm:ss');
        const comments = await Promise.all(item.comment.map(async (commentItem) => {
          const usercmt = userRoles[commentItem.userID.toString()];
          const formatdatecmt = moment(commentItem.date).format('DD/MM/YYYY HH:mm:ss')
          return {
            _id: commentItem._id,
            userId: commentItem.userID._id,
            cmt: commentItem.cmt,
            username: usercmt.username,
            role: usercmt.role,
            avatar: usercmt.avatar || '',
            rolevip: usercmt.rolevip,
            date: formatdatecmt
          };
        }));
        const user = userRoles[item.userId._id.toString()];
        return {
          _id: item._id,
          userId: item.userId._id,
          username: user.username,
          role: user.role,
          avatar: user.avatar || '',
          rolevip: user.rolevip,
          content: item.content,
          like: item.like,
          isLiked: isLiked,
          date: formattedDate,
          comment: comments,
          commentCount: item.comment.length,
          images: item.images
        };
      }));
      res.json(formattedBaiviet);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Đã xảy ra lỗi khi lấy thông tin bài viết' });
    }
  })
  
  router.get('/getbaiviet', async (req, res) => {
    try {
      const topUsers = await Payment.aggregate([
        {
          $match: { success: 'thanh toán thành công' },
        },
        {
          $group: {
            _id: '$userID',
            totalAmount: { $sum: '$totalAmount' },
          },
        },
        {
          $sort: { totalAmount: -1 },
        },
        {
          $limit: 10,
        },
      ]);
  
      const extendedTopUsers = await Promise.all(
        topUsers.map(async (user) => {
          const userInfo = await User.findById(user._id).select('username role avatar');
  
          return {
            userID: user._id,
            username: userInfo.username,
            role: userInfo.role,
            avatar: userInfo.avatar || '',
            totalAmount: user.totalAmount,
            coin: user.totalAmount * 10,
            rolevip: 'vip'
          };
        })
      );
  
      const allUsers = await User.find();
  
      const topUserIds = new Set(extendedTopUsers.slice(0, 3).map(user => user.userID));
  
      // Tạo một đối tượng để lưu trữ thông tin role và rolevip của mỗi người dùng
      const userRoles = {};
  
      // Xử lý rolevip cho top users
      extendedTopUsers.forEach(user => {
        userRoles[user.userID.toString()] = {
          userId: user.userID,
          username: user.username,
          role: user.role,
          avatar: user.avatar,
          rolevip: 'vip'
        };
      });
  
      // Xử lý rolevip cho những người dùng không phải top users, admin, và nhomdich
      allUsers.forEach(user => {
        if (!topUserIds.has(user._id.toString()) && user.role !== 'admin' && user.role !== 'nhomdich') {
          userRoles[user._id.toString()] = {
            userId: user._id,
            username: user.username,
            role: user.role,
            avatar: user.avatar, rolevip: 'notvip'
          };
        }
        if (topUserIds.has(user._id.toString()) || user.role === 'admin' || user.role === 'nhomdich') {
          userRoles[user._id.toString()] = {
            userId: user._id,
            username: user.username,
            role: user.role,
            avatar: user.avatar,
            rolevip: 'vip'
          };
        }
      });
  
      const baiviet = await Baiviet.find({}).sort({ date: -1 }).populate("userId", "username")
      const formattedBaiviet = await Promise.all(baiviet.map(async (item) => {
        const formattedDate = moment(item.date).format('DD/MM/YYYY HH:mm:ss');
        const comments = await Promise.all(item.comment.map(async (commentItem) => {
          const usercmt = userRoles[commentItem.userID.toString()];
          const formatdatecmt = moment(commentItem.date).format('DD/MM/YYYY HH:mm:ss')
          return {
            _id: commentItem._id,
            userId: commentItem.userID,
            cmt: commentItem.cmt,
            username: usercmt.username,
            role: usercmt.role,
            avatar: usercmt.avatar || '',
            rolevip: usercmt.rolevip,
            date: formatdatecmt
          };
        }));
        const user = userRoles[item.userId._id.toString()];
        return {
          _id: item._id,
          userId: item.userId._id,
          username: user.username,
          role: user.role,
          avatar: user.avatar || '',
          rolevip: user.rolevip,
          content: item.content,
          like: item.like,
          isLiked: item.isLiked,
          date: formattedDate,
          comment: comments,
          commentCount: item.comment.length,
          images: item.images
        };
      }));
      res.json(formattedBaiviet);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Đã xảy ra lỗi khi lấy thông tin bài viết' });
    }
  })

  router.get('/getcmtbaiviet/:baivietId', async (req, res) => {
    try {
      const topUsers = await Payment.aggregate([
        {
          $match: { success: 'thanh toán thành công' },
        },
        {
          $group: {
            _id: '$userID',
            totalAmount: { $sum: '$totalAmount' },
          },
        },
        {
          $sort: { totalAmount: -1 },
        },
        {
          $limit: 10,
        },
      ]);
  
      const extendedTopUsers = await Promise.all(
        topUsers.map(async (user) => {
          const userInfo = await User.findById(user._id).select('username role avatar');
  
          return {
            userID: user._id,
            username: userInfo.username,
            role: userInfo.role,
            avatar: userInfo.avatar || '',
            totalAmount: user.totalAmount,
            coin: user.totalAmount * 10,
            rolevip: 'vip'
          };
        })
      );
  
      const allUsers = await User.find();
  
      const topUserIds = new Set(extendedTopUsers.slice(0, 3).map(user => user.userID));
  
      // Tạo một đối tượng để lưu trữ thông tin role và rolevip của mỗi người dùng
      const userRoles = {};
  
      // Xử lý rolevip cho top users
      extendedTopUsers.forEach(user => {
        userRoles[user.userID.toString()] = {
          userId: user.userID,
          username: user.username,
          role: user.role,
          avatar: user.avatar,
          rolevip: 'vip'
        };
      });
  
      allUsers.forEach(user => {
        if (!topUserIds.has(user._id.toString()) && user.role !== 'admin' && user.role !== 'nhomdich') {
          userRoles[user._id.toString()] = {
            userId: user._id,
            username: user.username,
            role: user.role,
            avatar: user.avatar, rolevip: 'notvip'
          };
        }
        if (topUserIds.has(user._id.toString()) || user.role === 'admin' || user.role === 'nhomdich') {
          userRoles[user._id.toString()] = {
            userId: user._id,
            username: user.username,
            role: user.role,
            avatar: user.avatar,
            rolevip: 'vip'
          };
        }
      });
      const baivietId = req.params.baivietId;
      const baiviet = await Baiviet.findById(baivietId).lean();
      if (!baiviet) {
        res.status(403).json({ message: 'bài viết không tồn tại' })
      }
      const cmt = await Promise.all(baiviet.comment.map(async (item) => {
        const usercmt = userRoles[item.userID.toString()];
        const formatdatecmt = moment(item.date).format('DD/MM/YYYY HH:mm:ss')
        return {
          _id: item._id,
          userId: item.userID,
          cmt: item.cmt,
          username: usercmt.username,
          avatar: usercmt.avatar || '',
          role: usercmt.role,
          rolevip: usercmt.rolevip,
          date: formatdatecmt
        };
      }))
      res.json(cmt);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Đã xảy ra lỗi khi lấy cmt bài viết' });
    }
  })
  
  router.post('/addfavoritebaiviet/:userId/:baivietId', async (req, res) => {
    try {
      const userId = req.params.userId;
      const baivietId = req.params.baivietId;
      const user = await User.findById(userId);
  
      if (!user) {
        res.status(403).json({ message: 'Không tìm thấy người dùng' });
      }
  
      const baivietIndex = user.favoriteBaiviet.findIndex(baiviet => baiviet.baivietId === baivietId);
  
      if (baivietIndex === -1) {
        user.favoriteBaiviet.push({ baivietId, isLiked: true });
      } else {
        user.favoriteBaiviet[baivietIndex].isLiked = true;
      }
      const vietnamTime = momenttimezone().add(7, 'hours').toDate();
      const baiviet = await Baiviet.findById(baivietId);
      if (baiviet) {
        baiviet.like += 1;
        await baiviet.save();
  
        if (baiviet.userId.toString() !== userId) {
          const notificationContentForPostOwner = `${user.username} đã thích bài viết của bạn: ${baiviet.content}`;
          const notificationForPostOwner = new NotificationBaiviet({
            title: 'Bài viết được thích',
            content: notificationContentForPostOwner,
            userId: baiviet.userId,
            baivietId: baivietId,
            date: vietnamTime,
            isRead: true
          });
  
          await notificationForPostOwner.save();
  
        }
      }
  
      await user.save();
  
      res.json({ message: 'Bài viết đã được yêu thích.' });
    } catch (err) {
      console.error('Lỗi khi thích bài viết:', err);
      res.status(500).json({ error: 'Đã xảy ra lỗi khi thích bài viết.' });
    }
  });

  router.post('/removefavoritebaiviet/:userId/:baivietId', async (req, res) => {
    try {
      const userId = req.params.userId;
      const baivietId = req.params.baivietId;
  
      const user = await User.findById(userId);
  
      if (!user) {
        return res.status(404).json({ message: 'Không tìm thấy người dùng.' });
      }
  
      if (!user.favoriteBaiviet.some(baiviet => baiviet.baivietId.toString() === baivietId)) {
        return res.status(400).json({ message: 'bài viết không tồn tại trong danh sách yêu thích.' });
      }
  
      user.favoriteBaiviet = user.favoriteBaiviet.filter(baiviet => baiviet.baivietId.toString() !== baivietId);
  
      await user.save();
  
      const baiviet = await Baiviet.findById(baivietId);
      if (baiviet) {
        baiviet.like -= 1;
        await baiviet.save();
      }
  
      res.json({ message: 'bài viết đã được xóa khỏi danh sách yêu thích.' });
    } catch (error) {
      console.error('Lỗi khi xóa bài viết yêu thích:', error);
      res.status(500).json({ error: 'Đã xảy ra lỗi khi xóa bài viết yêu thích.' });
    }
  })
  
  router.get('/notifybaiviet/:userId', async (req, res) => {
    try {
      const userID = req.params.userId
      const notify = await NotificationBaiviet.find({ userId: userID }).sort({ date: -1 }).lean()
      const formatnotify = notify.map((item) => {
        const formattedDate = moment(item.date).format('DD/MM/YYYY HH:mm:ss');
        return {
          _id: item._id,
          title: item.title,
          content: item.content,
          userId: item.userId,
          date: formattedDate,
          baivietId: item.baivietId
        }
      })
      res.json(formatnotify)
    } catch (error) {
      console.error('Lỗi khi tìm thông báo:', err);
      res.status(500).json({ error: 'Đã xảy ra lỗi khi tìm thông báo.' });
    }
  })
  
  router.get('/detailbaiviet/:baivietId/:userId', async (req, res) => {
    try {
      const userId = req.params.userId;
      const baivietId = req.params.baivietId;
      const user = await User.findById(userId)
      if (!baivietId) {
        return res.status(400).json({ message: 'Thiếu thông tin bài viết.' });
      }
      if (!user) {
        return res.status(404).json({ message: 'Không tìm thấy người dùng.' });
      }
      const baiviet = await Baiviet.findById(baivietId);
      if (!baiviet) {
        res.status(403).json({ message: 'bài viết không tồn tại' })
      }
      const topUsers = await Payment.aggregate([
        {
          $match: { success: 'thanh toán thành công' },
        },
        {
          $group: {
            _id: '$userID',
            totalAmount: { $sum: '$totalAmount' },
          },
        },
        {
          $sort: { totalAmount: -1 },
        },
        {
          $limit: 10,
        },
      ]);
  
      const extendedTopUsers = await Promise.all(
        topUsers.map(async (user) => {
          const userInfo = await User.findById(user._id).select('username role avatar');
  
          return {
            userID: user._id,
            username: userInfo.username,
            role: userInfo.role,
            avatar: userInfo.avatar || '',
            totalAmount: user.totalAmount,
            coin: user.totalAmount * 10,
            rolevip: 'vip'
          };
        })
      );
  
      const allUsers = await User.find();
  
      const topUserIds = new Set(extendedTopUsers.slice(0, 3).map(user => user.userID));
  
      // Tạo một đối tượng để lưu trữ thông tin role và rolevip của mỗi người dùng
      const userRoles = {};
  
      // Xử lý rolevip cho top users
      extendedTopUsers.forEach(user => {
        userRoles[user.userID.toString()] = {
          userId: user.userID,
          username: user.username,
          role: user.role,
          avatar: user.avatar,
          rolevip: 'vip'
        };
      });
  
      allUsers.forEach(user => {
        if (!topUserIds.has(user._id.toString()) && user.role !== 'admin' && user.role !== 'nhomdich') {
          userRoles[user._id.toString()] = {
            userId: user._id,
            username: user.username,
            role: user.role,
            avatar: user.avatar, rolevip: 'notvip'
          };
        }
        if (topUserIds.has(user._id.toString()) || user.role === 'admin' || user.role === 'nhomdich') {
          userRoles[user._id.toString()] = {
            userId: user._id,
            username: user.username,
            role: user.role,
            avatar: user.avatar,
            rolevip: 'vip'
          };
        }
      });
      const formattedDate = baiviet.date ? moment(baiviet.date).format('DD/MM/YYYY HH:mm:ss') : 'Ngày không xác định';
      const isLiked = user.favoriteBaiviet.some(favorite => favorite.baivietId.toString() === baivietId.toString());
      const cmt = await Promise.all(baiviet.comment.map(async (item) => {
        const userbaiviet = userRoles[item.userID.toString()];
        const formatdatecmt = item.date ? moment(item.date).format('DD/MM/YYYY HH:mm:ss') : 'Ngày không xác định'
        return {
          _id: item._id,
          userId: item.userID,
          cmt: item.cmt,
          username: userbaiviet.username,
          avatar: userbaiviet.avatar || '',
          rolevip: userbaiviet.rolevip,
          date: formatdatecmt
        };
      }))
      const userbv = userRoles[baiviet.userId.toString()];
      res.json({
        _id: baivietId,
        userId: userbv.userId,
        username: userbv.username,
        avatar: userbv.avatar || '',
        role: userbv.role,
        rolevip: userbv.rolevip,
        content: baiviet.content,
        images: baiviet.images,
        like: baiviet.like,
        isLiked: isLiked,
        date: formattedDate,
        comment: cmt,
        commentCount: baiviet.comment.length
      })
    } catch (error) {
      console.error('Lỗi khi tìm bài viết:', error);
      res.status(500).json({ error: 'Đã xảy ra lỗi khi tìm bài viết.' });
    }
  })
  
  router.post('/deletebaiviet/:baivietid/:userId', async (req, res) => {
    try {
      const baivietid = req.params.baivietid
      const userId = req.params.userId
      const baiviet = await Baiviet.findByIdAndDelete(baivietid)
      await NotificationBaiviet.deleteMany({ baivietId: baivietid })
      const user = await User.findById(userId)
      if (!user) {
        return res.status(404).json("không tìm thấy user")
      }
      const baivietIndex = user.baiviet.indexOf(baivietid);
      if (baivietIndex !== -1) {
        user.baiviet.splice(baivietIndex, 1);
        await user.save();
      }
      return res.status(200).json({ message: 'xóa bài viết thành công' })
    } catch (err) {
      console.error('lỗi xóa bài viết', err)
      res.status(500).json({ error: "lỗi xóa bài viết" })
    }
  })

  router.post('/deletebaiviet/:baivietid', async (req, res) => {
    try {
      const baivietid = req.params.baivietid
      const userId = req.session.userId
      const baiviet = await Baiviet.findByIdAndDelete(baivietid)
      await NotificationBaiviet.deleteMany({ baivietId: baivietid })
      const user = await User.findById(userId)
      if (!user) {
        return res.status(404).json("không tìm thấy user")
      }
      const baivietIndex = user.baiviet.indexOf(baivietid);
      if (baivietIndex !== -1) {
        user.baiviet.splice(baivietIndex, 1);
        await user.save();
      }
  
      if (user.role === 'nhomdich') {
        res.render("successnhomdich", { message: 'xóa bài viết thành công' })
      }
      else {
        res.render("successadmin", { message: 'xóa bài viết thành công' })
      }
    } catch (err) {
      console.error('lỗi xóa bài viết', err)
      res.status(500).json({ error: "lỗi xóa bài viết" })
    }
  })
  
  router.post('/postcmtbaiviet/:baivietId/:userId', async (req, res) => {
    try {
      const baivietId = req.params.baivietId;
      const userId = req.params.userId;
      const { comment } = req.body;
      const vietnamTime = momenttimezone().add(7, 'hours').toDate();
      const user = await User.findById(userId);
  
      if (!user) {
        res.status(403).json({ message: 'Không tìm thấy người dùng' });
      }
  
      const baiviet = await Baiviet.findById(baivietId);
  
      if (!baiviet) {
        res.status(404).json({ message: 'Không tìm thấy bài viết' });
      }
  
      const newComment = {
        userID: userId,
        cmt: comment,
        date: vietnamTime
      };
  
      baiviet.comment.push(newComment);
      await baiviet.save();
  
      if (baiviet.userId.toString() !== userId) {
        const notificationContentForPostOwner = `${user.username} đã bình luận bài viết:${baiviet.content} của bạn`;
        const notificationForPostOwner = new NotificationBaiviet({
          title: 'Bài viết có bình luận mới',
          content: notificationContentForPostOwner,
          userId: baiviet.userId,
          baivietId: baivietId,
          date: vietnamTime,
          isRead: true
        });
        await notificationForPostOwner.save();
      }
  
      res.status(200).json({ message: 'Đã thêm bình luận thành công' });
    } catch (error) {
      console.error('Lỗi khi post bình luận:', error);
      res.status(500).json({ error: 'Đã xảy ra lỗi khi post bình luận.' });
    }
  });

  router.post('/postcmtbaiviet/:baivietId', async (req, res) => {
    try {
      const baivietId = req.params.baivietId;
      const userId = req.session.userId;
      const { comment } = req.body;
      const vietnamTime = momenttimezone().add(7, 'hours').toDate();
      const user = await User.findById(userId);
  
      if (!user) {
        res.status(403).json({ message: 'Không tìm thấy người dùng' });
      }
  
      const baiviet = await Baiviet.findById(baivietId);
  
      if (!baiviet) {
        res.status(404).json({ message: 'Không tìm thấy bài viết' });
      }
  
      const newComment = {
        userID: userId,
        cmt: comment,
        date: vietnamTime
      };
  
      baiviet.comment.push(newComment);
      await baiviet.save();
  
      if (baiviet.userId.toString() !== userId) {
        const notificationContentForPostOwner = `${user.username} đã bình luận bài viết:${baiviet.content} của bạn`;
        const notificationForPostOwner = new NotificationBaiviet({
          title: 'Bài viết có bình luận mới',
          content: notificationContentForPostOwner,
          userId: baiviet.userId,
          baivietId: baivietId,
          date: vietnamTime,
          isRead: true,
        });
        await notificationForPostOwner.save();
      }
  
      res.json({ comment: newComment });
    } catch (error) {
      console.error('Lỗi khi post bình luận:', error);
      res.status(500).json({ error: 'Đã xảy ra lỗi khi post bình luận.' });
    }
  });

  router.post('/deletecmtbaiviet/:commentId/:baivietId/:userId', async (req, res) => {
    try {
      const commentId = req.params.commentId;
      const baivietId = req.params.baivietId;
      const userId = req.params.userId
  
      const user = await User.findById(userId)
      if (!user) {
        res.status(404).json({ message: 'không tìm thấy user' })
      }
  
      const baiviet = await Baiviet.findById(baivietId)
      if (!baiviet) {
        res.status(404).json({ message: 'không tìm thấy bài viết này' });
      }
  
      const commentToDelete = baiviet.comment.find((cmt) => cmt._id == commentId && cmt.userID == userId);
  
      if (!commentToDelete) {
        res.status(403).json({ message: 'Bạn không có quyền xóa comment này' });
        return;
      }
      const commentIndex = baiviet.comment.findIndex(cmt => cmt._id == commentId);
      if (commentIndex === -1) {
        return res.status(404).json({ message: 'Không tìm thấy comment với ID cung cấp' });
      }
  
      baiviet.comment.splice(commentIndex, 1); // Xóa comment từ mảng
  
      // Lưu lại thay đổi vào cơ sở dữ liệu
      await baiviet.save();
  
  
      res.status(200).json({ message: 'Xóa comment thành công' });
    } catch (error) {
      console.error('Lỗi khi xóa comment:', error);
      res.status(500).json({ error: 'Đã xảy ra lỗi khi xóa comment.' });
    }
  });

  router.post('/report/:baivietId/:userId', async (req, res) => {
    try {
      const { reason } = req.body
      const baivietId = req.params.baivietId;
      const userId = req.params.userId
  
      const user = await User.findById(userId)
      if (!user) {
        res.status(404).json({ message: 'không tìm thấy user' })
      }
  
      const baiviet = await Baiviet.findById(baivietId)
      if (!baiviet) {
        res.status(404).json({ message: 'không tìm thấy bài viết này' });
      }
      const userbaiviet = await User.findById(baiviet.userId);
      if (!userbaiviet) {
        res.status(404).json({ message: 'không tìm thấy user' })
      }
      const notification = new Notification({
        adminId: '653a20c611295a22062661f9',
        title: 'Report',
        content: `${user.username} đã report bài viết ${baiviet.content} của ${userbaiviet.username} lí do: ${reason} `,
        userId: userId,
        mangaId: baiviet._id
      });
      await notification.save()
      res.status(200).json({ message: 'report bài viết thành công' })
  
    } catch (error) {
      console.error('Lỗi report bài viết:', error);
      res.status(500).json({ error: 'Đã xảy ra lỗi report bài viết' });
    }
  })

  router.post('/reportbaiviet/:baivietId', async (req, res) => {
    try {
      const baivietId = req.params.baivietId;
      const userId = req.session.userId
      const vietnamTime = momenttimezone().add(7, 'hours').toDate();
      const user = await User.findById(userId)
      if (!user) {
        res.status(404).json({ message: 'không tìm thấy user' })
      }
  
      const baiviet = await Baiviet.findByIdAndDelete(baivietId)
      if (!baiviet) {
        res.status(404).json({ message: 'không tìm thấy bài viết này' });
      }
      await NotificationBaiviet.deleteMany({ baivietId: baivietId });
      await Notification.deleteMany({ mangaId: baivietId });
      const baivietIndex = user.baiviet.indexOf(baivietId);
      if (baivietIndex !== -1) {
        user.baiviet.splice(baivietIndex, 1);
        await user.save();
      }
      const notification = new NotificationBaiviet({
        title: 'Report',
        content: `bài viết ${baiviet.content} của bạn đã bị xóa do vi phạm tiêu chuẩn cộng đồng`,
        userId: baiviet.userId,
        baivietId: baivietId,
        date: vietnamTime,
      });
      await notification.save()
      res.render("successadmin", { message: 'report bài viết thành công' })
  
    } catch (error) {
      console.error('Lỗi report bài viết:', error);
      res.status(500).json({ error: 'Đã xảy ra lỗi report bài viết' });
    }
  })

  router.get('/baivietreport/:baivietId', async (req, res) => {
    try {
      const baivietId = req.params.baivietId;
      const baiviet = await Baiviet.findById(baivietId)
      if (!baiviet) {
        res.status(404).json({ message: 'không tìm thấy bài viết này' });
      }
      const user = await User.findById(baiviet.userId);
      if (!user) {
        res.status(404).json({ message: 'không tìm thấy user' });
      }
      const formattedDate = moment(baiviet.date).format('DD/MM/YYYY HH:mm:ss');
      const formatdata = {
        avatar: user.avatar || '',
        username: user.username,
        content: baiviet.content,
        date: formattedDate,
        images: baiviet.images || ''
      }
      res.json(formatdata)
    } catch (error) {
      console.error('Lỗi khi tìm bài viết:', error);
      res.status(500).json({ error: 'Đã xảy ra lỗi khi tìm bài viết.' });
    }
  })

  router.post('/deletenotifybaiviet/:_id', async (req, res) => {
    try {
      const id = req.params._id;
      const notify = await Notification.findByIdAndDelete(id);
      if (!notify) {
        res.status(403).json({ message: 'không tìm thấy thông báo' })
      }
      res.render('successadmin', { message: 'xóa thông báo thành công' })
    } catch (error) {
      console.error('Lỗi xóa thông báo:', error);
      res.status(500).json({ error: 'Đã xảy ra lỗi xóa thông báo' });
    }
  })

  module.exports=router;