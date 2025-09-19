const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const statsController = require('../controllers/statsController');
const { authenticate, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// 获取用户统计
router.get('/user',
  authenticate,
  asyncHandler(statsController.getUserStats)
);

// 获取全局统计
router.get('/global',
  optionalAuth,
  asyncHandler(statsController.getGlobalStats)
);

// 获取排行榜
router.get('/leaderboard',
  optionalAuth,
  asyncHandler(statsController.getLeaderboard)
);

// 获取学习进度
router.get('/progress',
  authenticate,
  asyncHandler(statsController.getLearningProgress)
);

// 获取学习报告
router.get('/report',
  authenticate,
  asyncHandler(statsController.getLearningReport)
);

module.exports = router;

