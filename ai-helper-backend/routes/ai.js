const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const aiController = require('../controllers/aiController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// 生成AI回复
router.post('/chat',
  authenticate,
  asyncHandler(aiController.generateResponse)
);

// 获取AI建议
router.get('/suggestions',
  authenticate,
  asyncHandler(aiController.getSuggestions)
);

// 获取学习内容
router.get('/learning-content',
  authenticate,
  asyncHandler(aiController.getLearningContent)
);

// 评估用户输入
router.post('/evaluate',
  authenticate,
  asyncHandler(aiController.evaluateInput)
);

// 获取AI配置
router.get('/config',
  authenticate,
  asyncHandler(aiController.getAIConfig)
);

module.exports = router;

