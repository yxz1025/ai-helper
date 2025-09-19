const User = require('../models/User');
const ChatSession = require('../models/ChatSession');
const { logger } = require('../utils/logger');
const { AppError } = require('../middleware/errorHandler');

class UserController {
  // 获取用户信息
  async getProfile(req, res, next) {
    try {
      const user = req.user;

      res.json({
        success: true,
        data: {
          user: {
            id: user._id,
            nickname: user.nickname,
            avatar: user.avatar,
            gender: user.gender,
            language: user.language,
            city: user.city,
            province: user.province,
            country: user.country,
            childAge: user.childAge,
            difficulty: user.difficulty,
            aiPersonality: user.aiPersonality,
            voiceEnabled: user.voiceEnabled,
            autoVoiceEnabled: user.autoVoiceEnabled,
            autoPlay: user.autoPlay,
            learningReminder: user.learningReminder,
            dailyTarget: user.dailyTarget,
            theme: user.theme,
            fontSize: user.fontSize,
            totalScore: user.totalScore,
            currentLevel: user.currentLevel,
            levelProgress: user.levelProgress,
            streak: user.streak,
            todayPractice: user.todayPractice,
            totalPractice: user.totalPractice,
            learnedWords: user.learnedWords,
            achievements: user.achievements,
            createdAt: user.createdAt,
            lastLoginAt: user.lastLoginAt
          }
        }
      });

    } catch (error) {
      logger.error('获取用户信息错误:', error);
      next(error);
    }
  }

  // 更新用户信息
  async updateProfile(req, res, next) {
    try {
      const { nickname, avatar, gender, city, province, country } = req.body;
      const user = req.user;

      // 更新用户信息
      if (nickname) user.nickname = nickname;
      if (avatar) user.avatar = avatar;
      if (gender !== undefined) user.gender = gender;
      if (city) user.city = city;
      if (province) user.province = province;
      if (country) user.country = country;

      await user.save();

      logger.info('用户信息更新成功', {
        userId: user._id,
        updatedFields: Object.keys(req.body)
      });

      res.json({
        success: true,
        data: {
          user: {
            id: user._id,
            nickname: user.nickname,
            avatar: user.avatar,
            gender: user.gender,
            city: user.city,
            province: user.province,
            country: user.country
          }
        }
      });

    } catch (error) {
      logger.error('更新用户信息错误:', error);
      next(error);
    }
  }

  // 更新学习设置
  async updateSettings(req, res, next) {
    try {
      const {
        childAge,
        difficulty,
        aiPersonality,
        voiceEnabled,
        autoVoiceEnabled,
        autoPlay,
        learningReminder,
        dailyTarget,
        theme,
        fontSize
      } = req.body;

      const user = req.user;

      // 更新设置
      if (childAge) user.childAge = childAge;
      if (difficulty) user.difficulty = difficulty;
      if (aiPersonality) user.aiPersonality = aiPersonality;
      if (voiceEnabled !== undefined) user.voiceEnabled = voiceEnabled;
      if (autoVoiceEnabled !== undefined) user.autoVoiceEnabled = autoVoiceEnabled;
      if (autoPlay !== undefined) user.autoPlay = autoPlay;
      if (learningReminder !== undefined) user.learningReminder = learningReminder;
      if (dailyTarget) user.dailyTarget = dailyTarget;
      if (theme) user.theme = theme;
      if (fontSize) user.fontSize = fontSize;

      await user.save();

      logger.info('用户设置更新成功', {
        userId: user._id,
        updatedSettings: Object.keys(req.body)
      });

      res.json({
        success: true,
        data: {
          settings: {
            childAge: user.childAge,
            difficulty: user.difficulty,
            aiPersonality: user.aiPersonality,
            voiceEnabled: user.voiceEnabled,
            autoVoiceEnabled: user.autoVoiceEnabled,
            autoPlay: user.autoPlay,
            learningReminder: user.learningReminder,
            dailyTarget: user.dailyTarget,
            theme: user.theme,
            fontSize: user.fontSize
          }
        }
      });

    } catch (error) {
      logger.error('更新用户设置错误:', error);
      next(error);
    }
  }

  // 获取学习统计
  async getStats(req, res, next) {
    try {
      const user = req.user;

      // 获取聊天会话统计
      const chatStats = await ChatSession.getStatistics(user._id);

      res.json({
        success: true,
        data: {
          basicStats: {
            totalScore: user.totalScore,
            currentLevel: user.currentLevel,
            levelProgress: user.levelProgress,
            streak: user.streak,
            todayPractice: user.todayPractice,
            totalPractice: user.totalPractice,
            learnedWords: user.learnedWords,
            achievementsCount: user.achievements.length
          },
          chatStats: chatStats[0] || {
            totalSessions: 0,
            totalMessages: 0,
            totalScore: 0,
            avgDuration: 0,
            totalTopics: 0,
            totalVocabulary: 0
          },
          dailyProgress: await this.getDailyProgress(user._id),
          weeklyProgress: await this.getWeeklyProgress(user._id)
        }
      });

    } catch (error) {
      logger.error('获取学习统计错误:', error);
      next(error);
    }
  }

  // 添加学习分数
  async addScore(req, res, next) {
    try {
      const { points } = req.body;
      const user = req.user;

      if (!points || points <= 0) {
        throw new AppError('分数必须大于0', 400, 'INVALID_POINTS');
      }

      await user.addScore(points);

      logger.info('用户分数增加', {
        userId: user._id,
        points,
        newTotalScore: user.totalScore
      });

      res.json({
        success: true,
        data: {
          totalScore: user.totalScore,
          currentLevel: user.currentLevel,
          levelProgress: user.levelProgress,
          pointsAdded: points
        }
      });

    } catch (error) {
      logger.error('添加学习分数错误:', error);
      next(error);
    }
  }

  // 获取成就列表
  async getAchievements(req, res, next) {
    try {
      const user = req.user;

      // 定义所有可能的成就
      const allAchievements = [
        {
          id: 'first_conversation',
          name: '初次见面',
          description: '完成第一次语音对话',
          icon: '👋',
          target: 1,
          progress: user.todayPractice > 0 ? 1 : 0,
          unlocked: user.todayPractice > 0
        },
        {
          id: 'consistent_learner',
          name: '坚持不懈',
          description: '连续学习3天',
          icon: '🔥',
          target: 3,
          progress: Math.min(user.streak, 3),
          unlocked: user.streak >= 3
        },
        {
          id: 'vocabulary_master',
          name: '词汇小达人',
          description: '学会50个单词',
          icon: '📚',
          target: 50,
          progress: Math.min(user.learnedWords, 50),
          unlocked: user.learnedWords >= 50
        },
        {
          id: 'conversation_expert',
          name: '对话高手',
          description: '完成100次对话',
          icon: '💬',
          target: 100,
          progress: Math.min(user.totalPractice, 100),
          unlocked: user.totalPractice >= 100
        },
        {
          id: 'learning_star',
          name: '学习之星',
          description: '获得500分',
          icon: '⭐',
          target: 500,
          progress: Math.min(user.totalScore, 500),
          unlocked: user.totalScore >= 500
        },
        {
          id: 'english_master',
          name: '英语大师',
          description: '获得1000分',
          icon: '👑',
          target: 1000,
          progress: Math.min(user.totalScore, 1000),
          unlocked: user.totalScore >= 1000
        }
      ];

      res.json({
        success: true,
        data: {
          achievements: allAchievements
        }
      });

    } catch (error) {
      logger.error('获取成就列表错误:', error);
      next(error);
    }
  }

  // 解锁成就
  async unlockAchievement(req, res, next) {
    try {
      const { achievementId } = req.params;
      const user = req.user;

      const achievementMap = {
        'first_conversation': '初次见面',
        'consistent_learner': '坚持不懈',
        'vocabulary_master': '词汇小达人',
        'conversation_expert': '对话高手',
        'learning_star': '学习之星',
        'english_master': '英语大师'
      };

      const achievementName = achievementMap[achievementId];
      if (!achievementName) {
        throw new AppError('成就不存在', 404, 'ACHIEVEMENT_NOT_FOUND');
      }

      await user.addAchievement(achievementId, achievementName);

      logger.info('成就解锁', {
        userId: user._id,
        achievementId,
        achievementName
      });

      res.json({
        success: true,
        data: {
          achievementId,
          achievementName,
          totalAchievements: user.achievements.length
        }
      });

    } catch (error) {
      logger.error('解锁成就错误:', error);
      next(error);
    }
  }

  // 获取学习历史
  async getLearningHistory(req, res, next) {
    try {
      const { page = 1, limit = 20 } = req.query;
      const user = req.user;

      const skip = (page - 1) * limit;

      const sessions = await ChatSession.findByUserId(user._id, parseInt(limit));

      res.json({
        success: true,
        data: {
          sessions,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: sessions.length
          }
        }
      });

    } catch (error) {
      logger.error('获取学习历史错误:', error);
      next(error);
    }
  }

  // 获取每日进度
  async getDailyProgress(userId) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const sessions = await ChatSession.find({
        userId,
        createdAt: {
          $gte: today,
          $lt: tomorrow
        }
      });

      return {
        date: today.toISOString().split('T')[0],
        sessionsCount: sessions.length,
        messagesCount: sessions.reduce((sum, session) => sum + session.messageCount, 0),
        scoreGained: sessions.reduce((sum, session) => sum + session.scoreGained, 0),
        duration: sessions.reduce((sum, session) => sum + session.duration, 0)
      };
    } catch (error) {
      logger.error('获取每日进度错误:', error);
      return null;
    }
  }

  // 获取每周进度
  async getWeeklyProgress(userId) {
    try {
      const today = new Date();
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());
      weekStart.setHours(0, 0, 0, 0);

      const sessions = await ChatSession.find({
        userId,
        createdAt: {
          $gte: weekStart
        }
      });

      const dailyData = {};
      for (let i = 0; i < 7; i++) {
        const date = new Date(weekStart);
        date.setDate(weekStart.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        
        const daySessions = sessions.filter(session => {
          const sessionDate = session.createdAt.toISOString().split('T')[0];
          return sessionDate === dateStr;
        });

        dailyData[dateStr] = {
          sessionsCount: daySessions.length,
          messagesCount: daySessions.reduce((sum, session) => sum + session.messageCount, 0),
          scoreGained: daySessions.reduce((sum, session) => sum + session.scoreGained, 0)
        };
      }

      return dailyData;
    } catch (error) {
      logger.error('获取每周进度错误:', error);
      return null;
    }
  }
}

module.exports = new UserController();
