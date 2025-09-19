App({
  globalData: {
    userInfo: null,
    childAge: 6, // 默认年龄
    difficulty: 'easy', // 难度等级
    totalScore: 0, // 总分数
    streak: 0, // 连续学习天数
    todayPractice: 0, // 今日练习次数
    aiPersonality: 'friendly', // AI性格：friendly, encouraging, playful
    voiceEnabled: true, // 语音功能开关
    autoVoiceEnabled: true, // 自动语音聊天开关
    autoPlay: true, // 自动播放AI语音
    learningReminder: true, // 学习提醒
    dailyTarget: 5, // 每日学习目标
    fontSize: 'medium', // 字体大小
    language: 'zh-CN', // 界面语言
    theme: 'pink' // 主题色彩
  },

  onLaunch() {
    console.log('AI英语小助教启动');
    this.initApp();
  },

  // 初始化应用
  initApp() {
    // 检查存储的用户设置
    const settings = wx.getStorageSync('userSettings');
    if (settings) {
      this.globalData = { ...this.globalData, ...settings };
    }

    // 检查今日练习记录
    this.checkTodayProgress();
    
    // 初始化语音识别
    this.initVoiceRecognition();
  },

  // 检查今日学习进度
  checkTodayProgress() {
    const today = new Date().toDateString();
    const lastPractice = wx.getStorageSync('lastPractice');
    
    if (lastPractice !== today) {
      this.globalData.todayPractice = 0;
      wx.setStorageSync('lastPractice', today);
    }
  },

  // 初始化语音识别
  initVoiceRecognition() {
    if (this.globalData.voiceEnabled) {
      wx.getRecorderManager();
      wx.getInnerAudioContext();
    }
  },

  // 更新用户设置
  updateSettings(newSettings) {
    this.globalData = { ...this.globalData, ...newSettings };
    wx.setStorageSync('userSettings', this.globalData);
  },

  // 增加分数
  addScore(points) {
    this.globalData.totalScore += points;
    this.globalData.todayPractice += 1;
    wx.setStorageSync('userSettings', this.globalData);
  },

  // 获取AI回应内容（根据年龄和难度）
  getAIResponse(userInput, age, difficulty) {
    // 这里会根据年龄和难度返回不同的回应
    const responses = this.getAgeAppropriateResponses(age, difficulty);
    return responses[Math.floor(Math.random() * responses.length)];
  },

  // 根据年龄获取合适的回应
  getAgeAppropriateResponses(age, difficulty) {
    if (age >= 5 && age <= 7) {
      return [
        "哇！你说得真棒！🌟",
        "太厉害了！我们来学更多吧！✨",
        "你真聪明！继续加油！💪",
        "说得很好！我们练习下一个吧！🎈"
      ];
    } else if (age >= 8 && age <= 10) {
      return [
        "Excellent! Let's try something more challenging!",
        "Great job! You're getting better every day!",
        "Wonderful! Ready for the next level?",
        "Amazing! I'm so proud of your progress!"
      ];
    }
    return ["Great! Let's keep learning together!"];
  }
});
