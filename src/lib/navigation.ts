import { useRouter } from 'next/navigation'
import { useCallback } from 'react'

export function useAppNavigation() {
  const router = useRouter()

  const navigateToValidator = useCallback(() => {
    try {
      // 使用Next.js的路由系统，避免页面闪烁
      router.push('/validator')
    } catch (error) {
      console.error('导航到验证器失败:', error)
      // 回退到传统的window.location
      window.location.href = '/validator'
    }
  }, [router])

  const navigateToGameEditor = useCallback(() => {
    try {
      router.push('/game-editor')
    } catch (error) {
      console.error('导航到游戏编辑器失败:', error)
      window.location.href = '/game-editor'
    }
  }, [router])

  const navigateToHome = useCallback(() => {
    try {
      router.push('/')
    } catch (error) {
      console.error('导航到首页失败:', error)
      window.location.href = '/'
    }
  }, [router])

  return {
    navigateToValidator,
    navigateToGameEditor,
    navigateToHome
  }
}