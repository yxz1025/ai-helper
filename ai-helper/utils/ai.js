// AI对话逻辑工具函数
class AIAssistant {
  constructor() {
    this.personalities = {
      friendly: new FriendlyPersonality(),
      encouraging: new EncouragingPersonality(),
      playful: new PlayfulPersonality(),
      patient: new PatientPersonality()
    };
    
    this.ageGroups = {
      '5-7': new YoungChildGroup(),
      '8-10': new OlderChildGroup()
    };
  }

  // 生成AI回复
  generateResponse(userInput, age, difficulty, personality = 'friendly') {
    const personalityHandler = this.personalities[personality];
    const ageGroup = this.getAgeGroup(age);
    
    if (!personalityHandler || !ageGroup) {
      return this.getDefaultResponse();
    }

    // 分析用户输入
    const analysis = this.analyzeInput(userInput);
    
    // 根据年龄组和难度生成回复
    const response = personalityHandler.generateResponse(userInput, analysis, ageGroup, difficulty);
    
    return {
      text: response.text,
      translation: response.translation,
      tip: response.tip,
      encouragement: response.encouragement,
      audioUrl: response.audioUrl
    };
  }

  // 获取年龄组
  getAgeGroup(age) {
    if (age >= 5 && age <= 7) {
      return this.ageGroups['5-7'];
    } else if (age >= 8 && age <= 10) {
      return this.ageGroups['8-10'];
    }
    return this.ageGroups['5-7']; // 默认
  }

  // 分析用户输入
  analyzeInput(input) {
    const analysis = {
      type: 'unknown',
      sentiment: 'neutral',
      keywords: [],
      difficulty: 'easy',
      topics: []
    };

    // 简单的关键词分析
    const greetingKeywords = ['hello', 'hi', 'hey', 'good morning', 'good afternoon'];
    const questionKeywords = ['what', 'how', 'where', 'when', 'why', 'who'];
    const emotionKeywords = ['happy', 'sad', 'angry', 'excited', 'tired'];

    const lowerInput = input.toLowerCase();

    if (greetingKeywords.some(keyword => lowerInput.includes(keyword))) {
      analysis.type = 'greeting';
      analysis.sentiment = 'positive';
    } else if (questionKeywords.some(keyword => lowerInput.includes(keyword))) {
      analysis.type = 'question';
    } else if (emotionKeywords.some(keyword => lowerInput.includes(keyword))) {
      analysis.type = 'emotion';
    }

    // 提取关键词
    analysis.keywords = this.extractKeywords(input);
    
    return analysis;
  }

  // 提取关键词
  extractKeywords(input) {
    // 简单的关键词提取，实际应用中可以使用更复杂的NLP技术
    const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
    const words = input.toLowerCase().split(/\s+/);
    return words.filter(word => word.length > 2 && !commonWords.includes(word));
  }

  // 获取默认回复
  getDefaultResponse() {
    return {
      text: "That's interesting! Can you tell me more?",
      translation: "这很有趣！你能告诉我更多吗？",
      tip: "继续练习，你会越来越棒的！",
      encouragement: "Great job!",
      audioUrl: ""
    };
  }

  // 生成学习建议
  generateLearningSuggestion(progress, age, difficulty) {
    const suggestions = {
      vocabulary: this.getVocabularySuggestion(age, difficulty),
      pronunciation: this.getPronunciationSuggestion(progress),
      conversation: this.getConversationSuggestion(age),
      grammar: this.getGrammarSuggestion(age, difficulty)
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
  getPronunciationSuggestion(progress) {
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

// 友好型AI性格
class FriendlyPersonality {
  generateResponse(input, analysis, ageGroup, difficulty) {
    const responses = ageGroup.getFriendlyResponses(analysis, difficulty);
    return responses[Math.floor(Math.random() * responses.length)];
  }
}

// 鼓励型AI性格
class EncouragingPersonality {
  generateResponse(input, analysis, ageGroup, difficulty) {
    const responses = ageGroup.getEncouragingResponses(analysis, difficulty);
    return responses[Math.floor(Math.random() * responses.length)];
  }
}

// 活泼型AI性格
class PlayfulPersonality {
  generateResponse(input, analysis, ageGroup, difficulty) {
    const responses = ageGroup.getPlayfulResponses(analysis, difficulty);
    return responses[Math.floor(Math.random() * responses.length)];
  }
}

// 耐心型AI性格
class PatientPersonality {
  generateResponse(input, analysis, ageGroup, difficulty) {
    const responses = ageGroup.getPatientResponses(analysis, difficulty);
    return responses[Math.floor(Math.random() * responses.length)];
  }
}

// 5-7岁年龄组
class YoungChildGroup {
  getFriendlyResponses(analysis, difficulty) {
    return [
      {
        text: "Hello there! You're doing so well! 🌟",
        translation: "你好！你做得很好！",
        tip: "记住要大声说出来哦！",
        encouragement: "Keep going!",
        audioUrl: ""
      },
      {
        text: "I love talking with you! Can you tell me about your favorite color? 🎨",
        translation: "我喜欢和你聊天！你能告诉我你最喜欢的颜色吗？",
        tip: "用英语说出颜色，比如：I like red!",
        encouragement: "Wonderful!",
        audioUrl: ""
      },
      {
        text: "You're such a smart little one! Let's learn more words together! 📚",
        translation: "你真是个聪明的小朋友！让我们一起学更多单词吧！",
        tip: "每个新单词都是一个新朋友！",
        encouragement: "Excellent!",
        audioUrl: ""
      }
    ];
  }

  getEncouragingResponses(analysis, difficulty) {
    return [
      {
        text: "Wow! You're getting better every day! I'm so proud of you! 🎉",
        translation: "哇！你每天都在进步！我为你感到骄傲！",
        tip: "坚持练习，你会越来越棒的！",
        encouragement: "Amazing progress!",
        audioUrl: ""
      },
      {
        text: "Don't worry if it's hard sometimes. You're doing great! Keep trying! 💪",
        translation: "如果有时候觉得难，不要担心。你做得很好！继续努力！",
        tip: "每个人学习都需要时间，慢慢来！",
        encouragement: "You can do it!",
        audioUrl: ""
      }
    ];
  }

  getPlayfulResponses(analysis, difficulty) {
    return [
      {
        text: "Let's play a game! Can you find something red in your room? 🔍",
        translation: "我们来玩游戏吧！你能在房间里找到红色的东西吗？",
        tip: "游戏让学习更有趣！",
        encouragement: "Fun learning!",
        audioUrl: ""
      },
      {
        text: "I'm a magical English teacher! Abracadabra! Now you can speak English! ✨",
        translation: "我是神奇的英语老师！阿布拉卡达布拉！现在你会说英语了！",
        tip: "想象力和学习是好朋友！",
        encouragement: "Magical!",
        audioUrl: ""
      }
    ];
  }

  getPatientResponses(analysis, difficulty) {
    return [
      {
        text: "Take your time, little one. I'll wait for you to think. 🤔",
        translation: "慢慢来，小朋友。我会等你思考。",
        tip: "思考一下再回答，这样会更好！",
        encouragement: "Good thinking!",
        audioUrl: ""
      },
      {
        text: "Let me help you with that. Can you repeat after me? 🗣️",
        translation: "让我来帮你。你能跟着我说吗？",
        tip: "跟着老师慢慢说，不要着急！",
        encouragement: "Nice try!",
        audioUrl: ""
      }
    ];
  }
}

// 8-10岁年龄组
class OlderChildGroup {
  getFriendlyResponses(analysis, difficulty) {
    return [
      {
        text: "Great to see you again! How has your day been? 😊",
        translation: "很高兴再次见到你！你今天过得怎么样？",
        tip: "试着用英语描述你的一天！",
        encouragement: "Nice to meet you!",
        audioUrl: ""
      },
      {
        text: "I can see you're working hard on your English. That's wonderful! 📖",
        translation: "我看到你在努力学习英语。这太棒了！",
        tip: "努力学习的孩子最棒！",
        encouragement: "Keep up the good work!",
        audioUrl: ""
      },
      {
        text: "What would you like to talk about today? I'm here to help you learn! 💬",
        translation: "今天你想聊什么呢？我在这里帮你学习！",
        tip: "选择你感兴趣的话题开始对话！",
        encouragement: "Great choice!",
        audioUrl: ""
      }
    ];
  }

  getEncouragingResponses(analysis, difficulty) {
    return [
      {
        text: "Your pronunciation is getting much better! I can hear the improvement! 🎯",
        translation: "你的发音越来越好了！我能听到进步！",
        tip: "注意发音的细节，慢慢练习！",
        encouragement: "Outstanding!",
        audioUrl: ""
      },
      {
        text: "Don't be afraid to make mistakes. That's how we learn! 🌱",
        translation: "不要害怕犯错。这就是我们学习的方式！",
        tip: "错误是学习路上的好朋友！",
        encouragement: "Keep learning!",
        audioUrl: ""
      }
    ];
  }

  getPlayfulResponses(analysis, difficulty) {
    return [
      {
        text: "Let's have a challenge! Can you tell me a story in English? 🏆",
        translation: "我们来挑战一下！你能用英语给我讲个故事吗？",
        tip: "编故事是练习英语的好方法！",
        encouragement: "Creative!",
        audioUrl: ""
      },
      {
        text: "I bet you can't beat me at this English game! Ready? 🎮",
        translation: "我打赌你在这个英语游戏上赢不了我！准备好了吗？",
        tip: "游戏让学习变得更有趣！",
        encouragement: "Game on!",
        audioUrl: ""
      }
    ];
  }

  getPatientResponses(analysis, difficulty) {
    return [
      {
        text: "Let's break this down into smaller parts. What do you understand so far? 🧩",
        translation: "让我们把它分解成小部分。到目前为止你理解了什么？",
        tip: "一步一步学习，不要着急！",
        encouragement: "Good approach!",
        audioUrl: ""
      },
      {
        text: "I'm here to help you understand. What questions do you have? 🤝",
        translation: "我在这里帮你理解。你有什么问题吗？",
        tip: "有问题就问，这是学习的好习惯！",
        encouragement: "Good question!",
        audioUrl: ""
      }
    ];
  }
}

// 导出AI助手类
module.exports = {
  AIAssistant,
  YoungChildGroup,
  OlderChildGroup
};
