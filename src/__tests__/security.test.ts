import { InputSanitizer, SqlInjectionProtection, RateLimiter, FileUploadSecurity } from '@/lib/security-utils'

describe('安全功能测试', () => {
  describe('InputSanitizer', () => {
    it('应该正确清理HTML内容', () => {
      const dirtyHtml = '<script>alert("xss")</script><p>Safe content</p>'
      const cleanHtml = InputSanitizer.sanitizeHtml(dirtyHtml)
      
      expect(cleanHtml).not.toContain('<script>')
      expect(cleanHtml).toContain('<p>Safe content</p>')
    })

    it('应该正确清理纯文本', () => {
      const dirtyText = '<script>alert("xss")</script>Safe content'
      const cleanText = InputSanitizer.sanitizeText(dirtyText)
      
      expect(cleanText).toBe('scriptalertxssSafe content')
    })

    it('应该正确清理文件名', () => {
      const dirtyFilename = 'file<script>name.txt'
      const cleanFilename = InputSanitizer.sanitizeFilename(dirtyFilename)
      
      expect(cleanFilename).toBe('filename.txt')
    })

    it('应该正确清理URL', () => {
      const validUrl = 'https://example.com/path'
      const invalidUrl = 'javascript:alert("xss")'
      
      expect(InputSanitizer.sanitizeUrl(validUrl)).toBe(validUrl)
      expect(InputSanitizer.sanitizeUrl(invalidUrl)).toBe('')
    })

    it('应该正确清理搜索词', () => {
      const dirtySearch = 'search<script>term'
      const cleanSearch = InputSanitizer.sanitizeSearchTerm(dirtySearch)
      
      expect(cleanSearch).toBe('searchterm')
    })

    it('应该正确清理邮箱地址', () => {
      const email = '  Test@Example.com  '
      const cleanEmail = InputSanitizer.sanitizeEmail(email)
      
      expect(cleanEmail).toBe('test@example.com')
    })

    it('应该正确清理IP地址', () => {
      const validIp = '192.168.1.1'
      const invalidIp = '999.999.999.999'
      
      expect(InputSanitizer.sanitizeIpAddress(validIp)).toBe(validIp)
      expect(InputSanitizer.sanitizeIpAddress(invalidIp)).toBe('')
    })

    it('应该正确清理用户代理字符串', () => {
      const userAgent = 'Mozilla/5.0 <script>alert("xss")</script>'
      const cleanUserAgent = InputSanitizer.sanitizeUserAgent(userAgent)
      
      expect(cleanUserAgent).toBe('Mozilla/5.0 scriptalertxss')
    })
  })

  describe('SqlInjectionProtection', () => {
    it('应该检测SQL注入攻击', () => {
      const sqlInjection = "'; DROP TABLE users; --"
      expect(SqlInjectionProtection.detectInjection(sqlInjection)).toBe(true)
    })

    it('应该检测UNION攻击', () => {
      const unionAttack = "' UNION SELECT * FROM users --"
      expect(SqlInjectionProtection.detectInjection(unionAttack)).toBe(true)
    })

    it('应该检测EXEC攻击', () => {
      const execAttack = "'; EXEC xp_cmdshell 'dir' --"
      expect(SqlInjectionProtection.detectInjection(execAttack)).toBe(true)
    })

    it('不应该误报正常输入', () => {
      const normalInput = "Hello World"
      expect(SqlInjectionProtection.detectInjection(normalInput)).toBe(false)
    })

    it('应该正确清理SQL注入', () => {
      const sqlInjection = "'; DROP TABLE users; --"
      const cleanInput = SqlInjectionProtection.sanitizeInput(sqlInjection)
      
      expect(cleanInput).not.toContain('--')
      expect(cleanInput).not.toContain('DROP')
    })
  })

  describe('RateLimiter', () => {
    beforeEach(() => {
      // 清理速率限制器状态
      RateLimiter['requests'].clear()
    })

    it('应该允许在限制内的请求', () => {
      const identifier = 'test-user'
      
      // 前99次请求应该都允许
      for (let i = 0; i < 99; i++) {
        expect(RateLimiter.checkLimit(identifier)).toBe(true)
      }
      
      // 第100次请求也应该允许
      expect(RateLimiter.checkLimit(identifier)).toBe(true)
    })

    it('应该限制超过限制的请求', () => {
      const identifier = 'test-user'
      
      // 进行100次请求
      for (let i = 0; i < 100; i++) {
        RateLimiter.checkLimit(identifier)
      }
      
      // 第101次请求应该被拒绝
      expect(RateLimiter.checkLimit(identifier)).toBe(false)
    })

    it('应该正确计算剩余请求数', () => {
      const identifier = 'test-user'
      
      // 进行50次请求
      for (let i = 0; i < 50; i++) {
        RateLimiter.checkLimit(identifier)
      }
      
      expect(RateLimiter.getRemainingRequests(identifier)).toBe(50)
    })

    it('应该正确返回重置时间', () => {
      const identifier = 'test-user'
      const now = Date.now()
      
      RateLimiter.checkLimit(identifier)
      const resetTime = RateLimiter.getResetTime(identifier)
      
      expect(resetTime).toBeGreaterThan(now)
      expect(resetTime - now).toBeLessThanOrEqual(60000) // 1分钟
    })

    it('应该在时间窗口后重置限制', (done) => {
      const identifier = 'test-user'
      
      // 达到限制
      for (let i = 0; i < 100; i++) {
        RateLimiter.checkLimit(identifier)
      }
      expect(RateLimiter.checkLimit(identifier)).toBe(false)
      
      // 等待时间窗口过期
      setTimeout(() => {
        expect(RateLimiter.checkLimit(identifier)).toBe(true)
        done()
      }, 100)
    })
  })

  describe('FileUploadSecurity', () => {
    it('应该验证允许的文件类型', () => {
      const validFile = new File(['{"test": "data"}'], 'test.json', { type: 'application/json' })
      const result = FileUploadSecurity.validateFile(validFile)
      
      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('应该拒绝不允许的文件类型', () => {
      const invalidFile = new File(['<script>alert("xss")</script>'], 'test.html', { type: 'text/html' })
      const result = FileUploadSecurity.validateFile(invalidFile)
      
      expect(result.valid).toBe(false)
      expect(result.error).toBe('不支持的文件类型')
    })

    it('应该拒绝过大的文件', () => {
      const largeFile = new File([new Array(11 * 1024 * 1024).fill('a').join('')], 'large.json', { type: 'application/json' })
      const result = FileUploadSecurity.validateFile(largeFile)
      
      expect(result.valid).toBe(false)
      expect(result.error).toBe('文件大小超过限制（最大10MB）')
    })

    it('应该正确清理文件名', () => {
      const dirtyFilename = 'file<script>name.txt'
      const cleanFilename = FileUploadSecurity.sanitizeFilename(dirtyFilename)
      
      expect(cleanFilename).toBe('filename.txt')
    })

    it('应该限制文件名长度', () => {
      const longFilename = 'a'.repeat(300) + '.txt'
      const cleanFilename = FileUploadSecurity.sanitizeFilename(longFilename)
      
      expect(cleanFilename.length).toBeLessThanOrEqual(255)
    })
  })
})