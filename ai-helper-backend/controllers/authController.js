const User = require('../models/User');
const { generateToken, verifyToken } = require('../middleware/auth');
const { logger } = require('../utils/logger');
const { AppError } = require('../middleware/errorHandler');

class AuthController {
  // 微信登录
  async wechatLogin(req, res, next) {
    try {
      const { user, token } = req;

      logger.info('用户登录成功', {
        userId: user._id,
        nickname: user.nickname,
        openId: user.openId
      });

      res.json({
        success: true,
        data: {
          user: {
            id: user._id,
            nickname: user.nickname,
            avatar: user.avatar,
            childAge: user.childAge,
            difficulty: user.difficulty,
            aiPersonality: user.aiPersonality,
            totalScore: user.totalScore,
            currentLevel: user.currentLevel,
            streak: user.streak,
            achievements: user.achievements
          },
          token,
          expiresIn: process.env.JWT_EXPIRES_IN || '7d'
        }
      });

    } catch (error) {
      logger.error('微信登录控制器错误:', error);
      next(error);
    }
  }

  // 刷新令牌
  async refreshToken(req, res, next) {
    try {
      const { token } = req.body;

      if (!token) {
        throw new AppError('请提供访问令牌', 400, 'NO_TOKEN');
      }

      // 验证当前令牌
      const decoded = await verifyToken(token);
      
      // 获取用户信息
      const user = await User.findById(decoded.userId);
      if (!user || !user.isActive) {
        throw new AppError('用户不存在或已被禁用', 401, 'USER_NOT_FOUND');
      }

      // 生成新令牌
      const newToken = generateToken(user._id);

      logger.info('令牌刷新成功', {
        userId: user._id
      });

      res.json({
        success: true,
        data: {
          token: newToken,
          expiresIn: process.env.JWT_EXPIRES_IN || '7d'
        }
      });

    } catch (error) {
      logger.error('刷新令牌控制器错误:', error);
      next(error);
    }
  }

  // 登出
  async logout(req, res, next) {
    try {
      // 这里可以添加令牌黑名单逻辑
      // 目前只是记录日志
      
      logger.info('用户登出', {
        userId: req.user?._id
      });

      res.json({
        success: true,
        message: '登出成功'
      });

    } catch (error) {
      logger.error('登出控制器错误:', error);
      next(error);
    }
  }

  // 验证令牌
  async verifyToken(req, res, next) {
    try {
      const { token } = req.query;

      if (!token) {
        throw new AppError('请提供访问令牌', 400, 'NO_TOKEN');
      }

      // 验证令牌
      const decoded = await verifyToken(token);
      
      // 获取用户信息
      const user = await User.findById(decoded.userId);
      if (!user || !user.isActive) {
        throw new AppError('用户不存在或已被禁用', 401, 'USER_NOT_FOUND');
      }

      res.json({
        success: true,
        data: {
          valid: true,
          user: {
            id: user._id,
            nickname: user.nickname,
            avatar: user.avatar,
            childAge: user.childAge,
            difficulty: user.difficulty,
            aiPersonality: user.aiPersonality
          }
        }
      });

    } catch (error) {
      res.json({
        success: false,
        data: {
          valid: false,
          error: error.message
        }
      });
    }
  }
}

module.exports = new AuthController();
