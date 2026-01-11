import { AppError, ErrorCodes, handleApiError } from './error-handler'

interface ApiResponse<T> {
  data?: T
  error?: AppError
  success: boolean
}

class ApiClient {
  private baseURL: string
  private timeout: number

  constructor(baseURL = '', timeout = 30000) {
    this.baseURL = baseURL
    this.timeout = timeout
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new AppError(
          errorData.error || `HTTP ${response.status}`,
          errorData.code,
          response.status,
          errorData
        )
      }

      const data = await response.json()
      return {
        data,
        success: true,
      }
    } catch (error) {
      clearTimeout(timeoutId)
      
      if (error instanceof AppError) {
        return {
          error,
          success: false,
        }
      }

      // 处理网络错误
      if (error instanceof Error && error.name === 'AbortError') {
        return {
          error: new AppError('请求超时', ErrorCodes.TIMEOUT_ERROR, 408),
          success: false,
        }
      }

      // 处理其他错误
      const apiError = handleApiError(error)
      return {
        error: new AppError(apiError.message, undefined, apiError.statusCode),
        success: false,
      }
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' })
  }

  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }

  async upload<T>(endpoint: string, file: File): Promise<ApiResponse<T>> {
    const formData = new FormData()
    formData.append('file', file)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new AppError(
          errorData.error || `HTTP ${response.status}`,
          errorData.code,
          response.status,
          errorData
        )
      }

      const data = await response.json()
      return {
        data,
        success: true,
      }
    } catch (error) {
      clearTimeout(timeoutId)
      
      if (error instanceof AppError) {
        return {
          error,
          success: false,
        }
      }

      const apiError = handleApiError(error)
      return {
        error: new AppError(apiError.message, undefined, apiError.statusCode),
        success: false,
      }
    }
  }
}

// 创建全局API客户端实例
export const apiClient = new ApiClient('/api')

// 创建认证相关的API客户端
export const authClient = new ApiClient('/api/auth')

// 创建管理相关的API客户端
export const adminClient = new ApiClient('/api/admin')