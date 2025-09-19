const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const authController = require('../controllers/authController');
const { wechatLogin } = require('../middleware/auth');

const router = express.Router();

// 微信小程序登录
router.post('/wechat-login', 
  wechatLogin,
  asyncHandler(authController.wechatLogin)
);

// 刷新令牌
router.post('/refresh-token',
  asyncHandler(authController.refreshToken)
);

// 登出
router.post('/logout',
  asyncHandler(authController.logout)
);

// 验证令牌
router.get('/verify-token',
  asyncHandler(authController.verifyToken)
);

module.exports = router;
