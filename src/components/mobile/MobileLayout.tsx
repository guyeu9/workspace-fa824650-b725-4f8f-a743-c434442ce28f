'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { MobileStatusBar, MobileNavigation } from '@/components/mobile/MobileComponents'
import { useMobileDevice } from '@/hooks/use-mobile'
import { mobileNative } from '@/lib/mobile-native'
import { PushNotificationManager } from '@/lib/push-notifications'
import { 
  Home, 
  Gamepad2, 
  Library, 
  Users, 
  Settings,
  Plus
} from 'lucide-react'

interface MobileLayoutProps {
  children: React.ReactNode
}

export default function MobileLayout({ children }: MobileLayoutProps) {
  const pathname = usePathname()
  const device = useMobileDevice()

  useEffect(() => {
    if (!device.isMobile) return

    // 初始化移动端原生功能
    const initializeMobileFeatures = async () => {
      try {
        // 隐藏启动画面
        await mobileNative.hideSplashScreen()
        
        // 设置状态栏
        await mobileNative.setStatusBar({
          style: 'DARK',
          backgroundColor: '#6366f1'
        })
        
        // 注册推送通知
        const pushManager = PushNotificationManager.getInstance()
        await pushManager.initialize()
        
        // 监听应用状态变化
        mobileNative.addAppStateListener(({ isActive }) => {
          console.log('应用状态:', isActive ? '激活' : '后台')
        })
        
        console.log('移动端功能初始化完成')
      } catch (error) {
        console.error('移动端功能初始化失败:', error)
      }
    }

    initializeMobileFeatures()
  }, [device.isMobile])

  if (!device.isMobile) {
    return <>{children}</>
  }

  // 移动端导航项目
  const navigationItems = [
    {
      icon: Home,
      label: '首页',
      active: pathname === '/',
      onClick: () => window.location.href = '/'
    },
    {
      icon: Gamepad2,
      label: '游戏',
      active: pathname.startsWith('/games'),
      onClick: () => window.location.href = '/games'
    },
    {
      icon: Plus,
      label: '创建',
      active: pathname === '/game-editor',
      onClick: () => window.location.href = '/game-editor',
      isPrimary: true
    },
    {
      icon: Library,
      label: '库',
      active: pathname === '/game-library',
      onClick: () => window.location.href = '/game-library'
    },
    {
      icon: Users,
      label: '社区',
      active: pathname === '/community',
      onClick: () => window.location.href = '/community'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 移动端状态栏 */}
      <MobileStatusBar 
        showBattery={true}
        showNetwork={true}
        showOrientation={false}
      />
      
      {/* 主要内容区域 */}
      <main className="pb-20">
        {children}
      </main>
      
      {/* 移动端底部导航 */}
      <MobileNavigation 
        items={navigationItems}
        position="bottom"
      />
    </div>
  )
}