import { PrismaClient } from '@prisma/client'

// 扩展Prisma客户端以添加查询性能监控
export class MonitoredPrismaClient extends PrismaClient {
  constructor(options?: any) {
    super(options)
    
    // 添加查询性能监控
    this.$on('query', (e: any) => {
      if (e.duration > 1000) {
        console.warn(`⚠️  慢查询警告: ${e.duration}ms`)
        console.warn(`查询: ${e.query}`)
        console.warn(`参数: ${e.params}`)
      }
    })
  }

  // 获取查询统计信息
  async getQueryStats() {
    // 这里可以集成更复杂的查询统计
    return {
      totalQueries: 0,
      slowQueries: 0,
      averageDuration: 0,
    }
  }
}

// 数据库性能优化建议
export const DatabaseOptimization = {
  // 索引建议
  indexes: [
    {
      table: 'Game',
      columns: ['authorId', 'createdAt'],
      reason: '优化按作者和创建时间查询的性能',
    },
    {
      table: 'Vote',
      columns: ['gameId', 'type'],
      reason: '优化按游戏和投票类型查询的性能',
    },
    {
      table: 'Comment',
      columns: ['gameId', 'createdAt'],
      reason: '优化按游戏和创建时间查询评论的性能',
    },
    {
      table: 'LoginRecord',
      columns: ['userId', 'createdAt'],
      reason: '优化用户登录记录查询',
    },
  ],

  // 查询优化建议
  queries: [
    {
      pattern: 'SELECT * FROM',
      suggestion: '只选择需要的字段，避免SELECT *',
    },
    {
      pattern: 'LIKE \'%text\'',
      suggestion: '使用前导通配符的LIKE查询无法使用索引，考虑使用全文搜索',
    },
    {
      pattern: 'OR conditions',
      suggestion: '考虑使用UNION替代复杂的OR条件',
    },
  ],

  // 缓存策略
  caching: {
    // 游戏列表缓存5分钟
    gameList: 5 * 60 * 1000,
    // 用户统计缓存10分钟
    userStats: 10 * 60 * 1000,
    // 评论列表缓存2分钟
    commentList: 2 * 60 * 1000,
  },
}

// 查询优化工具
export class QueryOptimizer {
  // 分页查询优化
  static paginateQuery(
    page: number,
    limit: number,
    totalCount: number
  ) {
    const skip = (page - 1) * limit
    const totalPages = Math.ceil(totalCount / limit)
    const hasNext = page < totalPages
    const hasPrev = page > 1

    return {
      skip,
      take: limit,
      totalPages,
      hasNext,
      hasPrev,
      currentPage: page,
    }
  }

  // 搜索查询优化
  static optimizeSearchQuery(searchTerm: string) {
    // 移除特殊字符
    const sanitized = searchTerm.replace(/[<>\"'&]/g, '')
    
    // 限制搜索长度
    if (sanitized.length > 100) {
      return sanitized.substring(0, 100)
    }

    return sanitized
  }

  // 批量操作优化
  static optimizeBatchOperation(
    items: any[],
    batchSize: number = 100
  ) {
    const batches = []
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize))
    }
    return batches
  }

  // 连接查询优化
  static optimizeJoinQuery(
    mainTable: string,
    joins: string[],
    conditions: Record<string, any>
  ) {
    // 确保连接顺序优化
    const optimizedJoins = joins.sort((a, b) => {
      // 优先处理小表连接
      const aSize = this.estimateTableSize(a)
      const bSize = this.estimateTableSize(b)
      return aSize - bSize
    })

    return {
      mainTable,
      joins: optimizedJoins,
      conditions,
    }
  }

  // 估算表大小（简化版）
  private static estimateTableSize(tableName: string): number {
    const tableSizes: Record<string, number> = {
      User: 1000,
      Game: 5000,
      Vote: 10000,
      Comment: 8000,
    }
    return tableSizes[tableName] || 1000
  }
}