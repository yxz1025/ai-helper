const express = require('express');
const multer = require('multer');
const path = require('path');
const { asyncHandler } = require('../middleware/errorHandler');
const voiceController = require('../controllers/voiceController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// 配置multer用于文件上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = process.env.UPLOAD_DIR || 'uploads';
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `voice-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('不支持的文件类型'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // 10MB
  },
  fileFilter: fileFilter
});

// 语音识别路由
router.post('/recognize', 
  authenticate,
  upload.single('audio'),
  asyncHandler(voiceController.speechToText)
);

// 语音合成路由
router.post('/synthesize',
  authenticate,
  asyncHandler(voiceController.textToSpeech)
);

// 语音对话处理路由
router.post('/chat',
  authenticate,
  upload.single('audio'),
  asyncHandler(voiceController.voiceChat)
);

// 获取语音参数配置
router.get('/config',
  authenticate,
  asyncHandler(voiceController.getVoiceConfig)
);

// 测试语音服务
router.post('/test',
  asyncHandler(voiceController.testVoiceService)
);

module.exports = router;
