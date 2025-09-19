const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const userController = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// 获取用户信息
router.get('/profile',
  authenticate,
  asyncHandler(userController.getProfile)
);

// 更新用户信息
router.put('/profile',
  authenticate,
  asyncHandler(userController.updateProfile)
);

// 更新学习设置
router.put('/settings',
  authenticate,
  asyncHandler(userController.updateSettings)
);

// 获取学习统计
router.get('/stats',
  authenticate,
  asyncHandler(userController.getStats)
);

// 添加学习分数
router.post('/score',
  authenticate,
  asyncHandler(userController.addScore)
);

// 获取成就列表
router.get('/achievements',
  authenticate,
  asyncHandler(userController.getAchievements)
);

// 解锁成就
router.post('/achievements/:achievementId',
  authenticate,
  asyncHandler(userController.unlockAchievement)
);

// 获取学习历史
router.get('/history',
  authenticate,
  asyncHandler(userController.getLearningHistory)
);

module.exports = router;
