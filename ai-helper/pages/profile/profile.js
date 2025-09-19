// 个人资料页面逻辑
const app = getApp();

Page({
  data: {
    userInfo: {},
    currentLevel: 1,
    levelProgress: 0,
    totalScore: 0,
    streak: 0,
    totalPractice: 0,
    learnedWords: 0,
    achievements: [],
    currentMonth: '',
    calendarDays: [],
    recentRecords: [],
    goals: []
  },

  onLoad() {
    console.log('个人资料页面加载');
    this.initPage();
  },

  onShow() {
    this.refreshData();
  },

  // 初始化页面
  initPage() {
    this.getUserInfo();
    this.loadStats();
    this.loadAchievements();
    this.initCalendar();
    this.loadRecentRecords();
    this.loadGoals();
  },

  // 刷新数据
  refreshData() {
    this.loadStats();
    this.loadAchievements();
    this.loadRecentRecords();
    this.loadGoals();
  },

  // 获取用户信息
  getUserInfo() {
    const userInfo = wx.getStorageSync('userInfo') || {
      nickName: '小朋友',
      avatarUrl: '/images/default-avatar.png'
    };
    this.setData({
      userInfo: userInfo
    });
  },

  // 加载统计数据
  loadStats() {
    const globalData = app.globalData;
    const currentLevel = Math.floor(globalData.totalScore / 100) + 1;
    const levelProgress = globalData.totalScore % 100;
    
    this.setData({
      currentLevel: currentLevel,
      levelProgress: levelProgress,
      totalScore: globalData.totalScore,
      streak: globalData.streak,
      totalPractice: globalData.totalPractice || 0,
      learnedWords: Math.floor(globalData.totalScore / 10) // 每10分学会1个单词
    });
  },

  // 加载成就数据
  loadAchievements() {
    const globalData = app.globalData;
    const achievements = [
      {
        id: 1,
        name: "初学者",
        icon: "🌱",
        target: 1,
        progress: globalData.todayPractice > 0 ? 1 : 0,
        unlocked: globalData.todayPractice > 0
      },
      {
        id: 2,
        name: "坚持者",
        icon: "🔥",
        target: 3,
        progress: Math.min(globalData.streak, 3),
        unlocked: globalData.streak >= 3
      },
      {
        id: 3,
        name: "词汇达人",
        icon: "📚",
        target: 50,
        progress: Math.min(Math.floor(globalData.totalScore / 10), 50),
        unlocked: Math.floor(globalData.totalScore / 10) >= 50
      },
      {
        id: 4,
        name: "对话高手",
        icon: "💬",
        target: 100,
        progress: Math.min(globalData.totalPractice || 0, 100),
        unlocked: (globalData.totalPractice || 0) >= 100
      },
      {
        id: 5,
        name: "学习之星",
        icon: "⭐",
        target: 500,
        progress: Math.min(globalData.totalScore, 500),
        unlocked: globalData.totalScore >= 500
      },
      {
        id: 6,
        name: "英语大师",
        icon: "👑",
        target: 1000,
        progress: Math.min(globalData.totalScore, 1000),
        unlocked: globalData.totalScore >= 1000
      }
    ];
    
    this.setData({
      achievements: achievements
    });
  },

  // 初始化日历
  initCalendar() {
    const now = new Date();
    this.setData({
      currentMonth: this.formatMonth(now)
    });
    this.generateCalendar(now);
  },

  // 生成日历
  generateCalendar(date) {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDay = firstDay.getDay();
    
    const calendarDays = [];
    
    // 添加空白天数
    for (let i = 0; i < startDay; i++) {
      calendarDays.push({ day: '', hasPractice: false, isToday: false });
    }
    
    // 添加月份天数
    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(year, month, day);
      const isToday = currentDate.toDateString() === today.toDateString();
      const hasPractice = this.checkPracticeDay(year, month, day);
      
      calendarDays.push({
        day: day,
        hasPractice: hasPractice,
        isToday: isToday
      });
    }
    
    this.setData({
      calendarDays: calendarDays
    });
  },

  // 检查某天是否有练习
  checkPracticeDay(year, month, day) {
    const dateStr = new Date(year, month, day).toDateString();
    const practiceHistory = wx.getStorageSync('practiceHistory') || [];
    return practiceHistory.includes(dateStr);
  },

  // 格式化月份
  formatMonth(date) {
    const months = [
      '一月', '二月', '三月', '四月', '五月', '六月',
      '七月', '八月', '九月', '十月', '十一月', '十二月'
    ];
    return `${date.getFullYear()}年${months[date.getMonth()]}`;
  },

  // 加载最近学习记录
  loadRecentRecords() {
    const records = [
      {
        id: 1,
        icon: '🎤',
        title: '语音对话练习',
        description: '与AI老师进行了5分钟对话',
        time: '2小时前',
        score: 15
      },
      {
        id: 2,
        icon: '📚',
        title: '单词学习',
        description: '学会了3个新单词：apple, banana, orange',
        time: '昨天',
        score: 30
      },
      {
        id: 3,
        icon: '💬',
        title: '日常对话',
        description: '练习了问候语和自我介绍',
        time: '3天前',
        score: 20
      },
      {
        id: 4,
        icon: '🎮',
        title: '趣味游戏',
        description: '通过游戏学习了颜色单词',
        time: '5天前',
        score: 25
      }
    ];
    
    this.setData({
      recentRecords: records
    });
  },

  // 加载学习目标
  loadGoals() {
    const globalData = app.globalData;
    const goals = [
      {
        id: 1,
        title: '每日练习',
        current: globalData.todayPractice || 0,
        target: 5,
        progress: Math.min(((globalData.todayPractice || 0) / 5) * 100, 100),
        completed: (globalData.todayPractice || 0) >= 5
      },
      {
        id: 2,
        title: '连续学习',
        current: globalData.streak || 0,
        target: 7,
        progress: Math.min(((globalData.streak || 0) / 7) * 100, 100),
        completed: (globalData.streak || 0) >= 7
      },
      {
        id: 3,
        title: '学会单词',
        current: Math.floor(globalData.totalScore / 10),
        target: 100,
        progress: Math.min((Math.floor(globalData.totalScore / 10) / 100) * 100, 100),
        completed: Math.floor(globalData.totalScore / 10) >= 100
      },
      {
        id: 4,
        title: '获得分数',
        current: globalData.totalScore || 0,
        target: 1000,
        progress: Math.min(((globalData.totalScore || 0) / 1000) * 100, 100),
        completed: (globalData.totalScore || 0) >= 1000
      }
    ];
    
    this.setData({
      goals: goals
    });
  },

  // 上一月
  prevMonth() {
    const currentDate = new Date();
    currentDate.setMonth(currentDate.getMonth() - 1);
    this.setData({
      currentMonth: this.formatMonth(currentDate)
    });
    this.generateCalendar(currentDate);
  },

  // 下一月
  nextMonth() {
    const currentDate = new Date();
    currentDate.setMonth(currentDate.getMonth() + 1);
    this.setData({
      currentMonth: this.formatMonth(currentDate)
    });
    this.generateCalendar(currentDate);
  },

  // 更换头像
  changeAvatar() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFilePaths[0];
        
        // 这里应该上传到服务器并获取新的头像URL
        // 暂时使用本地路径
        this.setData({
          'userInfo.avatarUrl': tempFilePath
        });
        
        // 保存到本地存储
        wx.setStorageSync('userInfo', this.data.userInfo);
        
        wx.showToast({
          title: '头像已更新',
          icon: 'success'
        });
      },
      fail: (err) => {
        console.error('选择头像失败', err);
        wx.showToast({
          title: '选择头像失败',
          icon: 'none'
        });
      }
    });
  },

  // 开始练习
  startPractice() {
    wx.switchTab({
      url: '/pages/chat/chat'
    });
  },

  // 查看进度
  viewProgress() {
    wx.navigateTo({
      url: '/pages/progress/progress'
    });
  },

  // 分享成绩
  shareProgress() {
    return {
      title: `我在AI英语小助教已经学习了${this.data.totalScore}分，连续学习${this.data.streak}天！`,
      path: '/pages/index/index',
      imageUrl: '/images/share-progress.png'
    };
  },

  // 分享功能
  onShareAppMessage() {
    return this.shareProgress();
  }
});
