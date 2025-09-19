// 设置页面逻辑
const app = getApp();

Page({
  data: {
    // 年龄选择
    ageOptions: ['5', '6', '7', '8', '9', '10'],
    ageIndex: 0,
    
    // 难度选择
    difficultyOptions: ['简单', '中等', '困难'],
    difficultyIndex: 0,
    
    // AI性格选择
    personalityOptions: ['友好', '鼓励', '活泼', '耐心'],
    personalityIndex: 0,
    
    // 目标选择
    targetOptions: ['3', '5', '10', '15'],
    targetIndex: 1,
    
    // 主题选择
    themeOptions: [
      { name: '粉色', value: 'pink', color: '#FF6B9D' },
      { name: '蓝色', value: 'blue', color: '#4A90E2' },
      { name: '绿色', value: 'green', color: '#7ED321' },
      { name: '紫色', value: 'purple', color: '#9013FE' },
      { name: '橙色', value: 'orange', color: '#F5A623' },
      { name: '青色', value: 'cyan', color: '#50E3C2' }
    ],
    theme: 'pink',
    
    // 字体大小选择
    fontSizeOptions: [
      { label: '小', value: 'small', size: 24 },
      { label: '中', value: 'medium', size: 28 },
      { label: '大', value: 'large', size: 32 },
      { label: '特大', value: 'xlarge', size: 36 }
    ],
    fontSize: 'medium',
    
    // 开关状态
    voiceEnabled: true,
    autoVoiceEnabled: true,
    autoPlay: true,
    learningReminder: true,
    
    // 统计数据
    totalScore: 0,
    streak: 0,
    totalPractice: 0,
    currentLevel: 1
  },

  onLoad() {
    console.log('设置页面加载');
    this.loadSettings();
  },

  onShow() {
    this.refreshStats();
  },

  // 加载设置
  loadSettings() {
    const globalData = app.globalData;
    
    // 年龄设置
    const ageIndex = this.data.ageOptions.indexOf(globalData.childAge.toString());
    
    // 难度设置
    const difficultyMap = { 'easy': 0, 'medium': 1, 'hard': 2 };
    const difficultyIndex = difficultyMap[globalData.difficulty] || 0;
    
    // AI性格设置
    const personalityMap = { 'friendly': 0, 'encouraging': 1, 'playful': 2, 'patient': 3 };
    const personalityIndex = personalityMap[globalData.aiPersonality] || 0;
    
    this.setData({
      ageIndex: ageIndex >= 0 ? ageIndex : 0,
      difficultyIndex: difficultyIndex,
      personalityIndex: personalityIndex,
      voiceEnabled: globalData.voiceEnabled,
      autoVoiceEnabled: globalData.autoVoiceEnabled || true,
      autoPlay: globalData.autoPlay || true,
      learningReminder: globalData.learningReminder || true,
      theme: globalData.theme || 'pink',
      fontSize: globalData.fontSize || 'medium'
    });
  },

  // 刷新统计数据
  refreshStats() {
    const globalData = app.globalData;
    this.setData({
      totalScore: globalData.totalScore,
      streak: globalData.streak,
      totalPractice: globalData.totalPractice || 0,
      currentLevel: Math.floor(globalData.totalScore / 100) + 1
    });
  },

  // 年龄改变
  onAgeChange(e) {
    const index = parseInt(e.detail.value);
    this.setData({
      ageIndex: index
    });
    
    const newAge = parseInt(this.data.ageOptions[index]);
    app.updateSettings({
      childAge: newAge
    });
  },

  // 难度改变
  onDifficultyChange(e) {
    const index = parseInt(e.detail.value);
    this.setData({
      difficultyIndex: index
    });
    
    const difficultyMap = ['easy', 'medium', 'hard'];
    const newDifficulty = difficultyMap[index];
    app.updateSettings({
      difficulty: newDifficulty
    });
  },

  // AI性格改变
  onPersonalityChange(e) {
    const index = parseInt(e.detail.value);
    this.setData({
      personalityIndex: index
    });
    
    const personalityMap = ['friendly', 'encouraging', 'playful', 'patient'];
    const newPersonality = personalityMap[index];
    app.updateSettings({
      aiPersonality: newPersonality
    });
  },

  // 目标改变
  onTargetChange(e) {
    const index = parseInt(e.detail.value);
    this.setData({
      targetIndex: index
    });
    
    const newTarget = parseInt(this.data.targetOptions[index]);
    app.updateSettings({
      dailyTarget: newTarget
    });
  },

  // 主题改变
  onThemeChange(e) {
    const theme = e.currentTarget.dataset.theme;
    this.setData({
      theme: theme
    });
    
    app.updateSettings({
      theme: theme
    });
    
    // 应用主题色彩
    this.applyTheme(theme);
  },

  // 字体大小改变
  onFontSizeChange(e) {
    const size = e.currentTarget.dataset.size;
    this.setData({
      fontSize: size
    });
    
    app.updateSettings({
      fontSize: size
    });
    
    // 应用字体大小
    this.applyFontSize(size);
  },

  // 语音开关
  onVoiceToggle(e) {
    const enabled = e.detail.value;
    this.setData({
      voiceEnabled: enabled
    });
    
    app.updateSettings({
      voiceEnabled: enabled
    });
    
    if (!enabled) {
      wx.showToast({
        title: '语音功能已关闭',
        icon: 'none'
      });
    }
  },

  // 自动语音聊天开关
  onAutoVoiceToggle(e) {
    const enabled = e.detail.value;
    this.setData({
      autoVoiceEnabled: enabled
    });
    
    app.updateSettings({
      autoVoiceEnabled: enabled
    });
    
    wx.showToast({
      title: enabled ? '自动语音聊天已开启' : '自动语音聊天已关闭',
      icon: 'none'
    });
  },

  // 自动播放开关
  onAutoPlayToggle(e) {
    const enabled = e.detail.value;
    this.setData({
      autoPlay: enabled
    });
    
    app.updateSettings({
      autoPlay: enabled
    });
  },

  // 学习提醒开关
  onReminderToggle(e) {
    const enabled = e.detail.value;
    this.setData({
      learningReminder: enabled
    });
    
    app.updateSettings({
      learningReminder: enabled
    });
    
    if (enabled) {
      this.setupLearningReminder();
    } else {
      this.cancelLearningReminder();
    }
  },

  // 应用主题
  applyTheme(theme) {
    const themeColors = {
      pink: { primary: '#FF6B9D', secondary: '#FF8E9B' },
      blue: { primary: '#4A90E2', secondary: '#6BB6FF' },
      green: { primary: '#7ED321', secondary: '#96E065' },
      purple: { primary: '#9013FE', secondary: '#A855F7' },
      orange: { primary: '#F5A623', secondary: '#FFB347' },
      cyan: { primary: '#50E3C2', secondary: '#64FFDA' }
    };
    
    const colors = themeColors[theme];
    if (colors) {
      // 这里可以动态更新页面的主题色彩
      // 由于小程序限制，主要通过CSS变量或重新设置页面样式
      console.log('应用主题色彩:', colors);
    }
  },

  // 应用字体大小
  applyFontSize(size) {
    const fontSizeMap = {
      small: '24rpx',
      medium: '28rpx',
      large: '32rpx',
      xlarge: '36rpx'
    };
    
    const fontSize = fontSizeMap[size];
    if (fontSize) {
      // 这里可以动态更新页面的字体大小
      console.log('应用字体大小:', fontSize);
    }
  },

  // 设置学习提醒
  setupLearningReminder() {
    // 设置每日学习提醒
    wx.requestSubscribeMessage({
      tmplIds: ['learning_reminder_tmpl_id'],
      success: (res) => {
        console.log('订阅消息成功', res);
      },
      fail: (err) => {
        console.log('订阅消息失败', err);
      }
    });
  },

  // 取消学习提醒
  cancelLearningReminder() {
    // 取消订阅消息
    console.log('取消学习提醒');
  },

  // 重置进度
  resetProgress() {
    wx.showModal({
      title: '确认重置',
      content: '确定要重置所有学习进度吗？此操作不可恢复。',
      success: (res) => {
        if (res.confirm) {
          // 重置所有数据
          app.updateSettings({
            totalScore: 0,
            streak: 0,
            todayPractice: 0,
            totalPractice: 0
          });
          
          // 清除本地存储
          wx.removeStorageSync('userSettings');
          wx.removeStorageSync('lastPractice');
          
          this.refreshStats();
          
          wx.showToast({
            title: '进度已重置',
            icon: 'success'
          });
        }
      }
    });
  },

  // 显示关于我们
  showAbout() {
    wx.showModal({
      title: '关于AI英语小助教',
      content: 'AI英语小助教是一款专为5-10岁儿童设计的英语学习应用。通过AI技术，为孩子提供个性化的英语学习体验，让孩子在轻松愉快的环境中学习英语。',
      showCancel: false,
      confirmText: '知道了'
    });
  },

  // 显示使用帮助
  showHelp() {
    wx.navigateTo({
      url: '/pages/help/help'
    });
  },

  // 联系我们
  contactUs() {
    wx.showModal({
      title: '联系我们',
      content: '如有问题或建议，请通过以下方式联系我们：\n\n邮箱：support@ai-english-helper.com\n微信：AI-English-Helper',
      showCancel: false,
      confirmText: '知道了'
    });
  },

  // 分享应用
  shareApp() {
    return {
      title: 'AI英语小助教 - 让孩子快乐学英语',
      path: '/pages/index/index',
      imageUrl: '/images/share-cover.png'
    };
  },

  // 保存设置
  saveSettings() {
    // 保存所有设置到本地存储
    const settings = {
      childAge: parseInt(this.data.ageOptions[this.data.ageIndex]),
      difficulty: ['easy', 'medium', 'hard'][this.data.difficultyIndex],
      aiPersonality: ['friendly', 'encouraging', 'playful', 'patient'][this.data.personalityIndex],
      voiceEnabled: this.data.voiceEnabled,
      autoVoiceEnabled: this.data.autoVoiceEnabled,
      autoPlay: this.data.autoPlay,
      learningReminder: this.data.learningReminder,
      dailyTarget: parseInt(this.data.targetOptions[this.data.targetIndex]),
      theme: this.data.theme,
      fontSize: this.data.fontSize
    };
    
    app.updateSettings(settings);
    
    wx.showToast({
      title: '设置已保存',
      icon: 'success'
    });
    
    // 延迟返回上一页
    setTimeout(() => {
      wx.navigateBack();
    }, 1500);
  },

  // 分享功能
  onShareAppMessage() {
    return this.shareApp();
  }
});
