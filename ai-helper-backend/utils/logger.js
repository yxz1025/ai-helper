const winston = require('winston');
const path = require('path');

// 创建logs目录
const logDir = 'logs';

// 定义日志格式
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta)}`;
    }
    
    if (stack) {
      log += `\n${stack}`;
    }
    
    return log;
  })
);

// 创建logger实例
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'ai-helper-backend' },
  transports: [
    // 错误日志文件
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    
    // 所有日志文件
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ],
  
  // 异常处理
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logDir, 'exceptions.log')
    })
  ],
  
  // 拒绝处理
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logDir, 'rejections.log')
    })
  ]
});

// 在开发环境中添加控制台输出
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

// 日志工具函数
const logUtils = {
  // 记录API请求
  logRequest: (req, res, responseTime) => {
    logger.info('API请求', {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      userId: req.user?.id || 'anonymous'
    });
  },

  // 记录API错误
  logError: (error, req = null) => {
    const errorInfo = {
      message: error.message,
      stack: error.stack,
      name: error.name
    };

    if (req) {
      errorInfo.request = {
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        userId: req.user?.id || 'anonymous'
      };
    }

    logger.error('API错误', errorInfo);
  },

  // 记录业务日志
  logBusiness: (action, data = {}) => {
    logger.info('业务操作', {
      action,
      ...data
    });
  },

  // 记录安全事件
  logSecurity: (event, data = {}) => {
    logger.warn('安全事件', {
      event,
      ...data
    });
  },

  // 记录性能指标
  logPerformance: (operation, duration, metadata = {}) => {
    logger.info('性能指标', {
      operation,
      duration: `${duration}ms`,
      ...metadata
    });
  }
};

module.exports = {
  logger,
  logUtils
};
