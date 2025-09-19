// 首页逻辑
const app = getApp();

Page({
  data: {
    userInfo: {},
    childAge: 6,
    difficultyText: '简单',
    currentLevel: 1,
    todayPractice: 0,
    streak: 0,
    totalScore: 0,
    progressPercentage: 0,
    achievements: [],
    autoVoiceEnabled: true,
    dailySentence: {
      english: "Hello! How are you today?",
      chinese: "你好！你今天怎么样？",
      tip: "这是一个常用的问候语，记得要微笑哦！😊"
    }
  },

  onLoad() {
    console.log('首页加载');
    this.initPage();
  },

  onShow() {
    this.refreshData();
  },

  // 初始化页面
  initPage() {
    // 获取用户信息
    this.getUserInfo();
    
    // 加载每日句子
    this.loadDailySentence();
    
    // 加载成就数据
    this.loadAchievements();
    
    // 检查学习进度
    this.checkLearningProgress();
  },

  // 刷新数据
  refreshData() {
    const globalData = app.globalData;
    this.setData({
      childAge: globalData.childAge,
      difficultyText: this.getDifficultyText(globalData.difficulty),
      currentLevel: this.calculateLevel(globalData.totalScore),
      todayPractice: globalData.todayPractice,
      streak: globalData.streak,
      totalScore: globalData.totalScore,
      progressPercentage: (globalData.todayPractice / 5) * 100,
      autoVoiceEnabled: globalData.autoVoiceEnabled || true
    });
  },

  // 获取用户信息
  getUserInfo() {
    wx.getUserProfile({
      desc: '用于完善用户资料',
      success: (res) => {
        this.setData({
          userInfo: res.userInfo
        });
      },
      fail: () => {
        // 使用默认用户信息
        this.setData({
          userInfo: {
            nickName: '小朋友',
            avatarUrl: '/images/default-avatar.png'
          }
        });
      }
    });
  },

  // 获取难度文本
  getDifficultyText(difficulty) {
    const difficultyMap = {
      'easy': '简单',
      'medium': '中等',
      'hard': '困难'
    };
    return difficultyMap[difficulty] || '简单';
  },

  // 计算等级
  calculateLevel(totalScore) {
    return Math.floor(totalScore / 100) + 1;
  },

  // 加载每日句子
  loadDailySentence() {
    const sentences = [
      {
        english: "Hello! How are you today?",
        chinese: "你好！你今天怎么样？",
        tip: "这是一个常用的问候语，记得要微笑哦！😊"
      },
      {
        english: "What's your favorite color?",
        chinese: "你最喜欢什么颜色？",
        tip: "学习表达自己的喜好，很实用呢！🌈"
      },
      {
        english: "I love learning English!",
        chinese: "我喜欢学英语！",
        tip: "表达喜欢做某事，让我们更自信！💪"
      },
      {
        english: "Can you help me, please?",
        chinese: "你能帮我吗？",
        tip: "礼貌地请求帮助，很有用的一句话！🤝"
      },
      {
        english: "Thank you very much!",
        chinese: "非常感谢你！",
        tip: "表达感谢，让世界更美好！🙏"
      }
    ];
    
    const today = new Date().getDate();
    const selectedSentence = sentences[today % sentences.length];
    
    this.setData({
      dailySentence: selectedSentence
    });
  },

  // 加载成就数据
  loadAchievements() {
    const achievements = [
      {
        id: 1,
        name: "初次见面",
        description: "完成第一次语音对话",
        icon: "👋",
        target: 1,
        progress: app.globalData.todayPractice > 0 ? 1 : 0,
        unlocked: app.globalData.todayPractice > 0
      },
      {
        id: 2,
        name: "坚持不懈",
        description: "连续学习3天",
        icon: "🔥",
        target: 3,
        progress: Math.min(app.globalData.streak, 3),
        unlocked: app.globalData.streak >= 3
      },
      {
        id: 3,
        name: "词汇小达人",
        description: "学会50个单词",
        icon: "📚",
        target: 50,
        progress: Math.min(app.globalData.totalScore / 10, 50),
        unlocked: app.globalData.totalScore >= 500
      },
      {
        id: 4,
        name: "对话高手",
        description: "完成100次对话",
        icon: "💬",
        target: 100,
        progress: Math.min(app.globalData.totalScore / 5, 100),
        unlocked: app.globalData.totalScore >= 500
      }
    ];
    
    this.setData({
      achievements: achievements
    });
  },

  // 检查学习进度
  checkLearningProgress() {
    // 检查是否需要重置连续天数
    const today = new Date().toDateString();
    const lastPractice = wx.getStorageSync('lastPractice');
    
    if (lastPractice && lastPractice !== today) {
      // 如果昨天有练习，连续天数+1，否则重置为0
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      if (lastPractice === yesterday.toDateString()) {
        app.globalData.streak += 1;
      } else {
        app.globalData.streak = 0;
      }
      
      wx.setStorageSync('userSettings', app.globalData);
    }
  },

  // 开始语音对话
  startVoiceChat() {
    wx.switchTab({
      url: '/pages/chat/chat'
    });
  },

  // 开始AI主动语音聊天
  startAutoVoiceChat() {
    // 确保自动语音聊天已开启
    if (!this.data.autoVoiceEnabled) {
      wx.showModal({
        title: '开启自动语音聊天',
        content: '是否开启AI主动发起语音对话的功能？',
        success: (res) => {
          if (res.confirm) {
            app.updateSettings({
              autoVoiceEnabled: true
            });
            this.setData({
              autoVoiceEnabled: true
            });
            wx.switchTab({
              url: '/pages/chat/chat'
            });
          }
        }
      });
    } else {
      wx.switchTab({
        url: '/pages/chat/chat'
      });
    }
  },

  // 开始单词学习
  startVocabulary() {
    wx.showToast({
      title: '功能开发中...',
      icon: 'none'
    });
  },

  // 开始故事时间
  startStory() {
    wx.showToast({
      title: '功能开发中...',
      icon: 'none'
    });
  },

  // 开始游戏
  startGame() {
    wx.showToast({
      title: '功能开发中...',
      icon: 'none'
    });
  },

  // 播放每日句子
  playSentence() {
    if (app.globalData.voiceEnabled) {
      // 使用语音合成播放句子
      wx.createInnerAudioContext().src = this.generateTTSUrl(this.data.dailySentence.english);
    } else {
      wx.showToast({
        title: '请先开启语音功能',
        icon: 'none'
      });
    }
  },

  // 生成TTS URL（模拟）
  generateTTSUrl(text) {
    // 这里应该调用真实的TTS服务
    return `https://api.example.com/tts?text=${encodeURIComponent(text)}&voice=child`;
  },

  // 分享功能
  onShareAppMessage() {
    return {
      title: 'AI英语小助教 - 让孩子快乐学英语',
      path: '/pages/index/index',
      imageUrl: '/images/share-cover.png'
    };
  }
});
