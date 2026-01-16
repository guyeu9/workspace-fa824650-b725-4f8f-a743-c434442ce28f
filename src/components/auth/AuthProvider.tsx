'use client'

import { SessionProvider } from 'next-auth/react'
import { ReactNode, useEffect, useState, useRef, useCallback } from 'react'
import { toast } from 'sonner'

interface Props {
  children: ReactNode
}

interface AuthError {
  error: string
  message: string
  url?: string
}

export default function AuthProvider({ children }: Props) {
  const [mounted, setMounted] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [lastErrorTime, setLastErrorTime] = useState<number>(0)
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const fetchAbortControllerRef = useRef<AbortController | null>(null)

  // 清理重试定时器
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
      }
      if (fetchAbortControllerRef.current) {
        fetchAbortControllerRef.current.abort()
      }
    }
  }, [])

  // 监听 NextAuth 错误
  const handleAuthError = useCallback((event: Event) => {
    const error = (event as CustomEvent).detail as AuthError
    const now = Date.now()
    
    console.error('[AuthProvider] Auth error:', error)
    
    // 防止错误风暴（1秒内不重复显示相同错误）
    if (now - lastErrorTime < 1000) {
      return
    }
    
    setLastErrorTime(now)
    
    // 根据错误类型显示不同的提示
    if (error?.error === 'ClientFetchError' || error?.error === 'FetchError') {
      const shouldRetry = retryCount < 3
      
      if (shouldRetry) {
        toast.error('连接认证服务失败，正在重试...', {
          description: `第 ${retryCount + 1} 次重试`,
          action: {
            label: '重试',
            onClick: () => {
              window.location.reload()
            }
          }
        })
        
        // 延迟重试
        retryTimeoutRef.current = setTimeout(() => {
          setRetryCount(prev => prev + 1)
          window.location.reload()
        }, 2000)
      } else {
        toast.error('连接认证服务失败，请检查网络连接', {
          description: '已达到最大重试次数，请刷新页面重试',
          action: {
            label: '刷新页面',
            onClick: () => {
              setRetryCount(0)
              window.location.reload()
            }
          }
        })
      }
    } else if (error?.error === 'SessionRequired') {
      toast.error('需要重新登录', {
        description: '您的会话已过期，请重新登录',
        action: {
          label: '去登录',
          onClick: () => {
            window.location.href = '/auth/signin'
          }
        }
      })
    } else {
      toast.error('认证错误', {
        description: error.message || '发生未知错误，请重试',
        action: {
          label: '刷新页面',
          onClick: () => {
            window.location.reload()
          }
        }
      })
    }
  }, [retryCount, lastErrorTime])

  useEffect(() => {
    setMounted(true)
    
    // 监听 NextAuth 错误
    window.addEventListener('next-auth-error', handleAuthError as EventListener)

    // 监听页面可见性变化，处理页面隐藏时的请求
    const handleVisibilityChange = () => {
      if (document.hidden && fetchAbortControllerRef.current) {
        console.log('[AuthProvider] Page hidden, aborting pending fetch')
        fetchAbortControllerRef.current.abort()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('next-auth-error', handleAuthError as EventListener)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [handleAuthError])

  // 防止服务端渲染时的水合不匹配
  if (!mounted) {
    return <div style={{ display: 'none' }} />
  }

  return (
    <SessionProvider
      refetchInterval={0}
      refetchOnWindowFocus={false}
    >
      {children}
    </SessionProvider>
  )
}