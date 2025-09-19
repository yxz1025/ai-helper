const axios = require('axios');
const { logger } = require('../utils/logger');

class AIService {
  constructor() {
    this.openaiConfig = {
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'
    };
    
    this.baiduConfig = {
      apiKey: process.env.BAIDU_API_KEY,
      secretKey: process.env.BAIDU_SECRET_KEY,
      accessToken: null,
      tokenExpiresAt: null
    };
  }

  // 构建AI对话prompt
  buildPrompt(userInput, userSettings, conversationHistory = []) {
    const { childAge, difficulty, aiPersonality } = userSettings;
    
    let systemPrompt = `你是一位专为5-10岁中国儿童设计的AI英语老师。你的任务是理解儿童的英语发音并生成温暖友好的回复。

## 当前对话信息
- 孩子年龄：${childAge}岁
- 学习难度：${this.getDifficultyText(difficulty)}
- AI性格：${this.getPersonalityText(aiPersonality)}
- 孩子刚才说：${userInput}

## 回复要求
1. 准确理解孩子的英语表达，即使发音不标准也要耐心识别
2. 根据年龄调整语言复杂度（5-7岁用简单词汇，8-10岁用中等复杂度）
3. 回复要温暖、鼓励、充满耐心
4. 包含学习建议和积极反馈

## 回复格式
请严格按照以下格式回复，用"|"分隔：

英语回复|中文翻译|学习提示|鼓励话语

## 示例回复
Hello! You speak English very well! 🌟|你好！你的英语说得很好！|记住要大声说出来哦！|Keep going! You're doing great!

## 注意事项
- 如果听不懂，温和地询问并鼓励重试
- 发音错误时先鼓励再纠正
- 学习困难时给予支持和建议
- 表现优秀时真诚赞美
- 保持积极正面的语调
- 适合儿童的内容，避免复杂概念`;

    // 添加对话历史上下文
    if (conversationHistory.length > 0) {
      systemPrompt += '\n\n## 对话历史\n';
      conversationHistory.slice(-5).forEach(msg => {
        if (msg.type === 'user') {
          systemPrompt += `用户: ${msg.text}\n`;
        } else if (msg.type === 'ai') {
          systemPrompt += `AI: ${msg.text}\n`;
        }
      });
    }

    systemPrompt += '\n\n请现在回复：';

    return systemPrompt;
  }

  // 调用OpenAI API
  async callOpenAI(prompt, options = {}) {
    try {
      const response = await axios.post(
        `${this.openaiConfig.baseURL}/chat/completions`,
        {
          model: options.model || 'gpt-3.5-turbo',
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
          temperature: options.temperature || 0.7,
          max_tokens: options.max_tokens || 200,
          top_p: options.top_p || 0.9
        },
        {
          headers: {
            'Authorization': `Bearer ${this.openaiConfig.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 15000
        }
      );

      if (response.data.choices && response.data.choices.length > 0) {
        return {
          success: true,
          text: response.data.choices[0].message.content.trim()
        };
      } else {
        throw new Error('OpenAI API返回格式错误');
      }
    } catch (error) {
      logger.error('OpenAI API调用失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 调用百度文心一言API
  async callBaiduWenxin(prompt, options = {}) {
    try {
      // 获取访问令牌
      const accessToken = await this.getBaiduAccessToken();
      
      const response = await axios.post(
        'https://aip.baidu.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions_pro',
        {
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: options.temperature || 0.7,
          top_p: options.top_p || 0.8
        },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          params: {
            access_token: accessToken
          },
          timeout: 15000
        }
      );

      if (response.data.result) {
        return {
          success: true,
          text: response.data.result.trim()
        };
      } else {
        throw new Error('百度文心一言API返回格式错误');
      }
    } catch (error) {
      logger.error('百度文心一言API调用失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
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
      throw new Error('AI服务初始化失败');
    }
  }

  // 解析AI回复
  parseAIResponse(responseText) {
    try {
      const parts = responseText.split('|');
      if (parts.length !== 4) {
        throw new Error('AI回复格式不正确');
      }

      return {
        success: true,
        english: parts[0].trim(),
        chinese: parts[1].trim(),
        tip: parts[2].trim(),
        encouragement: parts[3].trim()
      };
    } catch (error) {
      logger.error('AI回复解析失败:', error);
      return {
        success: false,
        error: error.message,
        fallback: this.getFallbackResponse()
      };
    }
  }

  // 获取备用回复
  getFallbackResponse() {
    const fallbackResponses = [
      {
        english: "That's interesting! Can you tell me more?",
        chinese: "这很有趣！你能告诉我更多吗？",
        tip: "继续练习，你会越来越棒的！",
        encouragement: "Great effort! Keep learning!"
      },
      {
        english: "I'm here to help you learn!",
        chinese: "我在这里帮你学习！",
        tip: "学习英语是一个有趣的过程！",
        encouragement: "You're doing great!"
      },
      {
        english: "Let's practice together!",
        chinese: "让我们一起练习吧！",
        tip: "多练习会让你的英语更好！",
        encouragement: "Keep going!"
      }
    ];

    return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
  }

  // 生成AI回复（主要方法）
  async generateResponse(userInput, userSettings, conversationHistory = []) {
    try {
      // 构建prompt
      const prompt = this.buildPrompt(userInput, userSettings, conversationHistory);
      
      // 选择AI服务
      let aiResult;
      if (process.env.OPENAI_API_KEY) {
        aiResult = await this.callOpenAI(prompt);
      } else if (process.env.BAIDU_API_KEY) {
        aiResult = await this.callBaiduWenxin(prompt);
      } else {
        // 使用模拟回复
        aiResult = this.getMockResponse(userInput, userSettings);
      }

      if (!aiResult.success) {
        return {
          success: false,
          error: aiResult.error,
          fallback: this.getFallbackResponse()
        };
      }

      // 解析回复
      const parsedResponse = this.parseAIResponse(aiResult.text);
      
      if (!parsedResponse.success) {
        return {
          success: false,
          error: parsedResponse.error,
          fallback: parsedResponse.fallback
        };
      }

      return {
        success: true,
        ...parsedResponse
      };

    } catch (error) {
      logger.error('生成AI回复失败:', error);
      return {
        success: false,
        error: error.message,
        fallback: this.getFallbackResponse()
      };
    }
  }

  // 获取模拟回复（用于测试）
  getMockResponse(userInput, userSettings) {
    const { childAge, aiPersonality } = userSettings;
    
    const responses = this.getAgeAppropriateResponses(childAge, aiPersonality);
    const selectedResponse = responses[Math.floor(Math.random() * responses.length)];
    
    return {
      success: true,
      text: `${selectedResponse.english}|${selectedResponse.chinese}|${selectedResponse.tip}|${selectedResponse.encouragement}`
    };
  }

  // 根据年龄获取合适的回复
  getAgeAppropriateResponses(age, personality) {
    if (age >= 5 && age <= 7) {
      return [
        {
          english: "Hello there! You're doing so well! 🌟",
          chinese: "你好！你做得很好！",
          tip: "记住要大声说出来哦！",
          encouragement: "Keep going!"
        },
        {
          english: "I love talking with you! Can you tell me about your favorite color? 🎨",
          chinese: "我喜欢和你聊天！你能告诉我你最喜欢的颜色吗？",
          tip: "用英语说出颜色，比如：I like red!",
          encouragement: "Wonderful!"
        },
        {
          english: "You're such a smart little one! Let's learn more words together! 📚",
          chinese: "你真是个聪明的小朋友！让我们一起学更多单词吧！",
          tip: "每个新单词都是一个新朋友！",
          encouragement: "Excellent!"
        }
      ];
    } else {
      return [
        {
          english: "Great to see you again! How has your day been? 😊",
          chinese: "很高兴再次见到你！你今天过得怎么样？",
          tip: "试着用英语描述你的一天！",
          encouragement: "Nice to meet you!"
        },
        {
          english: "I can see you're working hard on your English. That's wonderful! 📖",
          chinese: "我看到你在努力学习英语。这太棒了！",
          tip: "努力学习的孩子最棒！",
          encouragement: "Keep up the good work!"
        },
        {
          english: "What would you like to talk about today? I'm here to help you learn! 💬",
          chinese: "今天你想聊什么呢？我在这里帮你学习！",
          tip: "选择你感兴趣的话题开始对话！",
          encouragement: "Great choice!"
        }
      ];
    }
  }

  // 获取难度文本
  getDifficultyText(difficulty) {
    const difficultyMap = {
      'easy': '简单',
      'medium': '中等',
      'hard': '困难'
    };
    return difficultyMap[difficulty] || '简单';
  }

  // 获取性格文本
  getPersonalityText(personality) {
    const personalityMap = {
      'friendly': '友好',
      'encouraging': '鼓励',
      'playful': '活泼',
      'patient': '耐心'
    };
    return personalityMap[personality] || '友好';
  }

  // 生成学习建议
  generateLearningSuggestion(userSettings, learningHistory) {
    const { childAge, difficulty } = userSettings;
    
    const suggestions = {
      vocabulary: this.getVocabularySuggestion(childAge, difficulty),
      pronunciation: this.getPronunciationSuggestion(),
      conversation: this.getConversationSuggestion(childAge),
      grammar: this.getGrammarSuggestion(childAge, difficulty)
    };

    return suggestions;
  }

  // 获取词汇学习建议
  getVocabularySuggestion(age, difficulty) {
    if (age >= 5 && age <= 7) {
      return {
        topic: '基础词汇',
        words: ['apple', 'banana', 'cat', 'dog', 'red', 'blue', 'big', 'small'],
        difficulty: 'easy',
        activity: '图片配对游戏'
      };
    } else {
      return {
        topic: '日常词汇',
        words: ['family', 'school', 'friend', 'happy', 'beautiful', 'delicious', 'interesting', 'wonderful'],
        difficulty: 'medium',
        activity: '造句练习'
      };
    }
  }

  // 获取发音建议
  getPronunciationSuggestion() {
    const commonIssues = [
      '注意元音发音',
      '练习辅音组合',
      '注意语调变化',
      '放慢语速练习'
    ];

    return {
      focus: commonIssues[Math.floor(Math.random() * commonIssues.length)],
      practice: '跟读练习',
      tips: '多听多模仿，注意口型'
    };
  }

  // 获取对话建议
  getConversationSuggestion(age) {
    if (age >= 5 && age <= 7) {
      return {
        topics: ['自我介绍', '家庭介绍', '颜色喜好', '动物朋友'],
        phrases: ['My name is...', 'I like...', 'This is...', 'I can see...'],
        practice: '角色扮演'
      };
    } else {
      return {
        topics: ['兴趣爱好', '学校生活', '未来计划', '旅行经历'],
        phrases: ['I enjoy...', 'In my opinion...', 'I would like to...', 'I have been to...'],
        practice: '自由对话'
      };
    }
  }

  // 获取语法建议
  getGrammarSuggestion(age, difficulty) {
    if (age >= 5 && age <= 7) {
      return {
        focus: '简单句型',
        patterns: ['I am...', 'You are...', 'This is...', 'I like...'],
        examples: ['I am happy.', 'You are nice.', 'This is a cat.', 'I like apples.']
      };
    } else {
      return {
        focus: '复合句型',
        patterns: ['I think...', 'I want to...', 'I can...', 'I have...'],
        examples: ['I think it\'s good.', 'I want to learn more.', 'I can speak English.', 'I have a book.']
      };
    }
  }
}

module.exports = new AIService();
