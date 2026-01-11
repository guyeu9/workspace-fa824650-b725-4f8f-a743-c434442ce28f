import { useState, useCallback } from 'react'
import { useToast } from '@/hooks/use-toast'
import { useLoading } from '@/components/ui/loading-provider'
import { AppError, handleApiError } from '@/lib/error-handler'

interface UseApiOptions {
  showLoading?: boolean
  showSuccess?: boolean
  showError?: boolean
  successMessage?: string
  errorTitle?: string
  onSuccess?: (data: any) => void
  onError?: (error: AppError) => void
}

interface UseApiState<T> {
  data: T | null
  loading: boolean
  error: AppError | null
}

export function useApi<T = any>(options: UseApiOptions = {}) {
  const {
    showLoading = true,
    showSuccess = true,
    showError = true,
    successMessage = '操作成功',
    errorTitle,
    onSuccess,
    onError,
  } = options

  const { toast } = useToast()
  const { startLoading, stopLoading } = useLoading()
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  })

  const execute = useCallback(async (apiCall: () => Promise<any>) => {
    try {
      // 开始加载
      if (showLoading) {
        startLoading()
      }
      
      setState(prev => ({ ...prev, loading: true, error: null }))

      // 执行API调用
      const result = await apiCall()

      // 处理成功响应
      if (result.success) {
        setState({
          data: result.data,
          loading: false,
          error: null,
        })

        if (showSuccess) {
          toast({
            title: successMessage,
            description: '操作已完成',
            duration: 3000,
          })
        }

        if (onSuccess) {
          onSuccess(result.data)
        }

        return result.data
      } else {
        // 处理错误响应
        const error = result.error || new AppError('操作失败')
        setState({
          data: null,
          loading: false,
          error,
        })

        if (showError) {
          const errorInfo = handleApiError(error)
          toast({
            title: errorTitle || errorInfo.title,
            description: errorInfo.message,
            variant: 'destructive',
            duration: 5000,
          })
        }

        if (onError) {
          onError(error)
        }

        throw error
      }
    } catch (error) {
      // 处理未捕获的错误
      const appError = error instanceof AppError ? error : new AppError('操作失败')
      setState({
        data: null,
        loading: false,
        error: appError,
      })

      if (showError) {
        const errorInfo = handleApiError(appError)
        toast({
          title: errorTitle || errorInfo.title,
          description: errorInfo.message,
          variant: 'destructive',
          duration: 5000,
        })
      }

      if (onError) {
        onError(appError)
      }

      throw appError
    } finally {
      // 停止加载
      if (showLoading) {
        stopLoading()
      }
    }
  }, [showLoading, showSuccess, showError, successMessage, errorTitle, toast, startLoading, stopLoading, onSuccess, onError])

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
    })
  }, [])

  return {
    ...state,
    execute,
    reset,
  }
}

// 专门用于数据获取的Hook
export function useApiData<T = any>(
  apiCall: () => Promise<any>,
  deps: any[] = [],
  options: UseApiOptions = {}
) {
  const { data, loading, error, execute } = useApi<T>({
    showSuccess: false,
    ...options,
  })

  const [hasFetched, setHasFetched] = useState(false)

  const fetchData = useCallback(async () => {
    if (!hasFetched) {
      setHasFetched(true)
      return execute(apiCall)
    }
    return execute(apiCall)
  }, [apiCall, execute, hasFetched])

  // 自动获取数据（如果提供了依赖）
  useState(() => {
    if (deps.length === 0 || deps.some(dep => dep !== undefined)) {
      fetchData()
    }
  })

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  }
}