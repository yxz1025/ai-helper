# API配置指南

## 🔧 语音识别API配置

### 1. 百度语音识别
```javascript
const baiduConfig = {
  url: 'https://vop.baidu.com/server_api',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  params: {
    format: 'mp3',
    rate: 16000,
    channel: 1,
    cuid: 'your_device_id',
    token: 'your_access_token'
  }
};
```

### 2. 讯飞语音识别
```javascript
const xunfeiConfig = {
  url: 'https://iat-api.xfyun.cn/v2/iat',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Appid': 'your_app_id',
    'X-CurTime': 'timestamp',
    'X-Param': 'encoded_params',
    'X-CheckSum': 'md5_checksum'
  }
};
```

### 3. 腾讯云语音识别
```javascript
const tencentConfig = {
  url: 'https://asr.tencentcloudapi.com/',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'your_auth_header',
    'X-TC-Action': 'SentenceRecognition',
    'X-TC-Version': '2018-05-22'
  }
};
```

## 🤖 AI对话API配置

### 1. OpenAI GPT
```javascript
const openaiConfig = {
  url: 'https://api.openai.com/v1/chat/completions',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_OPENAI_API_KEY'
  },
  data: {
    model: 'gpt-3.5-turbo',
    messages: [
      {
        role: 'system',
        content: '你是一位专为5-10岁中国儿童设计的AI英语老师...'
      },
      {
        role: 'user',
        content: '孩子刚才说：Hello'
      }
    ],
    temperature: 0.7,
    max_tokens: 200
  }
};
```

### 2. 百度文心一言
```javascript
const wenxinConfig = {
  url: 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions_pro',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_WENXIN_ACCESS_TOKEN'
  },
  data: {
    messages: [
      {
        role: 'user',
        content: '你是一位专为5-10岁中国儿童设计的AI英语老师...'
      }
    ],
    temperature: 0.7,
    top_p: 0.8
  }
};
```

### 3. 阿里通义千问
```javascript
const tongyiConfig = {
  url: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TONGYI_API_KEY'
  },
  data: {
    model: 'qwen-turbo',
    input: {
      messages: [
        {
          role: 'user',
          content: '你是一位专为5-10岁中国儿童设计的AI英语老师...'
        }
      ]
    },
    parameters: {
      temperature: 0.7,
      max_tokens: 200
    }
  }
};
```

## 🔊 语音合成API配置

### 1. 百度语音合成
```javascript
const baiduTTSConfig = {
  url: 'https://tsn.baidu.com/text2audio',
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded'
  },
  params: {
    tex: 'Hello! Welcome to our English class!',
    tok: 'your_access_token',
    cuid: 'your_device_id',
    ctp: 1,
    lan: 'en',
    spd: 5,    // 语速 0-15
    pit: 5,    // 音调 0-15
    vol: 5,    // 音量 0-15
    per: 0     // 发音人 0-4
  }
};
```

### 2. 讯飞语音合成
```javascript
const xunfeiTTSConfig = {
  url: 'https://tts-api.xfyun.cn/v2/tts',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Appid': 'your_app_id',
    'X-CurTime': 'timestamp',
    'X-Param': 'encoded_params',
    'X-CheckSum': 'md5_checksum'
  },
  data: {
    common: {
      app_id: 'your_app_id'
    },
    business: {
      aue: 'raw',
      auf: 'audio/L16;rate=16000',
      vcn: 'xiaoyan',  // 发音人
      speed: 50,       // 语速 0-100
      volume: 50,      // 音量 0-100
      pitch: 50,       // 音调 0-100
      bgs: 0
    },
    data: {
      status: 2,
      text: 'SGVsbG8hIFdlbGNvbWUgdG8gb3VyIEVuZ2xpc2ggY2xhc3Mh' // base64编码
    }
  }
};
```

### 3. 腾讯云语音合成
```javascript
const tencentTTSConfig = {
  url: 'https://tts.tencentcloudapi.com/',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'your_auth_header',
    'X-TC-Action': 'TextToVoice',
    'X-TC-Version': '2018-05-22'
  },
  data: {
    Text: 'Hello! Welcome to our English class!',
    SessionId: 'session_id',
    ModelType: 1,        // 模型类型
    VoiceType: 101001,   // 音色ID
    Volume: 0.5,         // 音量
    Speed: 0.5,          // 语速
    Emotion: 'normal'    // 情感
  }
};
```

## 🛠️ 实际配置示例

### 在aiVoiceService.js中配置真实API

```javascript
// 替换模拟方法为真实API调用
async speechToText(audioData) {
  try {
    const response = await wx.request({
      url: 'https://your-speech-api.com/recognize',
      method: 'POST',
      header: {
        'Content-Type': 'audio/mp3',
        'Authorization': 'Bearer YOUR_API_KEY'
      },
      data: audioData
    });
    
    if (response.statusCode === 200) {
      return {
        success: true,
        text: response.data.result[0],
        confidence: response.data.result[1]
      };
    } else {
      throw new Error('语音识别API调用失败');
    }
  } catch (error) {
    console.error('语音识别失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

async callAIAPI(prompt) {
  try {
    const response = await wx.request({
      url: 'https://api.openai.com/v1/chat/completions',
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_OPENAI_API_KEY'
      },
      data: {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: '你是一位专为5-10岁中国儿童设计的AI英语老师。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 200
      }
    });
    
    if (response.statusCode === 200) {
      return response.data.choices[0].message.content;
    } else {
      throw new Error('AI API调用失败');
    }
  } catch (error) {
    console.error('AI API调用失败:', error);
    throw error;
  }
}

async textToSpeech(text) {
  try {
    const response = await wx.request({
      url: 'https://your-tts-api.com/synthesize',
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_TTS_API_KEY'
      },
      data: {
        text: text,
        voice: 'child_friendly_female',
        speed: 0.9,
        pitch: 1.1,
        format: 'mp3'
      }
    });
    
    if (response.statusCode === 200) {
      return {
        success: true,
        audioUrl: response.data.audio_url
      };
    } else {
      throw new Error('语音合成API调用失败');
    }
  } catch (error) {
    console.error('语音合成失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
}
```

## 🔐 API密钥管理

### 1. 环境变量配置
```javascript
// 在项目根目录创建 .env 文件
OPENAI_API_KEY=your_openai_api_key
BAIDU_SPEECH_API_KEY=your_baidu_speech_api_key
TTS_API_KEY=your_tts_api_key
```

### 2. 配置文件管理
```javascript
// config/api_keys.js
const API_KEYS = {
  OPENAI: 'your_openai_api_key',
  BAIDU_SPEECH: 'your_baidu_speech_api_key',
  TTS: 'your_tts_api_key'
};

module.exports = API_KEYS;
```

### 3. 安全注意事项
- 不要在客户端代码中直接暴露API密钥
- 使用服务器端代理API调用
- 实施API调用频率限制
- 监控API使用量和成本

## 📊 性能优化建议

### 1. 缓存策略
```javascript
// 缓存常用回复
const responseCache = new Map();

async function getCachedResponse(prompt) {
  const cacheKey = generateCacheKey(prompt);
  if (responseCache.has(cacheKey)) {
    return responseCache.get(cacheKey);
  }
  
  const response = await callAIAPI(prompt);
  responseCache.set(cacheKey, response);
  return response;
}
```

### 2. 并发控制
```javascript
// 限制并发API调用数量
const semaphore = new Semaphore(3); // 最多3个并发请求

async function limitedAPICall(apiCall) {
  await semaphore.acquire();
  try {
    return await apiCall();
  } finally {
    semaphore.release();
  }
}
```

### 3. 错误重试机制
```javascript
async function retryAPICall(apiCall, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await apiCall();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}
```

## 🧪 测试和调试

### 1. API测试工具
```javascript
// 测试语音识别API
async function testSpeechAPI() {
  const testAudio = 'path/to/test/audio.mp3';
  const result = await speechToText(testAudio);
  console.log('语音识别测试结果:', result);
}

// 测试AI对话API
async function testAIAPI() {
  const testPrompt = '你是一位专为5-10岁中国儿童设计的AI英语老师...';
  const result = await callAIAPI(testPrompt);
  console.log('AI对话测试结果:', result);
}

// 测试语音合成API
async function testTTSAPI() {
  const testText = 'Hello! Welcome to our English class!';
  const result = await textToSpeech(testText);
  console.log('语音合成测试结果:', result);
}
```

### 2. 性能监控
```javascript
// 监控API响应时间
function monitorAPIPerformance(apiName, apiCall) {
  const startTime = Date.now();
  return apiCall().then(result => {
    const endTime = Date.now();
    console.log(`${apiName} 响应时间: ${endTime - startTime}ms`);
    return result;
  });
}
```

---

**配置完成后，您的AI英语小助教就能使用真实的语音识别、AI对话生成和语音合成功能了！** 🚀
