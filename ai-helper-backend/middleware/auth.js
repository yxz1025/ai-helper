const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { logger } = require('../utils/logger');
const { AppError } = require('./errorHandler');

// 生成JWT令牌
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

// 验证JWT令牌
const verifyToken = async (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (error) {
    throw new AppError('无效的访问令牌', 401, 'INVALID_TOKEN');
  }
};

// 认证中间件
const authenticate = async (req, res, next) => {
  try {
    let token;

    // 从请求头获取token
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // 从查询参数获取token（用于小程序）
    if (!token && req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      throw new AppError('请提供访问令牌', 401, 'NO_TOKEN');
    }

    // 验证token
    const decoded = await verifyToken(token);
    
    // 获取用户信息
    const user = await User.findById(decoded.userId);
    if (!user) {
      throw new AppError('用户不存在', 401, 'USER_NOT_FOUND');
    }

    if (!user.isActive) {
      throw new AppError('用户账户已被禁用', 401, 'USER_DISABLED');
    }

    // 更新最后活跃时间
    await user.updateLastActive();

    req.user = user;
    next();

  } catch (error) {
    logger.error('认证中间件错误:', error);
    next(error);
  }
};

// 可选认证中间件（不强制要求登录）
const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (req.query.token) {
      token = req.query.token;
    }

    if (token) {
      const decoded = await verifyToken(token);
      const user = await User.findById(decoded.userId);
      
      if (user && user.isActive) {
        await user.updateLastActive();
        req.user = user;
      }
    }

    next();
  } catch (error) {
    // 可选认证失败不抛出错误，继续执行
    logger.warn('可选认证失败:', error.message);
    next();
  }
};

// 微信小程序登录
const wechatLogin = async (req, res, next) => {
  try {
    const { code, userInfo } = req.body;

    if (!code) {
      throw new AppError('缺少微信授权码', 400, 'NO_WECHAT_CODE');
    }

    // 获取微信用户信息
    const wechatUserInfo = await getWechatUserInfo(code, userInfo);
    
    // 查找或创建用户
    let user = await User.findByOpenId(wechatUserInfo.openid);
    
    if (!user) {
      // 创建新用户
      user = new User({
        openId: wechatUserInfo.openid,
        unionId: wechatUserInfo.unionid,
        nickname: userInfo?.nickName || '小朋友',
        avatar: userInfo?.avatarUrl || '',
        gender: userInfo?.gender || 0,
        language: userInfo?.language || 'zh_CN',
        city: userInfo?.city || '',
        province: userInfo?.province || '',
        country: userInfo?.country || 'CN',
        childAge: 6, // 默认年龄
        difficulty: 'easy',
        aiPersonality: 'friendly'
      });
      
      await user.save();
      
      logger.info('新用户注册', {
        userId: user._id,
        openId: user.openId,
        nickname: user.nickname
      });
    } else {
      // 更新用户信息
      user.nickname = userInfo?.nickName || user.nickname;
      user.avatar = userInfo?.avatarUrl || user.avatar;
      user.gender = userInfo?.gender || user.gender;
      user.language = userInfo?.language || user.language;
      user.city = userInfo?.city || user.city;
      user.province = userInfo?.province || user.province;
      user.country = userInfo?.country || user.country;
      user.lastLoginAt = new Date();
      
      await user.save();
    }

    // 生成JWT令牌
    const token = generateToken(user._id);

    req.user = user;
    req.token = token;
    next();

  } catch (error) {
    logger.error('微信登录错误:', error);
    next(error);
  }
};

// 获取微信用户信息
const getWechatUserInfo = async (code, userInfo) => {
  try {
    const response = await fetch('https://api.weixin.qq.com/sns/jscode2session', {
      method: 'GET',
      params: {
        appid: process.env.WECHAT_APP_ID,
        secret: process.env.WECHAT_APP_SECRET,
        js_code: code,
        grant_type: 'authorization_code'
      }
    });

    const data = await response.json();

    if (data.errcode) {
      throw new AppError(`微信API错误: ${data.errmsg}`, 400, 'WECHAT_API_ERROR');
    }

    return {
      openid: data.openid,
      unionid: data.unionid,
      session_key: data.session_key
    };

  } catch (error) {
    logger.error('获取微信用户信息失败:', error);
    throw new AppError('微信登录失败', 500, 'WECHAT_LOGIN_FAILED');
  }
};

// 权限检查中间件
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new AppError('请先登录', 401, 'LOGIN_REQUIRED');
    }

    // 这里可以添加角色检查逻辑
    // 目前所有用户都是普通用户
    next();
  };
};

// 速率限制中间件
const rateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const requests = new Map();

  return (req, res, next) => {
    const key = req.user ? req.user._id.toString() : req.ip;
    const now = Date.now();
    
    if (!requests.has(key)) {
      requests.set(key, []);
    }
    
    const userRequests = requests.get(key);
    
    // 清理过期的请求记录
    const validRequests = userRequests.filter(time => now - time < windowMs);
    
    if (validRequests.length >= maxRequests) {
      throw new AppError('请求过于频繁，请稍后再试', 429, 'RATE_LIMIT_EXCEEDED');
    }
    
    validRequests.push(now);
    requests.set(key, validRequests);
    
    next();
  };
};

module.exports = {
  generateToken,
  verifyToken,
  authenticate,
  optionalAuth,
  wechatLogin,
  requireRole,
  rateLimit
};
