import { useState, useEffect } from 'react'

interface MobileDeviceInfo {
  isMobile: boolean
  isIOS: boolean
  isAndroid: boolean
  isTablet: boolean
  isPortrait: boolean
  isLandscape: boolean
  screenWidth: number
  screenHeight: number
  safeAreaInsets: {
    top: number
    bottom: number
    left: number
    right: number
  }
}

interface TouchGesture {
  swipeLeft?: () => void
  swipeRight?: () => void
  swipeUp?: () => void
  swipeDown?: () => void
  tap?: () => void
  doubleTap?: () => void
  longPress?: () => void
  pinch?: (scale: number) => void
}

/**
 * 移动端设备检测Hook
 */
export function useMobileDevice(): MobileDeviceInfo {
  const [deviceInfo, setDeviceInfo] = useState<MobileDeviceInfo>({
    isMobile: false,
    isIOS: false,
    isAndroid: false,
    isTablet: false,
    isPortrait: true,
    isLandscape: false,
    screenWidth: 0,
    screenHeight: 0,
    safeAreaInsets: { top: 0, bottom: 0, left: 0, right: 0 }
  })

  useEffect(() => {
    const updateDeviceInfo = () => {
      const userAgent = navigator.userAgent.toLowerCase()
      const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent)
      const isIOS = /iphone|ipad|ipod/i.test(userAgent)
      const isAndroid = /android/i.test(userAgent)
      const isTablet = /ipad|android(?!.*mobile)|tablet/i.test(userAgent)
      const isPortrait = window.innerHeight > window.innerWidth
      const isLandscape = window.innerWidth > window.innerHeight

      // 计算安全区域（iPhone X及以上）
      const safeAreaInsets = {
        top: isIOS ? 44 : 0, // iOS状态栏高度
        bottom: isIOS ? 34 : 0, // iOS底部安全区域
        left: 0,
        right: 0
      }

      setDeviceInfo({
        isMobile,
        isIOS,
        isAndroid,
        isTablet,
        isPortrait,
        isLandscape,
        screenWidth: window.innerWidth,
        screenHeight: window.innerHeight,
        safeAreaInsets
      })
    }

    updateDeviceInfo()
    window.addEventListener('resize', updateDeviceInfo)
    window.addEventListener('orientationchange', updateDeviceInfo)

    return () => {
      window.removeEventListener('resize', updateDeviceInfo)
      window.removeEventListener('orientationchange', updateDeviceInfo)
    }
  }, [])

  return deviceInfo
}

/**
 * 触摸手势识别Hook
 */
export function useTouchGesture(elementRef: React.RefObject<HTMLElement>, gestures: TouchGesture) {
  const [touchStart, setTouchStart] = useState<{ x: number; y: number; time: number } | null>(null)
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number; time: number } | null>(null)
  const [lastTap, setLastTap] = useState<number>(0)
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null)

  const minSwipeDistance = 50
  const maxTapDelay = 300
  const maxDoubleTapDelay = 300
  const longPressDelay = 500

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0]
      const startPoint = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now()
      }
      
      setTouchStart(startPoint)
      setTouchEnd(null)

      // 长按检测
      if (gestures.longPress) {
        const timer = setTimeout(() => {
          gestures.longPress?.()
        }, longPressDelay)
        setLongPressTimer(timer)
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      // 清除长按定时器
      if (longPressTimer) {
        clearTimeout(longPressTimer)
        setLongPressTimer(null)
      }

      const touch = e.touches[0]
      setTouchEnd({
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now()
      })
    }

    const handleTouchEnd = () => {
      // 清除长按定时器
      if (longPressTimer) {
        clearTimeout(longPressTimer)
        setLongPressTimer(null)
      }

      if (!touchStart || !touchEnd) return

      const duration = touchEnd.time - touchStart.time
      const distanceX = touchEnd.x - touchStart.x
      const distanceY = touchEnd.y - touchStart.y
      const absDistanceX = Math.abs(distanceX)
      const absDistanceY = Math.abs(distanceY)

      // 判断是否为有效手势
      const isValidSwipe = duration < 500 && (absDistanceX > minSwipeDistance || absDistanceY > minSwipeDistance)
      const isValidTap = duration < maxTapDelay && absDistanceX < 10 && absDistanceY < 10

      if (isValidSwipe) {
        // 滑动手势
        if (absDistanceX > absDistanceY) {
          if (distanceX > 0) {
            gestures.swipeRight?.()
          } else {
            gestures.swipeLeft?.()
          }
        } else {
          if (distanceY > 0) {
            gestures.swipeDown?.()
          } else {
            gestures.swipeUp?.()
          }
        }
      } else if (isValidTap) {
        // 点击手势
        const now = Date.now()
        const timeSinceLastTap = now - lastTap

        if (timeSinceLastTap < maxDoubleTapDelay) {
          // 双击
          gestures.doubleTap?.()
          setLastTap(0)
        } else {
          // 单击
          gestures.tap?.()
          setLastTap(now)
        }
      }

      setTouchStart(null)
      setTouchEnd(null)
    }

    element.addEventListener('touchstart', handleTouchStart, { passive: true })
    element.addEventListener('touchmove', handleTouchMove, { passive: true })
    element.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchmove', handleTouchMove)
      element.removeEventListener('touchend', handleTouchEnd)
      
      if (longPressTimer) {
        clearTimeout(longPressTimer)
      }
    }
  }, [elementRef, gestures, touchStart, touchEnd, lastTap, longPressTimer])
}

/**
 * 振动反馈Hook
 */
export function useVibration() {
  const vibrate = (pattern: number | number[]) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern)
    }
  }

  const lightVibration = () => vibrate(50)
  const mediumVibration = () => vibrate([100, 50, 100])
  const strongVibration = () => vibrate([200, 100, 200, 100, 200])

  return {
    vibrate,
    lightVibration,
    mediumVibration,
    strongVibration
  }
}

/**
 * 设备方向Hook
 */
export function useDeviceOrientation() {
  const [orientation, setOrientation] = useState({
    angle: 0,
    type: 'portrait-primary' as OrientationType
  })

  useEffect(() => {
    const updateOrientation = () => {
      setOrientation({
        angle: screen.orientation?.angle || 0,
        type: screen.orientation?.type || 'portrait-primary'
      })
    }

    updateOrientation()
    
    if (screen.orientation) {
      screen.orientation.addEventListener('change', updateOrientation)
      return () => screen.orientation.removeEventListener('change', updateOrientation)
    }
  }, [])

  return orientation
}

/**
 * 电池状态Hook
 */
export function useBattery() {
  const [battery, setBattery] = useState<{
    charging: boolean
    level: number
    chargingTime: number
    dischargingTime: number
  } | null>(null)

  useEffect(() => {
    const getBattery = async () => {
      if ('getBattery' in navigator) {
        try {
          const batteryManager = await (navigator as any).getBattery()
          
          const updateBatteryInfo = () => {
            setBattery({
              charging: batteryManager.charging,
              level: batteryManager.level,
              chargingTime: batteryManager.chargingTime,
              dischargingTime: batteryManager.dischargingTime
            })
          }

          updateBatteryInfo()
          
          batteryManager.addEventListener('chargingchange', updateBatteryInfo)
          batteryManager.addEventListener('levelchange', updateBatteryInfo)
          batteryManager.addEventListener('chargingtimechange', updateBatteryInfo)
          batteryManager.addEventListener('dischargingtimechange', updateBatteryInfo)

          return () => {
            batteryManager.removeEventListener('chargingchange', updateBatteryInfo)
            batteryManager.removeEventListener('levelchange', updateBatteryInfo)
            batteryManager.removeEventListener('chargingtimechange', updateBatteryInfo)
            batteryManager.removeEventListener('dischargingtimechange', updateBatteryInfo)
          }
        } catch (error) {
          console.error('获取电池状态失败:', error)
        }
      }
    }

    getBattery()
  }, [])

  return battery
}

/**
 * 网络状态Hook
 */
export function useNetworkStatus() {
  const [networkStatus, setNetworkStatus] = useState({
    online: navigator.onLine,
    effectiveType: (navigator as any).connection?.effectiveType || '4g',
    downlink: (navigator as any).connection?.downlink || 0,
    rtt: (navigator as any).connection?.rtt || 0
  })

  useEffect(() => {
    const updateNetworkStatus = () => {
      setNetworkStatus(prev => ({
        ...prev,
        online: navigator.onLine
      }))
    }

    const updateConnectionInfo = () => {
      const connection = (navigator as any).connection
      setNetworkStatus(prev => ({
        ...prev,
        effectiveType: connection?.effectiveType || '4g',
        downlink: connection?.downlink || 0,
        rtt: connection?.rtt || 0
      }))
    }

    window.addEventListener('online', updateNetworkStatus)
    window.addEventListener('offline', updateNetworkStatus)
    
    if ('connection' in navigator) {
      const connection = (navigator as any).connection
      connection.addEventListener('change', updateConnectionInfo)
    }

    return () => {
      window.removeEventListener('online', updateNetworkStatus)
      window.removeEventListener('offline', updateNetworkStatus)
      
      if ('connection' in navigator) {
        const connection = (navigator as any).connection
        connection.removeEventListener('change', updateConnectionInfo)
      }
    }
  }, [])

  return networkStatus
}

/**
 * 全屏模式Hook
 */
export function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(false)

  const enterFullscreen = async (element?: HTMLElement) => {
    const target = element || document.documentElement
    
    try {
      if (target.requestFullscreen) {
        await target.requestFullscreen()
      } else if ((target as any).webkitRequestFullscreen) {
        await (target as any).webkitRequestFullscreen()
      } else if ((target as any).msRequestFullscreen) {
        await (target as any).msRequestFullscreen()
      }
    } catch (error) {
      console.error('进入全屏模式失败:', error)
    }
  }

  const exitFullscreen = async () => {
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen()
      } else if ((document as any).webkitExitFullscreen) {
        await (document as any).webkitExitFullscreen()
      } else if ((document as any).msExitFullscreen) {
        await (document as any).msExitFullscreen()
      }
    } catch (error) {
      console.error('退出全屏模式失败:', error)
    }
  }

  const toggleFullscreen = (element?: HTMLElement) => {
    if (isFullscreen) {
      exitFullscreen()
    } else {
      enterFullscreen(element)
    }
  }

  useEffect(() => {
    const updateFullscreenStatus = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    updateFullscreenStatus()
    
    document.addEventListener('fullscreenchange', updateFullscreenStatus)
    document.addEventListener('webkitfullscreenchange', updateFullscreenStatus)
    document.addEventListener('msfullscreenchange', updateFullscreenStatus)

    return () => {
      document.removeEventListener('fullscreenchange', updateFullscreenStatus)
      document.removeEventListener('webkitfullscreenchange', updateFullscreenStatus)
      document.removeEventListener('msfullscreenchange', updateFullscreenStatus)
    }
  }, [])

  return {
    isFullscreen,
    enterFullscreen,
    exitFullscreen,
    toggleFullscreen
  }
}