const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // 基本信息
  openId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  unionId: {
    type: String,
    sparse: true
  },
  nickname: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  avatar: {
    type: String,
    default: ''
  },
  gender: {
    type: Number,
    enum: [0, 1, 2], // 0: 未知, 1: 男, 2: 女
    default: 0
  },
  language: {
    type: String,
    default: 'zh_CN'
  },
  city: {
    type: String,
    default: ''
  },
  province: {
    type: String,
    default: ''
  },
  country: {
    type: String,
    default: ''
  },

  // 学习设置
  childAge: {
    type: Number,
    required: true,
    min: 5,
    max: 10,
    default: 6
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'easy'
  },
  aiPersonality: {
    type: String,
    enum: ['friendly', 'encouraging', 'playful', 'patient'],
    default: 'friendly'
  },
  
  // 功能设置
  voiceEnabled: {
    type: Boolean,
    default: true
  },
  autoVoiceEnabled: {
    type: Boolean,
    default: true
  },
  autoPlay: {
    type: Boolean,
    default: true
  },
  learningReminder: {
    type: Boolean,
    default: true
  },
  dailyTarget: {
    type: Number,
    default: 5,
    min: 1,
    max: 20
  },
  theme: {
    type: String,
    default: 'pink'
  },
  fontSize: {
    type: String,
    enum: ['small', 'medium', 'large', 'xlarge'],
    default: 'medium'
  },

  // 学习统计
  totalScore: {
    type: Number,
    default: 0
  },
  streak: {
    type: Number,
    default: 0
  },
  todayPractice: {
    type: Number,
    default: 0
  },
  totalPractice: {
    type: Number,
    default: 0
  },
  lastPracticeDate: {
    type: Date
  },

  // 成就系统
  achievements: [{
    id: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    unlockedAt: {
      type: Date,
      default: Date.now
    },
    progress: {
      type: Number,
      default: 0
    }
  }],

  // 学习记录
  learningHistory: [{
    date: {
      type: Date,
      required: true
    },
    practiceCount: {
      type: Number,
      default: 0
    },
    scoreGained: {
      type: Number,
      default: 0
    },
    topicsLearned: [String],
    achievementsUnlocked: [String]
  }],

  // 状态
  isActive: {
    type: Boolean,
    default: true
  },
  lastLoginAt: {
    type: Date,
    default: Date.now
  },
  lastActiveAt: {
    type: Date,
    default: Date.now
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
userSchema.index({ openId: 1 });
userSchema.index({ lastActiveAt: -1 });
userSchema.index({ totalScore: -1 });
userSchema.index({ createdAt: -1 });

// 虚拟字段
userSchema.virtual('currentLevel').get(function() {
  return Math.floor(this.totalScore / 100) + 1;
});

userSchema.virtual('levelProgress').get(function() {
  return this.totalScore % 100;
});

userSchema.virtual('learnedWords').get(function() {
  return Math.floor(this.totalScore / 10);
});

// 实例方法
userSchema.methods.updateLastActive = function() {
  this.lastActiveAt = new Date();
  return this.save();
};

userSchema.methods.addScore = function(points) {
  this.totalScore += points;
  this.todayPractice += 1;
  this.totalPractice += 1;
  this.lastActiveAt = new Date();
  return this.save();
};

userSchema.methods.resetDailyPractice = function() {
  this.todayPractice = 0;
  this.lastPracticeDate = new Date();
  return this.save();
};

userSchema.methods.addAchievement = function(achievementId, achievementName) {
  const existingAchievement = this.achievements.find(a => a.id === achievementId);
  if (!existingAchievement) {
    this.achievements.push({
      id: achievementId,
      name: achievementName,
      unlockedAt: new Date()
    });
  }
  return this.save();
};

userSchema.methods.updateStreak = function() {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (!this.lastPracticeDate) {
    this.streak = 1;
  } else {
    const lastPractice = new Date(this.lastPracticeDate);
    const daysDiff = Math.floor((today - lastPractice) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === 1) {
      this.streak += 1;
    } else if (daysDiff > 1) {
      this.streak = 1;
    }
  }
  
  this.lastPracticeDate = today;
  return this.save();
};

// 静态方法
userSchema.statics.findByOpenId = function(openId) {
  return this.findOne({ openId });
};

userSchema.statics.findTopUsers = function(limit = 10) {
  return this.find({ isActive: true })
    .sort({ totalScore: -1 })
    .limit(limit)
    .select('nickname avatar totalScore currentLevel');
};

// 中间件
userSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

userSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: new Date() });
  next();
});

module.exports = mongoose.model('User', userSchema);
