const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const chatController = require('../controllers/chatController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// 创建新的聊天会话
router.post('/sessions',
  authenticate,
  asyncHandler(chatController.createSession)
);

// 获取聊天会话列表
router.get('/sessions',
  authenticate,
  asyncHandler(chatController.getSessions)
);

// 获取特定聊天会话
router.get('/sessions/:sessionId',
  authenticate,
  asyncHandler(chatController.getSession)
);

// 更新聊天会话
router.put('/sessions/:sessionId',
  authenticate,
  asyncHandler(chatController.updateSession)
);

// 结束聊天会话
router.delete('/sessions/:sessionId',
  authenticate,
  asyncHandler(chatController.endSession)
);

// 发送消息到聊天会话
router.post('/sessions/:sessionId/messages',
  authenticate,
  asyncHandler(chatController.sendMessage)
);

// 获取聊天会话的消息
router.get('/sessions/:sessionId/messages',
  authenticate,
  asyncHandler(chatController.getMessages)
);

// 获取活跃的聊天会话
router.get('/active-session',
  authenticate,
  asyncHandler(chatController.getActiveSession)
);

module.exports = router;

