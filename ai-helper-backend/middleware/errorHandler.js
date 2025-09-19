const { logger } = require('../utils/logger');

// 自定义错误类
class AppError extends Error {
  constructor(message, statusCode, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// 错误处理中间件
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // 记录错误日志
  logger.error('错误处理中间件', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id || 'anonymous'
  });

  // Mongoose 错误处理
  if (err.name === 'CastError') {
    const message = '资源未找到';
    error = new AppError(message, 404, 'RESOURCE_NOT_FOUND');
  }

  if (err.code === 11000) {
    const message = '资源已存在';
    error = new AppError(message, 400, 'DUPLICATE_RESOURCE');
  }

  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = new AppError(message, 400, 'VALIDATION_ERROR');
  }

  if (err.name === 'JsonWebTokenError') {
    const message = '无效的访问令牌';
    error = new AppError(message, 401, 'INVALID_TOKEN');
  }

  if (err.name === 'TokenExpiredError') {
    const message = '访问令牌已过期';
    error = new AppError(message, 401, 'TOKEN_EXPIRED');
  }

  // 默认错误
  const statusCode = error.statusCode || 500;
  const message = error.message || '服务器内部错误';
  const code = error.code || 'INTERNAL_SERVER_ERROR';

  // 构建错误响应
  const errorResponse = {
    success: false,
    error: {
      message,
      code,
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
      method: req.method
    }
  };

  // 在开发环境中添加堆栈跟踪
  if (process.env.NODE_ENV === 'development') {
    errorResponse.error.stack = err.stack;
  }

  // 发送错误响应
  res.status(statusCode).json(errorResponse);
};

// 异步错误捕获包装器
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// 404处理
const notFound = (req, res, next) => {
  const error = new AppError(`接口不存在 - ${req.originalUrl}`, 404, 'NOT_FOUND');
  next(error);
};

module.exports = {
  errorHandler,
  asyncHandler,
  notFound,
  AppError
};
