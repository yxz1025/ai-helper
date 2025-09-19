const aiService = require('../services/aiService');
const { logger } = require('../utils/logger');
const { AppError } = require('../middleware/errorHandler');

class AIController {
  // 生成AI回复
  async generateResponse(req, res, next) {
    try {
      const { text, age, difficulty, aiPersonality, conversationHistory } = req.body;
      const user = req.user;

      if (!text) {
        throw new AppError('请输入要回复的文本', 400, 'NO_TEXT');
      }

      const userSettings = {
        childAge: age || user.childAge,
        difficulty: difficulty || user.difficulty,
        aiPersonality: aiPersonality || user.aiPersonality
      };

      logger.info('生成AI回复', {
        userId: user._id,
        userInput: text.substring(0, 100),
        userSettings
      });

      const result = await aiService.generateResponse(
        text,
        userSettings,
        conversationHistory || []
      );

      if (!result.success) {
        logger.warn('AI回复生成失败，使用备用回复', {
          userId: user._id,
          error: result.error
        });
      }

      const response = result.success ? result : result.fallback;

      res.json({
        success: true,
        data: {
          english: response.english,
          chinese: response.chinese,
          tip: response.tip,
          encouragement: response.encouragement,
          userSettings,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      logger.error('生成AI回复控制器错误:', error);
      next(error);
    }
  }

  // 获取AI建议
  async getSuggestions(req, res, next) {
    try {
      const { age, difficulty } = req.query;
      const user = req.user;

      const userSettings = {
        childAge: parseInt(age) || user.childAge,
        difficulty: difficulty || user.difficulty
      };

      const suggestions = aiService.generateLearningSuggestion(userSettings, []);

      res.json({
        success: true,
        data: {
          suggestions,
          userSettings
        }
      });

    } catch (error) {
      logger.error('获取AI建议错误:', error);
      next(error);
    }
  }

  // 获取学习内容
  async getLearningContent(req, res, next) {
    try {
      const { topic, age, difficulty } = req.query;
      const user = req.user;

      const userSettings = {
        childAge: parseInt(age) || user.childAge,
        difficulty: difficulty || user.difficulty
      };

      // 根据主题生成学习内容
      const learningContent = this.generateLearningContent(topic, userSettings);

      res.json({
        success: true,
        data: {
          topic: topic || '日常对话',
          content: learningContent,
          userSettings
        }
      });

    } catch (error) {
      logger.error('获取学习内容错误:', error);
      next(error);
    }
  }

  // 评估用户输入
  async evaluateInput(req, res, next) {
    try {
      const { text, expectedAnswer, age } = req.body;
      const user = req.user;

      if (!text) {
        throw new AppError('请输入要评估的文本', 400, 'NO_TEXT');
      }

      const evaluation = this.evaluateUserInput(text, expectedAnswer, parseInt(age) || user.childAge);

      res.json({
        success: true,
        data: {
          evaluation,
          input: text,
          expectedAnswer,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      logger.error('评估用户输入错误:', error);
      next(error);
    }
  }

  // 获取AI配置
  async getAIConfig(req, res, next) {
    try {
      const user = req.user;

      const config = {
        availablePersonalities: [
          { value: 'friendly', label: '友好', description: '温暖友善，像好朋友一样' },
          { value: 'encouraging', label: '鼓励', description: '积极鼓励，充满正能量' },
          { value: 'playful', label: '活泼', description: '活泼有趣，充满活力' },
          { value: 'patient', label: '耐心', description: '耐心细致，循循善诱' }
        ],
        availableDifficulties: [
          { value: 'easy', label: '简单', description: '适合5-7岁儿童' },
          { value: 'medium', label: '中等', description: '适合8-10岁儿童' },
          { value: 'hard', label: '困难', description: '适合英语基础较好的儿童' }
        ],
        supportedAges: [
          { min: 5, max: 7, label: '5-7岁' },
          { min: 8, max: 10, label: '8-10岁' }
        ],
        currentSettings: {
          childAge: user.childAge,
          difficulty: user.difficulty,
          aiPersonality: user.aiPersonality
        }
      };

      res.json({
        success: true,
        data: config
      });

    } catch (error) {
      logger.error('获取AI配置错误:', error);
      next(error);
    }
  }

  // 生成学习内容
  generateLearningContent(topic, userSettings) {
    const { childAge, difficulty } = userSettings;

    const contentMap = {
      'greetings': {
        title: '问候语',
        vocabulary: childAge <= 7 
          ? ['Hello', 'Hi', 'Good morning', 'Goodbye', 'Bye']
          : ['Hello', 'Good morning', 'Good afternoon', 'Good evening', 'Nice to meet you', 'See you later'],
        sentences: childAge <= 7
          ? ['Hello!', 'Hi there!', 'Good morning!', 'Goodbye!', 'Bye bye!']
          : ['Hello, how are you?', 'Good morning, teacher!', 'Nice to meet you!', 'Have a good day!'],
        practice: 'Try greeting your family members in English!'
      },
      'colors': {
        title: '颜色',
        vocabulary: ['red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 'black', 'white'],
        sentences: ['This is red.', 'I like blue.', 'What color is this?', 'The sky is blue.'],
        practice: 'Point to objects around you and say their colors!'
      },
      'animals': {
        title: '动物',
        vocabulary: ['cat', 'dog', 'bird', 'fish', 'rabbit', 'elephant', 'lion', 'tiger'],
        sentences: ['I have a cat.', 'The dog is big.', 'I like animals.', 'What animal is this?'],
        practice: 'Make animal sounds and say their names!'
      },
      'family': {
        title: '家庭',
        vocabulary: ['mother', 'father', 'sister', 'brother', 'grandmother', 'grandfather'],
        sentences: ['This is my mother.', 'I love my family.', 'I have a sister.', 'My father is tall.'],
        practice: 'Introduce your family members!'
      }
    };

    const defaultContent = {
      title: '日常对话',
      vocabulary: ['hello', 'thank you', 'please', 'sorry', 'excuse me'],
      sentences: ['Hello!', 'Thank you!', 'Please help me.', 'I am sorry.'],
      practice: 'Practice these words with your family!'
    };

    return contentMap[topic] || defaultContent;
  }

  // 评估用户输入
  evaluateUserInput(text, expectedAnswer, age) {
    const evaluation = {
      accuracy: 0,
      pronunciation: 'good',
      grammar: 'correct',
      suggestions: [],
      encouragement: ''
    };

    // 简单的评估逻辑（实际应用中应该使用更复杂的算法）
    if (expectedAnswer) {
      const similarity = this.calculateSimilarity(text.toLowerCase(), expectedAnswer.toLowerCase());
      evaluation.accuracy = Math.round(similarity * 100);
    }

    // 根据年龄调整评估标准
    if (age <= 7) {
      evaluation.pronunciation = 'good';
      evaluation.grammar = 'correct';
      evaluation.encouragement = 'Great job! You\'re doing wonderful!';
    } else {
      evaluation.pronunciation = 'very good';
      evaluation.grammar = 'excellent';
      evaluation.encouragement = 'Excellent! Keep up the great work!';
    }

    // 添加改进建议
    if (evaluation.accuracy < 80) {
      evaluation.suggestions.push('Try to speak more clearly');
      evaluation.suggestions.push('Practice the pronunciation');
    }

    return evaluation;
  }

  // 计算文本相似度
  calculateSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) {
      return 1.0;
    }
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  // 计算编辑距离
  levenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }
}

module.exports = new AIController();

