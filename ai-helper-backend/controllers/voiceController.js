const voiceService = require('../services/voiceService');
const aiService = require('../services/aiService');
const { logger } = require('../utils/logger');
const { AppError } = require('../middleware/errorHandler');

class VoiceController {
  // 语音识别
  async speechToText(req, res, next) {
    try {
      if (!req.file) {
        throw new AppError('请上传音频文件', 400, 'NO_AUDIO_FILE');
      }

      const { age, difficulty, personality } = req.body;
      const options = {
        format: req.file.mimetype.includes('mp3') ? 'mp3' : 'wav',
        rate: 16000,
        channel: 1,
        age: parseInt(age) || 6,
        difficulty: difficulty || 'easy',
        personality: personality || 'friendly'
      };

      logger.info('开始语音识别', {
        userId: req.user.id,
        filename: req.file.filename,
        size: req.file.size,
        options
      });

      // 调用语音识别服务
      const result = await voiceService.speechToText(req.file.buffer, options);

      if (!result.success) {
        throw new AppError('语音识别失败', 500, 'SPEECH_RECOGNITION_FAILED');
      }

      logger.info('语音识别成功', {
        userId: req.user.id,
        recognizedText: result.text,
        confidence: result.confidence
      });

      res.json({
        success: true,
        data: {
          text: result.text,
          confidence: result.confidence,
          duration: req.file.size / 16000 // 估算时长
        }
      });

    } catch (error) {
      logger.error('语音识别控制器错误:', error);
      next(error);
    }
  }

  // 语音合成
  async textToSpeech(req, res, next) {
    try {
      const { text, age, difficulty, personality } = req.body;

      if (!text) {
        throw new AppError('请输入要合成的文本', 400, 'NO_TEXT');
      }

      const userSettings = {
        childAge: parseInt(age) || 6,
        difficulty: difficulty || 'easy',
        aiPersonality: personality || 'friendly'
      };

      // 获取语音参数
      const voiceParams = voiceService.getVoiceParams(
        userSettings.childAge,
        userSettings.aiPersonality
      );

      logger.info('开始语音合成', {
        userId: req.user?.id,
        text: text.substring(0, 100),
        voiceParams
      });

      // 调用语音合成服务
      const result = await voiceService.textToSpeech(text, voiceParams);

      if (!result.success) {
        throw new AppError('语音合成失败', 500, 'SPEECH_SYNTHESIS_FAILED');
      }

      // 保存音频文件
      const filename = `tts-${Date.now()}.${result.format}`;
      const saveResult = await voiceService.saveAudioFile(result.audioBuffer, filename);

      if (!saveResult.success) {
        throw new AppError('音频文件保存失败', 500, 'AUDIO_SAVE_FAILED');
      }

      logger.info('语音合成成功', {
        userId: req.user?.id,
        filename: saveResult.filename
      });

      res.json({
        success: true,
        data: {
          audioUrl: `/uploads/${filename}`,
          filename: saveResult.filename,
          format: result.format,
          size: result.audioBuffer.length
        }
      });

    } catch (error) {
      logger.error('语音合成控制器错误:', error);
      next(error);
    }
  }

  // 语音对话处理
  async voiceChat(req, res, next) {
    try {
      if (!req.file) {
        throw new AppError('请上传音频文件', 400, 'NO_AUDIO_FILE');
      }

      const { sessionId, age, difficulty, personality } = req.body;
      const userSettings = {
        childAge: parseInt(age) || 6,
        difficulty: difficulty || 'easy',
        aiPersonality: personality || 'friendly'
      };

      logger.info('开始语音对话处理', {
        userId: req.user.id,
        sessionId,
        userSettings,
        filename: req.file.filename
      });

      // 1. 语音识别
      const recognitionOptions = {
        format: req.file.mimetype.includes('mp3') ? 'mp3' : 'wav',
        rate: 16000,
        channel: 1
      };

      const recognitionResult = await voiceService.speechToText(
        req.file.buffer, 
        recognitionOptions
      );

      if (!recognitionResult.success) {
        throw new AppError('语音识别失败', 500, 'SPEECH_RECOGNITION_FAILED');
      }

      const userInput = recognitionResult.text;
      logger.info('语音识别完成', {
        userId: req.user.id,
        recognizedText: userInput
      });

      // 2. 生成AI回复
      const aiResult = await aiService.generateResponse(
        userInput,
        userSettings,
        [] // 这里应该传入对话历史
      );

      if (!aiResult.success) {
        logger.warn('AI回复生成失败，使用备用回复', {
          userId: req.user.id,
          error: aiResult.error
        });
      }

      const aiResponse = aiResult.success ? aiResult : aiResult.fallback;

      // 3. 语音合成AI回复
      const voiceParams = voiceService.getVoiceParams(
        userSettings.childAge,
        userSettings.aiPersonality
      );

      const ttsResult = await voiceService.textToSpeech(
        aiResponse.english,
        voiceParams
      );

      let audioUrl = null;
      if (ttsResult.success) {
        const filename = `chat-${Date.now()}.${ttsResult.format}`;
        const saveResult = await voiceService.saveAudioFile(
          ttsResult.audioBuffer,
          filename
        );
        
        if (saveResult.success) {
          audioUrl = `/uploads/${filename}`;
        }
      }

      logger.info('语音对话处理完成', {
        userId: req.user.id,
        userInput,
        aiResponse: aiResponse.english,
        hasAudio: !!audioUrl
      });

      res.json({
        success: true,
        data: {
          userInput,
          aiResponse: {
            english: aiResponse.english,
            chinese: aiResponse.chinese,
            tip: aiResponse.tip,
            encouragement: aiResponse.encouragement,
            audioUrl
          },
          sessionId,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      logger.error('语音对话控制器错误:', error);
      next(error);
    }
  }

  // 获取语音参数配置
  async getVoiceConfig(req, res, next) {
    try {
      const { age, personality } = req.query;
      
      const voiceParams = voiceService.getVoiceParams(
        parseInt(age) || 6,
        personality || 'friendly'
      );

      res.json({
        success: true,
        data: {
          voiceParams,
          supportedFormats: ['mp3', 'wav', 'ogg'],
          maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024,
          sampleRate: 16000
        }
      });

    } catch (error) {
      logger.error('获取语音配置错误:', error);
      next(error);
    }
  }

  // 测试语音服务
  async testVoiceService(req, res, next) {
    try {
      const testResults = {
        speechRecognition: false,
        textToSpeech: false,
        overall: false
      };

      // 测试语音识别
      try {
        const mockAudioBuffer = Buffer.from('mock_audio_data');
        const recognitionResult = await voiceService.speechToText(mockAudioBuffer);
        testResults.speechRecognition = recognitionResult.success;
      } catch (error) {
        logger.warn('语音识别测试失败:', error.message);
      }

      // 测试语音合成
      try {
        const ttsResult = await voiceService.textToSpeech('Hello, this is a test.');
        testResults.textToSpeech = ttsResult.success;
      } catch (error) {
        logger.warn('语音合成测试失败:', error.message);
      }

      testResults.overall = testResults.speechRecognition && testResults.textToSpeech;

      logger.info('语音服务测试结果:', testResults);

      res.json({
        success: true,
        data: testResults
      });

    } catch (error) {
      logger.error('语音服务测试错误:', error);
      next(error);
    }
  }
}

module.exports = new VoiceController();
