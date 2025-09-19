const ChatSession = require('../models/ChatSession');
const aiService = require('../services/aiService');
const { logger } = require('../utils/logger');
const { AppError } = require('../middleware/errorHandler');

class ChatController {
  // 创建新的聊天会话
  async createSession(req, res, next) {
    try {
      const { age, difficulty, aiPersonality, title } = req.body;
      const user = req.user;

      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const session = new ChatSession({
        userId: user._id,
        sessionId,
        title: title || '新的对话',
        age: age || user.childAge,
        difficulty: difficulty || user.difficulty,
        aiPersonality: aiPersonality || user.aiPersonality,
        messages: []
      });

      await session.save();

      logger.info('创建聊天会话', {
        userId: user._id,
        sessionId,
        age,
        difficulty,
        aiPersonality
      });

      res.status(201).json({
        success: true,
        data: {
          session: {
            id: session._id,
            sessionId: session.sessionId,
            title: session.title,
            age: session.age,
            difficulty: session.difficulty,
            aiPersonality: session.aiPersonality,
            messageCount: session.messageCount,
            isActive: session.isActive,
            createdAt: session.createdAt
          }
        }
      });

    } catch (error) {
      logger.error('创建聊天会话错误:', error);
      next(error);
    }
  }

  // 获取聊天会话列表
  async getSessions(req, res, next) {
    try {
      const { page = 1, limit = 20 } = req.query;
      const user = req.user;

      const sessions = await ChatSession.findByUserId(user._id, parseInt(limit));

      res.json({
        success: true,
        data: {
          sessions: sessions.map(session => ({
            id: session._id,
            sessionId: session.sessionId,
            title: session.title,
            age: session.age,
            difficulty: session.difficulty,
            aiPersonality: session.aiPersonality,
            messageCount: session.messageCount,
            scoreGained: session.scoreGained,
            duration: session.duration,
            isActive: session.isActive,
            createdAt: session.createdAt,
            endedAt: session.endedAt
          })),
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: sessions.length
          }
        }
      });

    } catch (error) {
      logger.error('获取聊天会话列表错误:', error);
      next(error);
    }
  }

  // 获取特定聊天会话
  async getSession(req, res, next) {
    try {
      const { sessionId } = req.params;
      const user = req.user;

      const session = await ChatSession.findOne({
        sessionId,
        userId: user._id
      });

      if (!session) {
        throw new AppError('聊天会话不存在', 404, 'SESSION_NOT_FOUND');
      }

      res.json({
        success: true,
        data: {
          session: {
            id: session._id,
            sessionId: session.sessionId,
            title: session.title,
            age: session.age,
            difficulty: session.difficulty,
            aiPersonality: session.aiPersonality,
            messages: session.messages,
            messageCount: session.messageCount,
            scoreGained: session.scoreGained,
            duration: session.duration,
            topicsCovered: session.topicsCovered,
            vocabularyLearned: session.vocabularyLearned,
            isActive: session.isActive,
            createdAt: session.createdAt,
            endedAt: session.endedAt
          }
        }
      });

    } catch (error) {
      logger.error('获取聊天会话错误:', error);
      next(error);
    }
  }

  // 更新聊天会话
  async updateSession(req, res, next) {
    try {
      const { sessionId } = req.params;
      const { title, age, difficulty, aiPersonality } = req.body;
      const user = req.user;

      const session = await ChatSession.findOne({
        sessionId,
        userId: user._id
      });

      if (!session) {
        throw new AppError('聊天会话不存在', 404, 'SESSION_NOT_FOUND');
      }

      // 更新会话信息
      if (title) session.title = title;
      if (age) session.age = age;
      if (difficulty) session.difficulty = difficulty;
      if (aiPersonality) session.aiPersonality = aiPersonality;

      await session.save();

      logger.info('更新聊天会话', {
        userId: user._id,
        sessionId,
        updatedFields: Object.keys(req.body)
      });

      res.json({
        success: true,
        data: {
          session: {
            id: session._id,
            sessionId: session.sessionId,
            title: session.title,
            age: session.age,
            difficulty: session.difficulty,
            aiPersonality: session.aiPersonality,
            messageCount: session.messageCount,
            isActive: session.isActive,
            updatedAt: session.updatedAt
          }
        }
      });

    } catch (error) {
      logger.error('更新聊天会话错误:', error);
      next(error);
    }
  }

  // 结束聊天会话
  async endSession(req, res, next) {
    try {
      const { sessionId } = req.params;
      const user = req.user;

      const session = await ChatSession.findOne({
        sessionId,
        userId: user._id,
        isActive: true
      });

      if (!session) {
        throw new AppError('聊天会话不存在或已结束', 404, 'SESSION_NOT_FOUND');
      }

      await session.endSession();

      logger.info('结束聊天会话', {
        userId: user._id,
        sessionId,
        duration: session.duration,
        messageCount: session.messageCount
      });

      res.json({
        success: true,
        data: {
          session: {
            id: session._id,
            sessionId: session.sessionId,
            duration: session.duration,
            messageCount: session.messageCount,
            scoreGained: session.scoreGained,
            endedAt: session.endedAt
          }
        }
      });

    } catch (error) {
      logger.error('结束聊天会话错误:', error);
      next(error);
    }
  }

  // 发送消息到聊天会话
  async sendMessage(req, res, next) {
    try {
      const { sessionId } = req.params;
      const { text, type = 'user' } = req.body;
      const user = req.user;

      const session = await ChatSession.findOne({
        sessionId,
        userId: user._id
      });

      if (!session) {
        throw new AppError('聊天会话不存在', 404, 'SESSION_NOT_FOUND');
      }

      // 添加用户消息
      await session.addMessage({
        type,
        text,
        timestamp: new Date()
      });

      // 如果是用户消息，生成AI回复
      if (type === 'user') {
        const userSettings = {
          childAge: session.age,
          difficulty: session.difficulty,
          aiPersonality: session.aiPersonality
        };

        const aiResponse = await aiService.generateResponse(
          text,
          userSettings,
          session.messages.slice(-10) // 最近10条消息作为上下文
        );

        if (aiResponse.success) {
          await session.addMessage({
            type: 'ai',
            text: aiResponse.english,
            translation: aiResponse.chinese,
            tip: aiResponse.tip,
            encouragement: aiResponse.encouragement,
            timestamp: new Date()
          });

          // 添加分数和学习内容
          await session.addScore(10);
          if (aiResponse.tip) {
            await session.addTopic(aiResponse.tip);
          }
        }
      }

      // 获取更新后的会话
      const updatedSession = await ChatSession.findOne({ sessionId });

      res.json({
        success: true,
        data: {
          session: updatedSession,
          messages: updatedSession.messages.slice(-5) // 返回最近5条消息
        }
      });

    } catch (error) {
      logger.error('发送消息错误:', error);
      next(error);
    }
  }

  // 获取聊天会话的消息
  async getMessages(req, res, next) {
    try {
      const { sessionId } = req.params;
      const { page = 1, limit = 50 } = req.query;
      const user = req.user;

      const session = await ChatSession.findOne({
        sessionId,
        userId: user._id
      });

      if (!session) {
        throw new AppError('聊天会话不存在', 404, 'SESSION_NOT_FOUND');
      }

      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + parseInt(limit);
      const messages = session.messages.slice(startIndex, endIndex);

      res.json({
        success: true,
        data: {
          messages,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: session.messages.length,
            hasMore: endIndex < session.messages.length
          }
        }
      });

    } catch (error) {
      logger.error('获取聊天消息错误:', error);
      next(error);
    }
  }

  // 获取活跃的聊天会话
  async getActiveSession(req, res, next) {
    try {
      const user = req.user;

      const session = await ChatSession.findActiveByUserId(user._id);

      if (!session) {
        return res.json({
          success: true,
          data: {
            session: null
          }
        });
      }

      res.json({
        success: true,
        data: {
          session: {
            id: session._id,
            sessionId: session.sessionId,
            title: session.title,
            age: session.age,
            difficulty: session.difficulty,
            aiPersonality: session.aiPersonality,
            messages: session.messages,
            messageCount: session.messageCount,
            isActive: session.isActive,
            createdAt: session.createdAt
          }
        }
      });

    } catch (error) {
      logger.error('获取活跃聊天会话错误:', error);
      next(error);
    }
  }
}

module.exports = new ChatController();

