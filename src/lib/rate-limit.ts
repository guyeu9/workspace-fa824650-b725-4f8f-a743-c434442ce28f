import { NextRequest, NextResponse } from 'next/server'
import { RateLimiter } from '@/lib/security-utils'

interface RateLimitConfig {
  windowMs: number
  maxRequests: number
  keyGenerator?: (request: NextRequest) => string
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
  message?: string
  statusCode?: number
}

const defaultConfig: RateLimitConfig = {
  windowMs: 60 * 1000, // 1分钟
  maxRequests: 100,
  keyGenerator: (request: NextRequest) => {
    // 默认使用IP地址作为标识符
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown'
    return `rate_limit:${ip}`
  },
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  message: '请求过于频繁，请稍后再试',
  statusCode: 429,
}

export function rateLimit(config: RateLimitConfig = {}) {
  const options = { ...defaultConfig, ...config }
  const requestCounts = new Map<string, { count: number; resetTime: number }>()

  return async function middleware(
    request: NextRequest,
    next: () => Promise<NextResponse>
  ): Promise<NextResponse> {
    const key = options.keyGenerator!(request)
    const now = Date.now()

    // 获取当前计数
    const current = requestCounts.get(key)
    
    // 检查是否需要重置计数
    if (!current || now > current.resetTime) {
      requestCounts.set(key, {
        count: 1,
        resetTime: now + options.windowMs,
      })
    } else {
      // 增加计数
      current.count++
    }

    // 检查是否超过限制
    const count = requestCounts.get(key)!.count
    if (count > options.maxRequests) {
      const resetTime = requestCounts.get(key)!.resetTime
      const retryAfter = Math.ceil((resetTime - now) / 1000)

      return new NextResponse(
        JSON.stringify({
          error: options.message,
          retryAfter,
        }),
        {
          status: options.statusCode,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Limit': options.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': resetTime.toString(),
          },
        }
      )
    }

    // 执行下一个中间件
    const response = await next()

    // 更新响应头
    const remaining = Math.max(0, options.maxRequests - count)
    response.headers.set('X-RateLimit-Limit', options.maxRequests.toString())
    response.headers.set('X-RateLimit-Remaining', remaining.toString())
    response.headers.set('X-RateLimit-Reset', requestCounts.get(key)!.resetTime.toString())

    return response
  }
}

// 特定路由的速率限制配置
export const rateLimitConfigs = {
  // 认证相关 - 更严格的限制
  auth: {
    windowMs: 15 * 60 * 1000, // 15分钟
    maxRequests: 5,
    message: '登录尝试过于频繁，请15分钟后再试',
  },

  // 游戏操作 - 中等限制
  game: {
    windowMs: 60 * 1000, // 1分钟
    maxRequests: 30,
    message: '游戏操作过于频繁，请稍后再试',
  },

  // 评论操作 - 宽松限制
  comment: {
    windowMs: 60 * 1000, // 1分钟
    maxRequests: 10,
    message: '评论操作过于频繁，请稍后再试',
  },

  // 投票操作 - 宽松限制
  vote: {
    windowMs: 60 * 1000, // 1分钟
    maxRequests: 20,
    message: '投票操作过于频繁，请稍后再试',
  },

  // 文件上传 - 严格限制
  upload: {
    windowMs: 60 * 1000, // 1分钟
    maxRequests: 5,
    message: '文件上传过于频繁，请稍后再试',
  },

  // API通用限制
  api: {
    windowMs: 60 * 1000, // 1分钟
    maxRequests: 100,
    message: 'API请求过于频繁，请稍后再试',
  },
}

// 清理过期的速率限制记录
export function cleanupRateLimits() {
  const now = Date.now()
  for (const [key, value] of requestCounts.entries()) {
    if (now > value.resetTime) {
      requestCounts.delete(key)
    }
  }
}

// 定期清理（每小时）
setInterval(cleanupRateLimits, 60 * 60 * 1000)