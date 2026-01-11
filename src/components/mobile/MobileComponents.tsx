'use client'

import { useState, useEffect } from 'react'
import { useMobileDevice, useTouchGesture, useVibration, useNetworkStatus } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils'
import { 
  Wifi, 
  WifiOff, 
  Battery, 
  BatteryLow, 
  BatteryMedium,
  BatteryFull,
  RotateCcw,
  Smartphone,
  Tablet
} from 'lucide-react'

interface MobileStatusBarProps {
  className?: string
  showBattery?: boolean
  showNetwork?: boolean
  showOrientation?: boolean
}

export function MobileStatusBar({ 
  className, 
  showBattery = true, 
  showNetwork = true,
  showOrientation = false 
}: MobileStatusBarProps) {
  const device = useMobileDevice()
  const network = useNetworkStatus()
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  if (!device.isMobile) return null

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getBatteryIcon = () => {
    // 模拟电池状态
    const batteryLevel = 0.75 // 75%
    
    if (batteryLevel > 0.8) return <BatteryFull className="h-4 w-4" />
    if (batteryLevel > 0.5) return <BatteryMedium className="h-4 w-4" />
    if (batteryLevel > 0.2) return <BatteryLow className="h-4 w-4" />
    return <Battery className="h-4 w-4" />
  }

  const getNetworkIcon = () => {
    if (!network.online) return <WifiOff className="h-4 w-4 text-red-500" />
    
    switch (network.effectiveType) {
      case '2g':
        return <Wifi className="h-4 w-4 text-yellow-500" />
      case '3g':
        return <Wifi className="h-4 w-4 text-orange-500" />
      default:
        return <Wifi className="h-4 w-4 text-green-500" />
    }
  }

  return (
    <div className={cn(
      "fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2",
      "flex items-center justify-between text-sm font-medium",
      className
    )}>
      <div className="flex items-center gap-2">
        {device.isTablet ? (
          <Tablet className="h-4 w-4" />
        ) : (
          <Smartphone className="h-4 w-4" />
        )}
        <span>{formatTime(currentTime)}</span>
      </div>
      
      <div className="flex items-center gap-3">
        {showOrientation && (
          <RotateCcw className={cn(
            "h-4 w-4 transition-transform duration-300",
            device.isLandscape && "rotate-90"
          )} />
        )}
        
        {showNetwork && getNetworkIcon()}
        
        {showBattery && getBatteryIcon()}
      </div>
    </div>
  )
}

interface MobileNavigationProps {
  className?: string
  items: {
    icon: React.ComponentType<{ className?: string }>
    label: string
    active?: boolean
    onClick: () => void
  }[]
  position?: 'bottom' | 'top'
}

export function MobileNavigation({ 
  className, 
  items, 
  position = 'bottom' 
}: MobileNavigationProps) {
  const { vibrate, lightVibration } = useVibration()
  const device = useMobileDevice()

  if (!device.isMobile) return null

  const handleItemClick = (onClick: () => void) => {
    lightVibration()
    onClick()
  }

  return (
    <div className={cn(
      "fixed left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg",
      position === 'bottom' ? 'bottom-0' : 'top-0',
      position === 'top' && 'border-t-0 border-b',
      className
    )}>
      <div className="flex items-center justify-around py-2">
        {items.map((item, index) => (
          <button
            key={index}
            onClick={() => handleItemClick(item.onClick)}
            className={cn(
              "flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-200",
              "min-w-[60px] max-w-[80px]",
              item.active 
                ? "text-blue-600 bg-blue-50 scale-105" 
                : "text-gray-600 hover:text-blue-600 hover:bg-gray-50"
            )}
          >
            <item.icon className={cn(
              "h-6 w-6 mb-1 transition-all duration-200",
              item.active && "scale-110"
            )} />
            <span className="text-xs font-medium truncate">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

interface MobileSwipeActionsProps {
  className?: string
  children: React.ReactNode
  actions: {
    icon: React.ComponentType<{ className?: string }>
    label: string
    color: string
    onClick: () => void
  }[]
  threshold?: number
}

export function MobileSwipeActions({ 
  className, 
  children, 
  actions, 
  threshold = 100 
}: MobileSwipeActionsProps) {
  const containerRef = useState<HTMLDivElement | null>(null)[1]
  const [swipeDistance, setSwipeDistance] = useState(0)
  const [isSwiping, setIsSwiping] = useState(false)
  const { lightVibration } = useVibration()

  useTouchGesture(
    { current: containerRef },
    {
      swipeLeft: () => {
        if (swipeDistance < threshold) {
          setSwipeDistance(threshold)
          lightVibration()
        }
      },
      swipeRight: () => {
        if (swipeDistance > 0) {
          setSwipeDistance(0)
          lightVibration()
        }
      },
      tap: () => {
        if (swipeDistance > 0) {
          setSwipeDistance(0)
        }
      }
    }
  )

  const handleActionClick = (onClick: () => void) => {
    lightVibration()
    setSwipeDistance(0)
    onClick()
  }

  return (
    <div className="relative overflow-hidden">
      <div 
        className="absolute right-0 top-0 bottom-0 flex"
        style={{ width: `${actions.length * 80}px` }}
      >
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={() => handleActionClick(action.onClick)}
            className={cn(
              "flex flex-col items-center justify-center text-white font-medium",
              "transition-all duration-200 hover:brightness-110"
            )}
            style={{ 
              backgroundColor: action.color,
              width: '80px'
            }}
          >
            <action.icon className="h-6 w-6 mb-1" />
            <span className="text-xs">{action.label}</span>
          </button>
        ))}
      </div>
      
      <div
        ref={containerRef}
        className={cn(
          "relative bg-white transition-transform duration-200 ease-out",
          className,
          isSwiping && "select-none"
        )}
        style={{ transform: `translateX(-${swipeDistance}px)` }}
      >
        {children}
      </div>
    </div>
  )
}

interface MobilePullToRefreshProps {
  className?: string
  onRefresh: () => Promise<void>
  children: React.ReactNode
}

export function MobilePullToRefresh({ 
  className, 
  onRefresh, 
  children 
}: MobilePullToRefreshProps) {
  const containerRef = useState<HTMLDivElement | null>(null)[1]
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const { lightVibration } = useVibration()
  const device = useMobileDevice()

  if (!device.isMobile) return <>{children}</>

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0 && !isRefreshing) {
      // 开始下拉
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (window.scrollY === 0 && !isRefreshing) {
      const touch = e.touches[0]
      const pullDistance = Math.max(0, touch.clientY - 100)
      
      if (pullDistance > 0) {
        setPullDistance(Math.min(pullDistance, 100))
        e.preventDefault()
      }
    }
  }

  const handleTouchEnd = async () => {
    if (pullDistance > 80 && !isRefreshing) {
      setIsRefreshing(true)
      lightVibration()
      
      try {
        await onRefresh()
      } finally {
        setIsRefreshing(false)
        setPullDistance(0)
      }
    } else {
      setPullDistance(0)
    }
  }

  return (
    <div className="relative">
      <div 
        className={cn(
          "absolute top-0 left-0 right-0 flex items-center justify-center",
          "transition-all duration-200"
        )}
        style={{ 
          height: `${pullDistance}px`,
          opacity: pullDistance / 100
        }}
      >
        {isRefreshing ? (
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        ) : (
          <div className={cn(
            "transition-transform duration-200",
            pullDistance > 50 && "rotate-180"
          )}>
            ↓
          </div>
        )}
      </div>
      
      <div
        ref={containerRef}
        className={className}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ transform: `translateY(${pullDistance}px)` }}
      >
        {children}
      </div>
    </div>
  )
}

// 移动端优化的按钮组件
interface MobileButtonProps {
  children: React.ReactNode
  onClick: () => void
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'small' | 'medium' | 'large'
  fullWidth?: boolean
  loading?: boolean
  disabled?: boolean
  className?: string
}

export function MobileButton({ 
  children, 
  onClick, 
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  loading = false,
  disabled = false,
  className 
}: MobileButtonProps) {
  const { lightVibration } = useVibration()
  const device = useMobileDevice()

  const handleClick = () => {
    if (!loading && !disabled) {
      lightVibration()
      onClick()
    }
  }

  const sizeClasses = {
    small: 'px-4 py-2 text-sm',
    medium: 'px-6 py-3 text-base',
    large: 'px-8 py-4 text-lg'
  }

  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300 active:bg-gray-400',
    danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800'
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading || disabled}
      className={cn(
        'relative rounded-lg font-medium transition-all duration-200',
        'transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed',
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
        sizeClasses[size],
        variantClasses[variant],
        fullWidth && 'w-full',
        device.isMobile && 'touch-manipulation',
        className
      )}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
        </div>
      )}
      <span className={cn(loading && 'opacity-0')}>
        {children}
      </span>
    </button>
  )
}