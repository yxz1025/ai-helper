const { createClient } = require('redis');
const logger = require('../utils/logger');

let redisClient = null;

const connectRedis = async () => {
  try {
    redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });

    redisClient.on('error', (err) => {
      logger.error('Redis 连接错误:', err);
    });

    redisClient.on('connect', () => {
      logger.info('Redis 连接成功');
    });

    redisClient.on('ready', () => {
      logger.info('Redis 准备就绪');
    });

    redisClient.on('end', () => {
      logger.warn('Redis 连接结束');
    });

    await redisClient.connect();
    
  } catch (error) {
    logger.error('Redis 连接失败:', error);
    // Redis连接失败不应该阻止应用启动
  }
};

const getRedisClient = () => {
  if (!redisClient) {
    throw new Error('Redis 客户端未初始化');
  }
  return redisClient;
};

// Redis工具函数
const redisUtils = {
  // 设置缓存
  async set(key, value, expireInSeconds = null) {
    try {
      const client = getRedisClient();
      const serializedValue = JSON.stringify(value);
      
      if (expireInSeconds) {
        await client.setEx(key, expireInSeconds, serializedValue);
      } else {
        await client.set(key, serializedValue);
      }
      
      return true;
    } catch (error) {
      logger.error('Redis SET 错误:', error);
      return false;
    }
  },

  // 获取缓存
  async get(key) {
    try {
      const client = getRedisClient();
      const value = await client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Redis GET 错误:', error);
      return null;
    }
  },

  // 删除缓存
  async del(key) {
    try {
      const client = getRedisClient();
      await client.del(key);
      return true;
    } catch (error) {
      logger.error('Redis DEL 错误:', error);
      return false;
    }
  },

  // 检查键是否存在
  async exists(key) {
    try {
      const client = getRedisClient();
      const result = await client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Redis EXISTS 错误:', error);
      return false;
    }
  },

  // 设置过期时间
  async expire(key, seconds) {
    try {
      const client = getRedisClient();
      await client.expire(key, seconds);
      return true;
    } catch (error) {
      logger.error('Redis EXPIRE 错误:', error);
      return false;
    }
  },

  // 增加计数器
  async incr(key) {
    try {
      const client = getRedisClient();
      const result = await client.incr(key);
      return result;
    } catch (error) {
      logger.error('Redis INCR 错误:', error);
      return 0;
    }
  },

  // 增加计数器并设置过期时间
  async incrEx(key, expireInSeconds) {
    try {
      const client = getRedisClient();
      const result = await client.incr(key);
      if (result === 1) {
        await client.expire(key, expireInSeconds);
      }
      return result;
    } catch (error) {
      logger.error('Redis INCR EXPIRE 错误:', error);
      return 0;
    }
  }
};

module.exports = { 
  connectRedis, 
  getRedisClient,
  redisUtils 
};
