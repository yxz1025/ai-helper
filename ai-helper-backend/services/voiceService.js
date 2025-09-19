const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const { logger } = require('../utils/logger');

class VoiceService {
  constructor() {
    this.baiduConfig = {
      appId: process.env.BAIDU_APP_ID,
      apiKey: process.env.BAIDU_API_KEY,
      secretKey: process.env.BAIDU_SECRET_KEY,
      accessToken: null,
      tokenExpiresAt: null
    };
    
    this.xunfeiConfig = {
      appId: process.env.XUNFEI_APP_ID,
      apiKey: process.env.XUNFEI_API_KEY,
      apiSecret: process.env.XUNFEI_API_SECRET
    };
  }

  // 获取百度访问令牌
  async getBaiduAccessToken() {
    try {
      // 如果token存在且未过期，直接返回
      if (this.baiduConfig.accessToken && this.baiduConfig.tokenExpiresAt > Date.now()) {
        return this.baiduConfig.accessToken;
      }

      const response = await axios.post('https://aip.baidubce.com/oauth/2.0/token', null, {
        params: {
          grant_type: 'client_credentials',
          client_id: this.baiduConfig.apiKey,
          client_secret: this.baiduConfig.secretKey
        }
      });

      this.baiduConfig.accessToken = response.data.access_token;
      this.baiduConfig.tokenExpiresAt = Date.now() + (response.data.expires_in - 60) * 1000;

      return this.baiduConfig.accessToken;
    } catch (error) {
      logger.error('获取百度访问令牌失败:', error);
      throw new Error('语音识别服务初始化失败');
    }
  }

  // 语音识别 - 百度API
  async speechToText(audioBuffer, options = {}) {
    try {
      const accessToken = await this.getBaiduAccessToken();
      
      const formData = new FormData();
      formData.append('format', options.format || 'mp3');
      formData.append('rate', options.rate || 16000);
      formData.append('channel', options.channel || 1);
      formData.append('cuid', options.cuid || 'ai-helper-backend');
      formData.append('token', accessToken);
      formData.append('speech', audioBuffer);
      formData.append('len', audioBuffer.length);

      const response = await axios.post(
        'https://vop.baidu.com/server_api',
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      if (response.data.err_no === 0) {
        const result = response.data.result[0];
        return {
          success: true,
          text: result,
          confidence: response.data.sn ? 0.9 : 0.8
        };
      } else {
        throw new Error(`语音识别失败: ${response.data.err_msg}`);
      }
    } catch (error) {
      logger.error('百度语音识别失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 语音识别 - 讯飞API
  async speechToTextXunfei(audioBuffer, options = {}) {
    try {
      // 生成认证信息
      const apiKey = this.xunfeiConfig.apiKey;
      const apiSecret = this.xunfeiConfig.apiSecret;
      const appId = this.xunfeiConfig.appId;
      
      // 这里需要实现讯飞的WebSocket连接
      // 由于讯飞使用WebSocket协议，这里提供一个简化的实现
      
      // 暂时返回模拟结果
      return {
        success: true,
        text: this.getMockRecognitionResult(),
        confidence: 0.85
      };
    } catch (error) {
      logger.error('讯飞语音识别失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 文本转语音 - 百度API
  async textToSpeech(text, options = {}) {
    try {
      const accessToken = await this.getBaiduAccessToken();
      
      const params = {
        tex: text,
        tok: accessToken,
        cuid: options.cuid || 'ai-helper-backend',
        ctp: 1,
        lan: options.lan || 'en',
        spd: options.speed || 5,    // 语速 0-15
        pit: options.pitch || 5,    // 音调 0-15
        vol: options.volume || 5,   // 音量 0-15
        per: options.voice || 0     // 发音人 0-4
      };

      const response = await axios.post(
        'https://tsn.baidu.com/text2audio',
        params,
        {
          responseType: 'arraybuffer',
          timeout: 10000
        }
      );

      // 检查响应是否为音频数据
      const contentType = response.headers['content-type'];
      if (contentType && contentType.includes('audio')) {
        return {
          success: true,
          audioBuffer: response.data,
          format: 'mp3'
        };
      } else {
        // 响应可能是错误信息
        const errorText = response.data.toString();
        throw new Error(`语音合成失败: ${errorText}`);
      }
    } catch (error) {
      logger.error('百度语音合成失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 文本转语音 - 讯飞API
  async textToSpeechXunfei(text, options = {}) {
    try {
      // 讯飞TTS实现
      // 这里需要实现讯飞的WebSocket连接
      
      // 暂时返回模拟结果
      return {
        success: true,
        audioBuffer: Buffer.from('mock_audio_data'),
        format: 'mp3'
      };
    } catch (error) {
      logger.error('讯飞语音合成失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 根据年龄和性格获取语音参数
  getVoiceParams(age, personality) {
    const baseParams = {
      lan: 'en',
      speed: 5,
      pitch: 5,
      volume: 5,
      voice: 0
    };

    // 根据年龄调整参数
    if (age >= 5 && age <= 7) {
      baseParams.speed = 4;  // 较慢语速
      baseParams.pitch = 6;  // 稍高音调
      baseParams.voice = 0;  // 女声
    } else if (age >= 8 && age <= 10) {
      baseParams.speed = 5;  // 正常语速
      baseParams.pitch = 5;  // 正常音调
      baseParams.voice = 1;  // 男声
    }

    // 根据AI性格调整参数
    switch (personality) {
      case 'friendly':
        baseParams.speed = baseParams.speed - 1;
        baseParams.pitch = baseParams.pitch + 1;
        break;
      case 'encouraging':
        baseParams.volume = 6;
        baseParams.pitch = baseParams.pitch + 2;
        break;
      case 'playful':
        baseParams.speed = baseParams.speed + 1;
        baseParams.pitch = baseParams.pitch + 2;
        break;
      case 'patient':
        baseParams.speed = baseParams.speed - 1;
        baseParams.volume = 4;
        break;
    }

    return baseParams;
  }

  // 处理语音文件
  async processAudioFile(filePath, options = {}) {
    try {
      const audioBuffer = fs.readFileSync(filePath);
      return await this.speechToText(audioBuffer, options);
    } catch (error) {
      logger.error('处理音频文件失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 保存音频文件
  async saveAudioFile(audioBuffer, filename) {
    try {
      const uploadDir = process.env.UPLOAD_DIR || 'uploads';
      const filePath = path.join(uploadDir, filename);
      
      // 确保目录存在
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      fs.writeFileSync(filePath, audioBuffer);
      return {
        success: true,
        filePath,
        filename
      };
    } catch (error) {
      logger.error('保存音频文件失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 获取模拟识别结果（用于测试）
  getMockRecognitionResult() {
    const mockResults = [
      'Hello!',
      'How are you?',
      'What\'s your name?',
      'I\'m fine, thank you!',
      'Nice to meet you!',
      'Good morning!',
      'Good afternoon!',
      'Good evening!',
      'Thank you very much!',
      'You\'re welcome!',
      'What color is this?',
      'I like apples!',
      'Can you help me?',
      'I love learning English!',
      'This is a cat!'
    ];
    
    return mockResults[Math.floor(Math.random() * mockResults.length)];
  }

  // 生成模拟音频数据（用于测试）
  generateMockAudio(text) {
    // 生成简单的音频数据模拟
    const mockAudioData = Buffer.from(`mock_audio_${text}_${Date.now()}`);
    return mockAudioData;
  }
}

module.exports = new VoiceService();
