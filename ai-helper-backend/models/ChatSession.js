const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['user', 'ai', 'system'],
    required: true
  },
  text: {
    type: String,
    required: true
  },
  translation: {
    type: String
  },
  audioUrl: {
    type: String
  },
  tip: {
    type: String
  },
  encouragement: {
    type: String
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
});

const chatSessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  sessionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  title: {
    type: String,
    default: '新的对话'
  },
  
  // 会话设置
  age: {
    type: Number,
    required: true,
    min: 5,
    max: 10
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    required: true
  },
  aiPersonality: {
    type: String,
    enum: ['friendly', 'encouraging', 'playful', 'patient'],
    required: true
  },
  
  // 对话消息
  messages: [chatMessageSchema],
  
  // 统计信息
  messageCount: {
    type: Number,
    default: 0
  },
  userMessageCount: {
    type: Number,
    default: 0
  },
  aiMessageCount: {
    type: Number,
    default: 0
  },
  scoreGained: {
    type: Number,
    default: 0
  },
  duration: {
    type: Number, // 会话持续时间（秒）
    default: 0
  },
  
  // 学习内容
  topicsCovered: [{
    topic: String,
    count: {
      type: Number,
      default: 1
    }
  }],
  vocabularyLearned: [{
    word: String,
    learnedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // 状态
  isActive: {
    type: Boolean,
    default: true
  },
  endedAt: {
    type: Date
  },
  
  // 系统字段
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 索引
chatSessionSchema.index({ userId: 1, createdAt: -1 });
chatSessionSchema.index({ sessionId: 1 });
chatSessionSchema.index({ isActive: 1, createdAt: -1 });

// 虚拟字段
chatSessionSchema.virtual('isEnded').get(function() {
  return !!this.endedAt;
});

chatSessionSchema.virtual('avgMessageLength').get(function() {
  if (this.messages.length === 0) return 0;
  const totalLength = this.messages.reduce((sum, msg) => sum + msg.text.length, 0);
  return Math.round(totalLength / this.messages.length);
});

// 实例方法
chatSessionSchema.methods.addMessage = function(messageData) {
  const message = {
    ...messageData,
    timestamp: new Date()
  };
  
  this.messages.push(message);
  this.messageCount += 1;
  
  if (message.type === 'user') {
    this.userMessageCount += 1;
  } else if (message.type === 'ai') {
    this.aiMessageCount += 1;
  }
  
  this.updatedAt = new Date();
  return this.save();
};

chatSessionSchema.methods.addScore = function(points) {
  this.scoreGained += points;
  this.updatedAt = new Date();
  return this.save();
};

chatSessionSchema.methods.addTopic = function(topic) {
  const existingTopic = this.topicsCovered.find(t => t.topic === topic);
  if (existingTopic) {
    existingTopic.count += 1;
  } else {
    this.topicsCovered.push({ topic, count: 1 });
  }
  this.updatedAt = new Date();
  return this.save();
};

chatSessionSchema.methods.addVocabulary = function(word) {
  const existingWord = this.vocabularyLearned.find(v => v.word === word);
  if (!existingWord) {
    this.vocabularyLearned.push({ word, learnedAt: new Date() });
  }
  this.updatedAt = new Date();
  return this.save();
};

chatSessionSchema.methods.endSession = function() {
  this.isActive = false;
  this.endedAt = new Date();
  this.updatedAt = new Date();
  return this.save();
};

chatSessionSchema.methods.updateDuration = function() {
  if (this.createdAt && !this.endedAt) {
    this.duration = Math.floor((new Date() - this.createdAt) / 1000);
  }
  this.updatedAt = new Date();
  return this.save();
};

// 静态方法
chatSessionSchema.statics.findByUserId = function(userId, limit = 20) {
  return this.find({ userId, isActive: false })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('userId', 'nickname avatar');
};

chatSessionSchema.statics.findActiveByUserId = function(userId) {
  return this.findOne({ userId, isActive: true })
    .populate('userId', 'nickname avatar');
};

chatSessionSchema.statics.getStatistics = function(userId) {
  return this.aggregate([
    { $match: { userId: mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        totalSessions: { $sum: 1 },
        totalMessages: { $sum: '$messageCount' },
        totalScore: { $sum: '$scoreGained' },
        avgDuration: { $avg: '$duration' },
        totalTopics: { $sum: { $size: '$topicsCovered' } },
        totalVocabulary: { $sum: { $size: '$vocabularyLearned' } }
      }
    }
  ]);
};

// 中间件
chatSessionSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

chatSessionSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: new Date() });
  next();
});

module.exports = mongoose.model('ChatSession', chatSessionSchema);
