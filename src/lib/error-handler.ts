export class AppError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export const ErrorCodes = {
  // 认证相关
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  
  // 用户相关
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  USER_ALREADY_EXISTS: 'USER_ALREADY_EXISTS',
  INVALID_USER_DATA: 'INVALID_USER_DATA',
  
  // 游戏相关
  GAME_NOT_FOUND: 'GAME_NOT_FOUND',
  INVALID_GAME_DATA: 'INVALID_GAME_DATA',
  GAME_IMPORT_FAILED: 'GAME_IMPORT_FAILED',
  
  // 评论相关
  COMMENT_NOT_FOUND: 'COMMENT_NOT_FOUND',
  INVALID_COMMENT_DATA: 'INVALID_COMMENT_DATA',
  
  // 投票相关
  VOTE_ALREADY_EXISTS: 'VOTE_ALREADY_EXISTS',
  INVALID_VOTE_TYPE: 'INVALID_VOTE_TYPE',
  
  // 系统相关
  DATABASE_ERROR: 'DATABASE_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
} as const

export function getErrorMessage(error: any): string {
  if (error instanceof AppError) {
    return error.message
  }
  
  if (error instanceof Error) {
    return error.message
  }
  
  if (typeof error === 'string') {
    return error
  }
  
  return '发生未知错误，请稍后重试'
}

export function getErrorTitle(error: any): string {
  if (error instanceof AppError && error.code) {
    const errorTitles: Record<string, string> = {
      [ErrorCodes.UNAUTHORIZED]: '未登录',
      [ErrorCodes.FORBIDDEN]: '权限不足',
      [ErrorCodes.INVALID_CREDENTIALS]: '登录失败',
      [ErrorCodes.USER_NOT_FOUND]: '用户不存在',
      [ErrorCodes.USER_ALREADY_EXISTS]: '用户已存在',
      [ErrorCodes.INVALID_USER_DATA]: '用户数据无效',
      [ErrorCodes.GAME_NOT_FOUND]: '游戏不存在',
      [ErrorCodes.INVALID_GAME_DATA]: '游戏数据无效',
      [ErrorCodes.GAME_IMPORT_FAILED]: '游戏导入失败',
      [ErrorCodes.COMMENT_NOT_FOUND]: '评论不存在',
      [ErrorCodes.INVALID_COMMENT_DATA]: '评论数据无效',
      [ErrorCodes.VOTE_ALREADY_EXISTS]: '已经投过票了',
      [ErrorCodes.INVALID_VOTE_TYPE]: '投票类型无效',
      [ErrorCodes.DATABASE_ERROR]: '数据库错误',
      [ErrorCodes.VALIDATION_ERROR]: '数据验证失败',
      [ErrorCodes.INTERNAL_ERROR]: '系统错误',
      [ErrorCodes.NETWORK_ERROR]: '网络错误',
      [ErrorCodes.TIMEOUT_ERROR]: '请求超时',
    }
    
    return errorTitles[error.code] || '操作失败'
  }
  
  return '发生错误'
}

export function handleApiError(error: any): { title: string; message: string; statusCode?: number } {
  console.error('API Error:', error)
  
  // 网络错误
  if (error?.name === 'TypeError' && error?.message?.includes('fetch')) {
    return {
      title: '网络错误',
      message: '网络连接失败，请检查网络连接后重试',
      statusCode: 0
    }
  }
  
  // 超时错误
  if (error?.name === 'AbortError') {
    return {
      title: '请求超时',
      message: '请求超时，请稍后重试',
      statusCode: 408
    }
  }
  
  // HTTP错误
  if (error?.status) {
    const statusCode = error.status
    
    if (statusCode === 401) {
      return {
        title: '未登录',
        message: '请先登录后再进行操作',
        statusCode
      }
    }
    
    if (statusCode === 403) {
      return {
        title: '权限不足',
        message: '您没有执行此操作的权限',
        statusCode
      }
    }
    
    if (statusCode === 404) {
      return {
        title: '资源不存在',
        message: '请求的资源不存在',
        statusCode
      }
    }
    
    if (statusCode >= 500) {
      return {
        title: '服务器错误',
        message: '服务器暂时无法处理请求，请稍后重试',
        statusCode
      }
    }
  }
  
  // 自定义应用错误
  if (error?.code) {
    return {
      title: getErrorTitle(error),
      message: getErrorMessage(error),
      statusCode: error.statusCode
    }
  }
  
  // 默认错误
  return {
    title: '操作失败',
    message: getErrorMessage(error),
    statusCode: error?.statusCode || 500
  }
}