// 聊天页面逻辑
const app = getApp();
const { VoiceChatManager } = require('../../utils/voiceChatManager');
const { AIVoiceService } = require('../../utils/aiVoiceService');

Page({
  data: {
    messages: [],
    inputText: '',
    voiceMode: true, // 默认语音模式
    isRecording: false,
    isTyping: false,
    scrollTop: 0,
    scrollIntoView: '',
    userInfo: {},
    showQuickReplies: true,
    quickReplies: [
      'Hello!',
      'How are you?',
      'What\'s your name?',
      'I\'m fine, thank you!',
      'Nice to meet you!'
    ],
    showLearningTip: false,
    learningTip: '',
    recorderManager: null,
    audioContext: null,
    voiceChatManager: null,
    autoVoiceEnabled: true,
    isPlayingAI: false,
    aiVoiceService: null
  },

  onLoad() {
    console.log('聊天页面加载');
    this.initPage();
  },

  onShow() {
    // 页面显示时启动自动语音聊天
    this.startAutoVoiceChat();
  },

  onHide() {
    // 页面隐藏时停止自动语音聊天
    this.stopAutoVoiceChat();
  },

  onUnload() {
    // 清理资源
    this.stopAutoVoiceChat();
    if (this.data.recorderManager) {
      this.data.recorderManager.stop();
    }
    if (this.data.audioContext) {
      this.data.audioContext.destroy();
    }
    if (this.data.voiceChatManager) {
      this.data.voiceChatManager.destroy();
    }
  },

  // 初始化页面
  initPage() {
    // 初始化录音管理器
    this.initRecorderManager();
    
    // 初始化音频播放器
    this.initAudioContext();
    
    // 初始化语音聊天管理器
    this.initVoiceChatManager();
    
    // 初始化AI语音服务
    this.initAIVoiceService();
    
    // 获取用户信息
    this.getUserInfo();
    
    // 发送欢迎消息
    this.sendWelcomeMessage();
    
    // 加载快捷回复
    this.loadQuickReplies();
    
    // 设置事件监听
    this.setupEventListeners();
  },

  // 初始化录音管理器
  initRecorderManager() {
    const recorderManager = wx.getRecorderManager();
    
    recorderManager.onStart(() => {
      console.log('录音开始');
      this.setData({
        isRecording: true
      });
    });

    recorderManager.onStop((res) => {
      console.log('录音结束', res);
      this.setData({
        isRecording: false
      });
      this.processVoiceInput(res.tempFilePath);
    });

    recorderManager.onError((err) => {
      console.error('录音错误', err);
      this.setData({
        isRecording: false
      });
      wx.showToast({
        title: '录音失败，请重试',
        icon: 'none'
      });
    });

    this.setData({
      recorderManager: recorderManager
    });
  },

  // 初始化音频播放器
  initAudioContext() {
    const audioContext = wx.createInnerAudioContext();
    
    audioContext.onError((err) => {
      console.error('音频播放错误', err);
    });

    this.setData({
      audioContext: audioContext
    });
  },

  // 初始化语音聊天管理器
  initVoiceChatManager() {
    const voiceChatManager = new VoiceChatManager();
    
    // 设置语音聊天管理器的事件处理
    voiceChatManager.onVoicePlayEnded = () => {
      this.setData({
        isPlayingAI: false
      });
    };

    voiceChatManager.onVoicePlayError = (error) => {
      this.setData({
        isPlayingAI: false
      });
      console.error('AI语音播放错误', error);
    };

    this.setData({
      voiceChatManager: voiceChatManager
    });
  },

  // 初始化AI语音服务
  initAIVoiceService() {
    const aiVoiceService = new AIVoiceService();
    
    // 运行功能测试
    aiVoiceService.runFullTest()
      .then(results => {
        console.log('AI语音服务测试结果:', results);
        if (results.overall) {
          console.log('AI语音服务初始化成功');
        } else {
          console.warn('AI语音服务部分功能不可用:', results);
        }
      })
      .catch(error => {
        console.error('AI语音服务测试失败:', error);
      });

    this.setData({
      aiVoiceService: aiVoiceService
    });
  },

  // 设置事件监听
  setupEventListeners() {
    // 监听AI主动语音消息
    this.data.voiceChatManager.eventChannel = {
      emit: (event, data) => {
        if (event === 'aiVoiceMessage') {
          this.handleAIVoiceMessage(data);
        }
      }
    };
  },

  // 处理AI主动语音消息
  handleAIVoiceMessage(messageData) {
    // 添加AI消息到聊天列表
    this.addMessage(messageData);
    
    // 滚动到底部
    this.scrollToBottom();
    
    // 如果启用了自动播放，播放语音
    if (this.data.autoVoiceEnabled && messageData.audioUrl) {
      this.setData({
        isPlayingAI: true
      });
      this.playAudio({ currentTarget: { dataset: { url: messageData.audioUrl } } });
    }
  },

  // 启动自动语音聊天
  startAutoVoiceChat() {
    if (!this.data.autoVoiceEnabled) {
      return;
    }

    const settings = {
      enabled: true,
      interval: 30000, // 30秒间隔
      maxAttempts: 3,
      retryDelay: 5000
    };

    this.data.voiceChatManager.startAutoVoiceChat(settings);
    console.log('自动语音聊天已启动');
  },

  // 停止自动语音聊天
  stopAutoVoiceChat() {
    if (this.data.voiceChatManager) {
      this.data.voiceChatManager.stopAutoVoiceChat();
      console.log('自动语音聊天已停止');
    }
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

  // 发送欢迎消息
  sendWelcomeMessage() {
    const welcomeMessages = [
      {
        type: 'ai',
        text: `Hello! I'm your AI English teacher! 🌟`,
        translation: '你好！我是你的AI英语老师！',
        time: this.getCurrentTime(),
        id: Date.now()
      },
      {
        type: 'system',
        text: '点击快捷回复开始对话，或按住麦克风按钮说话',
        id: Date.now() + 1
      }
    ];

    this.setData({
      messages: welcomeMessages
    });

    this.scrollToBottom();
  },

  // 加载快捷回复
  loadQuickReplies() {
    const age = app.globalData.childAge;
    let quickReplies = [];

    if (age >= 5 && age <= 7) {
      quickReplies = [
        'Hello!',
        'How are you?',
        'What\'s your name?',
        'I\'m fine!',
        'Thank you!',
        'Goodbye!'
      ];
    } else if (age >= 8 && age <= 10) {
      quickReplies = [
        'Hello! How are you today?',
        'What\'s your favorite color?',
        'Can you help me?',
        'I love learning English!',
        'Nice to meet you!',
        'See you later!'
      ];
    }

    this.setData({
      quickReplies: quickReplies
    });
  },

  // 输入文本变化
  onInputChange(e) {
    this.setData({
      inputText: e.detail.value
    });
  },

  // 发送文本消息
  sendTextMessage() {
    const text = this.data.inputText.trim();
    if (!text) return;

    // 添加用户消息
    this.addMessage({
      type: 'user',
      text: text,
      time: this.getCurrentTime()
    });

    // 清空输入框
    this.setData({
      inputText: ''
    });

    // 滚动到底部
    this.scrollToBottom();

    // 模拟AI回复
    this.simulateAIResponse(text);
  },

  // 开始录音
  startRecording() {
    if (!app.globalData.voiceEnabled) {
      wx.showToast({
        title: '请先开启语音功能',
        icon: 'none'
      });
      return;
    }

    const recorderManager = this.data.recorderManager;
    recorderManager.start({
      duration: 60000, // 最长60秒
      sampleRate: 16000,
      numberOfChannels: 1,
      encodeBitRate: 96000,
      format: 'mp3'
    });
  },

  // 停止录音
  stopRecording() {
    const recorderManager = this.data.recorderManager;
    recorderManager.stop();
  },

  // 取消录音
  cancelRecording() {
    const recorderManager = this.data.recorderManager;
    recorderManager.stop();
    this.setData({
      isRecording: false
    });
  },

  // 处理语音输入
  async processVoiceInput(filePath) {
    // 显示语音识别中
    this.setData({
      isTyping: true
    });

    try {
      // 使用AI语音服务处理语音
      const result = await this.data.aiVoiceService.processVoiceChat(filePath);
      
      this.setData({
        isTyping: false
      });

      if (result.success) {
        // 添加用户消息（显示识别到的文本）
        this.addMessage({
          type: 'user',
          text: result.recognizedText || '语音消息',
          time: this.getCurrentTime()
        });

        // 添加AI回复消息
        this.addMessage({
          type: 'ai',
          text: result.text,
          translation: result.translation,
          time: this.getCurrentTime(),
          audioUrl: result.audioUrl
        });

        this.scrollToBottom();

        // 显示学习提示
        if (result.tip) {
          this.showLearningTip(result.tip);
        }

        // 增加分数
        app.addScore(10);
        
        // 自动播放AI语音
        if (result.audioUrl && app.globalData.autoPlay) {
          this.setData({
            isPlayingAI: true
          });
          this.playAudio({ currentTarget: { dataset: { url: result.audioUrl } } });
        }
        
      } else {
        wx.showToast({
          title: '语音处理失败，请重试',
          icon: 'none'
        });
      }
    } catch (error) {
      console.error('语音处理错误:', error);
      this.setData({
        isTyping: false
      });
      
      wx.showToast({
        title: '语音处理出错，请重试',
        icon: 'none'
      });
    }
  },

  // 模拟语音识别
  simulateVoiceRecognition() {
    const responses = [
      'Hello!',
      'How are you?',
      'What\'s your name?',
      'I\'m fine, thank you!',
      'Nice to meet you!',
      'Good morning!',
      'Good afternoon!',
      'Good evening!',
      'Thank you very much!',
      'You\'re welcome!'
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  },

  // 模拟AI回复
  simulateAIResponse(userInput) {
    this.setData({
      isTyping: true
    });

    setTimeout(() => {
      const aiResponse = this.generateAIResponse(userInput);
      
      this.addMessage({
        type: 'ai',
        text: aiResponse.text,
        translation: aiResponse.translation,
        time: this.getCurrentTime(),
        audioUrl: aiResponse.audioUrl
      });

      this.setData({
        isTyping: false
      });

      this.scrollToBottom();

      // 增加分数
      app.addScore(10);

      // 显示学习提示
      this.showLearningTip(aiResponse.tip);
    }, 1500);
  },

  // 生成AI回复
  generateAIResponse(userInput) {
    const age = app.globalData.childAge;
    const difficulty = app.globalData.difficulty;
    
    // 根据年龄和难度生成回复
    const responses = this.getAgeAppropriateResponses(age, difficulty);
    const selectedResponse = responses[Math.floor(Math.random() * responses.length)];
    
    return {
      text: selectedResponse.text,
      translation: selectedResponse.translation,
      audioUrl: `https://api.example.com/tts?text=${encodeURIComponent(selectedResponse.text)}`,
      tip: selectedResponse.tip
    };
  },

  // 根据年龄获取合适的回应
  getAgeAppropriateResponses(age, difficulty) {
    if (age >= 5 && age <= 7) {
      return [
        {
          text: "Hello! I'm so happy to talk with you! 🌟",
          translation: "你好！我很高兴和你聊天！",
          tip: "记住要微笑哦，这样对话会更愉快！"
        },
        {
          text: "You speak English very well! Keep it up! ✨",
          translation: "你的英语说得很好！继续加油！",
          tip: "多说多练，你会越来越棒的！"
        },
        {
          text: "What's your favorite color? Mine is pink! 💖",
          translation: "你最喜欢什么颜色？我最喜欢粉色！",
          tip: "用英语表达自己的喜好，很有用呢！"
        }
      ];
    } else if (age >= 8 && age <= 10) {
      return [
        {
          text: "Excellent pronunciation! You're getting better every day!",
          translation: "发音很棒！你每天都在进步！",
          tip: "多练习发音，注意语调的变化！"
        },
        {
          text: "That's a great question! Let me help you understand.",
          translation: "这是个很好的问题！让我来帮你理解。",
          tip: "敢于提问是学习的好习惯！"
        },
        {
          text: "I can see you're working hard on your English. I'm proud of you!",
          translation: "我看到你在努力学习英语。我为你感到骄傲！",
          tip: "坚持学习，你会收获更多！"
        }
      ];
    }
    
    return [
      {
        text: "Great! Let's keep learning together!",
        translation: "很棒！让我们一起继续学习吧！",
        tip: "学习英语是一个有趣的过程！"
      }
    ];
  },

  // 添加消息
  addMessage(message) {
    const messages = this.data.messages;
    messages.push({
      ...message,
      id: Date.now() + Math.random()
    });
    
    this.setData({
      messages: messages
    });
  },

  // 播放音频
  playAudio(e) {
    const audioUrl = e.currentTarget.dataset.url;
    if (audioUrl && this.data.audioContext) {
      this.data.audioContext.src = audioUrl;
      this.data.audioContext.play();
    }
  },

  // 显示学习提示
  showLearningTip(tip) {
    if (tip) {
      this.setData({
        showLearningTip: true,
        learningTip: tip
      });
      
      // 3秒后自动隐藏
      setTimeout(() => {
        this.setData({
          showLearningTip: false
        });
      }, 3000);
    }
  },

  // 关闭学习提示
  closeLearningTip() {
    this.setData({
      showLearningTip: false
    });
  },

  // 选择快捷回复
  selectQuickReply(e) {
    const text = e.currentTarget.dataset.text;
    this.setData({
      inputText: text
    });
    this.sendTextMessage();
  },

  // 切换输入模式
  toggleInputMode() {
    this.setData({
      voiceMode: !this.data.voiceMode
    });
  },

  // 切换语音模式
  toggleVoiceMode() {
    app.updateSettings({
      voiceEnabled: !app.globalData.voiceEnabled
    });
    
    wx.showToast({
      title: app.globalData.voiceEnabled ? '语音已开启' : '语音已关闭',
      icon: 'none'
    });
  },

  // 切换自动语音聊天
  toggleAutoVoice() {
    const newState = !this.data.autoVoiceEnabled;
    this.setData({
      autoVoiceEnabled: newState
    });

    if (newState) {
      this.startAutoVoiceChat();
      wx.showToast({
        title: '自动语音聊天已开启',
        icon: 'success'
      });
    } else {
      this.stopAutoVoiceChat();
      wx.showToast({
        title: '自动语音聊天已关闭',
        icon: 'none'
      });
    }

    // 保存设置
    app.updateSettings({
      autoVoiceEnabled: newState
    });
  },

  // 显示设置
  showSettings() {
    wx.navigateTo({
      url: '/pages/settings/settings'
    });
  },

  // 滚动到底部
  scrollToBottom() {
    const query = wx.createSelectorQuery();
    query.select('.chat-messages').boundingClientRect();
    query.exec((res) => {
      if (res[0]) {
        this.setData({
          scrollTop: res[0].height
        });
      }
    });
  },

  // 获取当前时间
  getCurrentTime() {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  },

  // 分享功能
  onShareAppMessage() {
    return {
      title: 'AI英语小助教 - 让孩子快乐学英语',
      path: '/pages/index/index'
    };
  }
});
