// 语音聊天管理器 - 支持AI主动发起对话
class VoiceChatManager {
  constructor() {
    this.isActive = false;
    this.chatInterval = null;
    this.audioContext = null;
    this.currentConversation = null;
    this.autoChatSettings = {
      enabled: true,
      interval: 30000, // 30秒间隔
      maxAttempts: 3,
      retryDelay: 5000
    };
    this.conversationTemplates = [];
    this.init();
  }

  // 初始化语音聊天管理器
  init() {
    this.audioContext = wx.createInnerAudioContext();
    this.setupAudioEvents();
    this.loadConversationTemplates();
  }

  // 设置音频事件
  setupAudioEvents() {
    this.audioContext.onPlay(() => {
      console.log('AI语音开始播放');
    });

    this.audioContext.onEnded(() => {
      console.log('AI语音播放结束');
      this.onVoicePlayEnded();
    });

    this.audioContext.onError((err) => {
      console.error('AI语音播放错误', err);
      this.onVoicePlayError(err);
    });
  }

  // 加载对话模板
  loadConversationTemplates() {
    this.conversationTemplates = [
      {
        id: 'greeting',
        title: '问候对话',
        content: {
          text: "Hello there! How are you feeling today? 🌟",
          translation: "你好！你今天感觉怎么样？",
          tip: "试着用英语回答：I'm fine, thank you!",
          audioUrl: ""
        },
        triggers: ['morning', 'afternoon', 'evening'],
        priority: 1
      },
      {
        id: 'encouragement',
        title: '鼓励学习',
        content: {
          text: "I noticed you haven't practiced today. Let's learn something new together! 💪",
          translation: "我注意到你今天还没有练习。让我们一起学习新知识吧！",
          tip: "每天坚持练习，你会越来越棒的！",
          audioUrl: ""
        },
        triggers: ['no_practice'],
        priority: 2
      },
      {
        id: 'vocabulary',
        title: '词汇学习',
        content: {
          text: "Do you know what color this is? It's red! Can you say 'red'? 🔴",
          translation: "你知道这是什么颜色吗？是红色！你能说'red'吗？",
          tip: "学习颜色单词：red, blue, green, yellow",
          audioUrl: ""
        },
        triggers: ['vocabulary_practice'],
        priority: 3
      },
      {
        id: 'story_time',
        title: '故事时间',
        content: {
          text: "Would you like to hear a story? Once upon a time, there was a little cat... 🐱",
          translation: "你想听故事吗？从前，有一只小猫...",
          tip: "故事是学习英语的好方法！",
          audioUrl: ""
        },
        triggers: ['story_time'],
        priority: 4
      },
      {
        id: 'game_invitation',
        title: '游戏邀请',
        content: {
          text: "Let's play a fun game! Can you find something blue in your room? 🎮",
          translation: "我们来玩个有趣的游戏吧！你能在房间里找到蓝色的东西吗？",
          tip: "游戏让学习更有趣！",
          audioUrl: ""
        },
        triggers: ['game_time'],
        priority: 5
      },
      {
        id: 'progress_celebration',
        title: '进步庆祝',
        content: {
          text: "Wow! You've learned so much! I'm so proud of you! 🎉",
          translation: "哇！你学到了这么多！我为你感到骄傲！",
          tip: "继续努力，你会成为英语小能手！",
          audioUrl: ""
        },
        triggers: ['progress_milestone'],
        priority: 6
      }
    ];
  }

  // 开始自动语音聊天
  startAutoVoiceChat(settings = {}) {
    const mergedSettings = { ...this.autoChatSettings, ...settings };
    
    if (this.isActive) {
      console.log('语音聊天已经在进行中');
      return;
    }

    this.isActive = true;
    this.autoChatSettings = mergedSettings;

    console.log('开始自动语音聊天', mergedSettings);

    // 立即发起第一次对话
    this.initiateVoiceConversation();

    // 设置定时器
    this.chatInterval = setInterval(() => {
      this.initiateVoiceConversation();
    }, mergedSettings.interval);

    // 监听应用状态变化
    this.setupAppStateListener();
  }

  // 停止自动语音聊天
  stopAutoVoiceChat() {
    if (!this.isActive) {
      return;
    }

    this.isActive = false;
    
    if (this.chatInterval) {
      clearInterval(this.chatInterval);
      this.chatInterval = null;
    }

    if (this.audioContext) {
      this.audioContext.stop();
    }

    console.log('自动语音聊天已停止');
  }

  // 发起语音对话
  async initiateVoiceConversation() {
    try {
      // 检查是否应该发起对话
      if (!this.shouldInitiateConversation()) {
        return;
      }

      // 选择合适的对话内容
      const conversation = this.selectConversation();
      if (!conversation) {
        console.log('没有找到合适的对话内容');
        return;
      }

      this.currentConversation = conversation;

      // 生成语音URL
      const audioUrl = await this.generateVoiceUrl(conversation.content.text);
      conversation.content.audioUrl = audioUrl;

      // 发送对话到聊天页面
      this.sendConversationToChat(conversation);

      // 播放语音
      await this.playVoice(audioUrl);

      // 更新用户状态
      this.updateUserEngagement();

    } catch (error) {
      console.error('发起语音对话失败', error);
      this.handleConversationError(error);
    }
  }

  // 检查是否应该发起对话
  shouldInitiateConversation() {
    // 检查用户是否在聊天页面
    const pages = getCurrentPages();
    const currentPage = pages[pages.length - 1];
    
    if (currentPage.route !== 'pages/chat/chat') {
      console.log('用户不在聊天页面，跳过语音对话');
      return false;
    }

    // 检查用户是否正在输入
    if (currentPage.data && currentPage.data.isRecording) {
      console.log('用户正在录音，跳过语音对话');
      return false;
    }

    // 检查是否刚刚有过对话
    const lastConversationTime = wx.getStorageSync('lastConversationTime') || 0;
    const now = Date.now();
    if (now - lastConversationTime < 10000) { // 10秒内不重复
      return false;
    }

    return true;
  }

  // 选择对话内容
  selectConversation() {
    const globalData = getApp().globalData;
    const age = globalData.childAge;
    const difficulty = globalData.difficulty;
    const personality = globalData.aiPersonality;

    // 根据时间选择不同类型的对话
    const hour = new Date().getHours();
    let preferredTypes = [];

    if (hour >= 6 && hour < 12) {
      preferredTypes = ['greeting', 'encouragement', 'vocabulary'];
    } else if (hour >= 12 && hour < 18) {
      preferredTypes = ['game_invitation', 'story_time', 'vocabulary'];
    } else {
      preferredTypes = ['story_time', 'progress_celebration', 'greeting'];
    }

    // 检查学习进度
    const todayPractice = globalData.todayPractice || 0;
    if (todayPractice === 0) {
      preferredTypes.unshift('encouragement');
    }

    // 根据年龄和难度过滤对话
    const suitableConversations = this.conversationTemplates.filter(conv => {
      return this.isConversationSuitable(conv, age, difficulty, personality);
    });

    // 优先选择符合时间偏好的对话
    const preferredConversations = suitableConversations.filter(conv => 
      preferredTypes.includes(conv.id)
    );

    const finalConversations = preferredConversations.length > 0 
      ? preferredConversations 
      : suitableConversations;

    if (finalConversations.length === 0) {
      return null;
    }

    // 随机选择一个对话
    return finalConversations[Math.floor(Math.random() * finalConversations.length)];
  }

  // 检查对话是否适合
  isConversationSuitable(conversation, age, difficulty, personality) {
    // 根据年龄调整内容复杂度
    if (age >= 5 && age <= 7) {
      return conversation.content.text.length < 100; // 简短句子
    } else {
      return conversation.content.text.length >= 50; // 较长句子
    }
  }

  // 生成语音URL
  async generateVoiceUrl(text) {
    try {
      // 这里应该调用真实的TTS API
      // 暂时返回模拟URL
      const voiceOptions = {
        voice: 'child',
        speed: 0.9,
        pitch: 1.1
      };

      return `https://api.example.com/tts?text=${encodeURIComponent(text)}&voice=${voiceOptions.voice}&speed=${voiceOptions.speed}&pitch=${voiceOptions.pitch}`;
    } catch (error) {
      console.error('生成语音URL失败', error);
      return '';
    }
  }

  // 播放语音
  async playVoice(audioUrl) {
    if (!audioUrl) {
      console.log('没有语音URL，跳过播放');
      return;
    }

    return new Promise((resolve, reject) => {
      this.audioContext.src = audioUrl;
      
      const onEnd = () => {
        this.audioContext.offEnded(onEnd);
        this.audioContext.offError(onError);
        resolve();
      };

      const onError = (err) => {
        this.audioContext.offEnded(onEnd);
        this.audioContext.offError(onError);
        reject(err);
      };

      this.audioContext.onEnded(onEnd);
      this.audioContext.onError(onError);
      
      this.audioContext.play();
    });
  }

  // 发送对话到聊天页面
  sendConversationToChat(conversation) {
    // 通过事件总线发送到聊天页面
    const eventChannel = this.getEventChannel();
    if (eventChannel) {
      eventChannel.emit('aiVoiceMessage', {
        type: 'ai',
        text: conversation.content.text,
        translation: conversation.content.translation,
        time: this.getCurrentTime(),
        audioUrl: conversation.content.audioUrl,
        tip: conversation.content.tip,
        id: Date.now()
      });
    }

    // 记录对话时间
    wx.setStorageSync('lastConversationTime', Date.now());
  }

  // 获取事件通道
  getEventChannel() {
    try {
      const pages = getCurrentPages();
      const chatPage = pages.find(page => page.route === 'pages/chat/chat');
      return chatPage ? chatPage.eventChannel : null;
    } catch (error) {
      console.error('获取事件通道失败', error);
      return null;
    }
  }

  // 语音播放结束处理
  onVoicePlayEnded() {
    console.log('AI语音播放结束');
    
    // 可以在这里添加后续逻辑，比如等待用户回应
    if (this.currentConversation) {
      this.scheduleFollowUp(this.currentConversation);
    }
  }

  // 语音播放错误处理
  onVoicePlayError(error) {
    console.error('AI语音播放错误', error);
    
    // 重试机制
    if (this.autoChatSettings.maxAttempts > 0) {
      this.autoChatSettings.maxAttempts--;
      setTimeout(() => {
        this.initiateVoiceConversation();
      }, this.autoChatSettings.retryDelay);
    }
  }

  // 安排后续对话
  scheduleFollowUp(conversation) {
    // 根据对话类型安排后续内容
    const followUpDelay = this.getFollowUpDelay(conversation.id);
    
    if (followUpDelay > 0) {
      setTimeout(() => {
        this.initiateFollowUpConversation(conversation);
      }, followUpDelay);
    }
  }

  // 获取后续对话延迟
  getFollowUpDelay(conversationId) {
    const delays = {
      'greeting': 15000,      // 15秒后询问感受
      'encouragement': 20000, // 20秒后提供帮助
      'vocabulary': 10000,    // 10秒后重复词汇
      'story_time': 30000,    // 30秒后继续故事
      'game_invitation': 25000, // 25秒后检查游戏结果
      'progress_celebration': 0 // 不需要后续
    };

    return delays[conversationId] || 0;
  }

  // 发起后续对话
  async initiateFollowUpConversation(originalConversation) {
    const followUpTemplates = {
      'greeting': [
        {
          text: "Are you ready to learn something new today?",
          translation: "你准备好学习新知识了吗？",
          tip: "回答：Yes, I'm ready!"
        }
      ],
      'encouragement': [
        {
          text: "I can help you practice. What would you like to learn?",
          translation: "我可以帮你练习。你想学什么呢？",
          tip: "可以说：I want to learn colors!"
        }
      ],
      'vocabulary': [
        {
          text: "Can you say 'red' again? Great job!",
          translation: "你能再说一遍'red'吗？太棒了！",
          tip: "重复练习让记忆更深刻！"
        }
      ]
    };

    const templates = followUpTemplates[originalConversation.id];
    if (templates && templates.length > 0) {
      const followUp = templates[Math.floor(Math.random() * templates.length)];
      
      const followUpConversation = {
        id: `${originalConversation.id}_followup`,
        content: {
          ...followUp,
          audioUrl: ''
        }
      };

      await this.initiateVoiceConversation();
    }
  }

  // 更新用户参与度
  updateUserEngagement() {
    const globalData = getApp().globalData;
    
    // 增加主动对话计数
    globalData.autoChatCount = (globalData.autoChatCount || 0) + 1;
    
    // 更新用户活跃度
    globalData.lastActiveTime = Date.now();
    
    // 保存到本地存储
    wx.setStorageSync('userSettings', globalData);
  }

  // 设置应用状态监听
  setupAppStateListener() {
    // 监听应用进入后台/前台
    wx.onAppShow(() => {
      console.log('应用进入前台，恢复语音聊天');
      if (this.isActive) {
        this.startAutoVoiceChat();
      }
    });

    wx.onAppHide(() => {
      console.log('应用进入后台，暂停语音聊天');
      this.stopAutoVoiceChat();
    });
  }

  // 处理对话错误
  handleConversationError(error) {
    console.error('对话错误处理', error);
    
    // 可以在这里添加错误恢复逻辑
    // 比如切换到文本模式，或者降低对话频率
  }

  // 获取当前时间
  getCurrentTime() {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  }

  // 销毁资源
  destroy() {
    this.stopAutoVoiceChat();
    
    if (this.audioContext) {
      this.audioContext.destroy();
      this.audioContext = null;
    }
  }

  // 获取语音聊天状态
  getStatus() {
    return {
      isActive: this.isActive,
      settings: this.autoChatSettings,
      currentConversation: this.currentConversation
    };
  }

  // 更新设置
  updateSettings(newSettings) {
    this.autoChatSettings = { ...this.autoChatSettings, ...newSettings };
    
    // 如果正在运行，重启以应用新设置
    if (this.isActive) {
      this.stopAutoVoiceChat();
      this.startAutoVoiceChat(this.autoChatSettings);
    }
  }
}

// 导出语音聊天管理器
module.exports = {
  VoiceChatManager
};
