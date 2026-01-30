import DOMPurify from 'isomorphic-dompurify'
import { z } from 'zod'

// 输入验证规则
export const ValidationRules = {
  // 用户相关
  email: z.string().email('请输入有效的邮箱地址').max(100, '邮箱地址过长'),
  password: z.string().min(6, '密码至少需要6位字符').max(100, '密码过长'),
  username: z.string().min(1, '用户名不能为空').max(50, '用户名不能超过50个字符').regex(/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/, '用户名只能包含字母、数字、下划线和中文'),
  
  // 游戏相关
  gameTitle: z.string().min(1, '游戏标题不能为空').max(200, '游戏标题不能超过200个字符'),
  gameDescription: z.string().max(1000, '游戏描述不能超过1000个字符').optional(),
  
  // 评论相关
  commentContent: z.string().min(1, '评论内容不能为空').max(1000, '评论内容不能超过1000个字符'),
  
  // ID验证
  id: z.string().cuid('无效的ID格式'),
}

// 输入清理工具
export class InputSanitizer {
  // 清理HTML内容，防止XSS攻击
  static sanitizeHtml(html: string): string {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
      ALLOWED_ATTR: [],
    })
  }

  // 清理纯文本
  static sanitizeText(text: string): string {
    return text
      .replace(/<script[^>]*>.*?<\/script>/gi, '') // 移除script标签
      .replace(/[<>\"'&]/g, '') // 移除HTML特殊字符
      .trim()
  }

  // 清理文件名
  static sanitizeFilename(filename: string): string {
    return filename
      .replace(/[^a-zA-Z0-9._-]/g, '') // 只允许字母、数字、点、下划线、连字符
      .substring(0, 255) // 限制长度
  }

  // 清理URL
  static sanitizeUrl(url: string): string {
    try {
      const parsed = new URL(url)
      // 只允许HTTP和HTTPS协议
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return ''
      }
      return parsed.toString()
    } catch {
      return ''
    }
  }

  // 清理搜索词
  static sanitizeSearchTerm(term: string): string {
    return term
      .replace(/<script[^>]*>.*?<\/script>/gi, '') // 移除script标签
      .replace(/[^\w\s\u4e00-\u9fa5]/g, '') // 只允许字母、数字、空格、中文
      .trim()
      .substring(0, 100) // 限制长度
  }

  // 清理邮箱地址
  static sanitizeEmail(email: string): string {
    return email.toLowerCase().trim()
  }

  // 清理IP地址
  static sanitizeIpAddress(ip: string): string {
    // 验证IPv4格式
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
    if (ipv4Regex.test(ip)) {
      return ip
    }
    // 验证IPv6格式（简化版）
    const ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/
    if (ipv6Regex.test(ip)) {
      return ip
    }
    return ''
  }

  // 清理用户代理字符串
  static sanitizeUserAgent(userAgent: string): string {
    return userAgent
      .replace(/<script[^>]*>/gi, 'script') // 移除script开始标签，保留script文本
      .replace(/<\/script>/gi, '') // 移除script结束标签
      .replace(/[<>\"'&]/g, '') // 移除HTML特殊字符
      .replace(/\(/g, '') // 移除左括号
      .replace(/\)/g, '') // 移除右括号
      .substring(0, 500) // 限制长度
      .trim()
  }
}

// 速率限制工具
export class RateLimiter {
  private static requests = new Map<string, { count: number; resetTime: number }>()
  private static readonly WINDOW_MS = 60 * 1000 // 1分钟窗口
  private static readonly MAX_REQUESTS = 100 // 每分钟最多100次请求

  static checkLimit(identifier: string): boolean {
    const now = Date.now()
    const key = identifier
    const current = this.requests.get(key)

    if (!current || now > current.resetTime) {
      // 新窗口或窗口已过期
      this.requests.set(key, {
        count: 1,
        resetTime: now + this.WINDOW_MS,
      })
      return true
    }

    if (current.count >= this.MAX_REQUESTS) {
      return false
    }

    current.count++
    return true
  }

  static getRemainingRequests(identifier: string): number {
    const current = this.requests.get(identifier)
    if (!current) return this.MAX_REQUESTS
    return Math.max(0, this.MAX_REQUESTS - current.count)
  }

  static getResetTime(identifier: string): number {
    const current = this.requests.get(identifier)
    if (!current) return Date.now() + this.WINDOW_MS
    return current.resetTime
  }

  // 清理过期的记录
  static cleanup(): void {
    const now = Date.now()
    for (const [key, value] of this.requests.entries()) {
      if (now > value.resetTime) {
        this.requests.delete(key)
      }
    }
  }
}

// SQL注入防护
export class SqlInjectionProtection {
  // 危险的SQL关键字
  private static readonly DANGEROUS_KEYWORDS = [
    'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'DROP', 'CREATE', 'ALTER',
    'EXEC', 'EXECUTE', 'UNION', 'SCRIPT', 'DECLARE', 'TRUNCATE',
  ]

  // 危险的SQL字符
  private static readonly DANGEROUS_CHARS = ['--', ';', '/*', '*/', 'xp_', 'sp_']

  static detectInjection(input: string): boolean {
    const upperInput = input.toUpperCase()
    
    // 检查危险关键字
    for (const keyword of this.DANGEROUS_KEYWORDS) {
      if (upperInput.includes(keyword)) {
        return true
      }
    }

    // 检查危险字符
    for (const char of this.DANGEROUS_CHARS) {
      if (input.includes(char)) {
        return true
      }
    }

    return false
  }

  static sanitizeInput(input: string): string {
    let sanitized = input

    // 移除危险关键字（不区分大小写）
    for (const keyword of this.DANGEROUS_KEYWORDS) {
      const regex = new RegExp(keyword, 'gi')
      sanitized = sanitized.replace(regex, '')
    }

    // 移除危险字符（需要转义正则表达式中的特殊字符）
    for (const char of this.DANGEROUS_CHARS) {
      const escapedChar = char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      sanitized = sanitized.replace(new RegExp(escapedChar, 'gi'), '')
    }

    // 移除SQL注释
    sanitized = sanitized.replace(/--.*$/gm, '')
    sanitized = sanitized.replace(/\/\*[\s\S]*?\*\//g, '')

    return sanitized.trim()
  }
}

// 文件上传安全检查
export class FileUploadSecurity {
  // 允许的文件类型
  private static readonly ALLOWED_TYPES = [
    'application/json',
    'text/plain',
    'text/csv',
  ]

  // 允许的文件扩展名
  private static readonly ALLOWED_EXTENSIONS = [
    '.json', '.txt', '.csv', '.md'
  ]

  // 最大文件大小（10MB）
  private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024

  static validateFile(file: File): { valid: boolean; error?: string } {
    // 检查文件类型
    if (!this.ALLOWED_TYPES.includes(file.type)) {
      return {
        valid: false,
        error: '不支持的文件类型',
      }
    }

    // 检查文件扩展名
    const extension = '.' + file.name.split('.').pop()?.toLowerCase()
    if (!this.ALLOWED_EXTENSIONS.includes(extension)) {
      return {
        valid: false,
        error: '不支持的文件扩展名',
      }
    }

    // 检查文件大小
    if (file.size > this.MAX_FILE_SIZE) {
      return {
        valid: false,
        error: '文件大小超过限制（最大10MB）',
      }
    }

    return { valid: true }
  }

  static sanitizeFilename(filename: string): string {
    return filename
      .replace(/[^a-zA-Z0-9._-]/g, '') // 只允许安全的字符
      .substring(0, 255) // 限制长度
      .toLowerCase()
  }
}
