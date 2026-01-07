import React, { useState, useEffect } from 'react'

interface ExportNotificationProps {
  message: string
  type: 'success' | 'error' | 'info'
  duration?: number
  onClose?: () => void
}

export function ExportNotification({ message, type, duration = 3000, onClose }: ExportNotificationProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      if (onClose) {
        setTimeout(onClose, 300)
      }
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-500'
      case 'error':
        return 'bg-red-500'
      case 'info':
        return 'bg-blue-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✅'
      case 'error':
        return '❌'
      case 'info':
        return 'ℹ️'
      default:
        return '💬'
    }
  }

  return (
    <div className={`fixed top-4 right-4 z-50 transition-all duration-300 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'}`}>
      <div className={`${getBackgroundColor()} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 min-w-[250px]`}>
        <span className="text-lg">{getIcon()}</span>
        <span className="text-sm font-medium">{message}</span>
      </div>
    </div>
  )
}

interface ExportNotificationsContainerProps {
  notifications: Array<{
    id: string
    message: string
    type: 'success' | 'error' | 'info'
  }>
  onRemove: (id: string) => void
}

export function ExportNotificationsContainer({ notifications, onRemove }: ExportNotificationsContainerProps) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map((notification) => (
        <ExportNotification
          key={notification.id}
          message={notification.message}
          type={notification.type}
          onClose={() => onRemove(notification.id)}
        />
      ))}
    </div>
  )
}

// 自定义Hook用于管理导出通知
export function useExportNotifications() {
  const [notifications, setNotifications] = useState<Array<{
    id: string
    message: string
    type: 'success' | 'error' | 'info'
  }>>([])

  const addNotification = (message: string, type: 'success' | 'error' | 'info') => {
    const id = Date.now().toString()
    setNotifications(prev => [...prev, { id, message, type }])
  }

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id))
  }

  return {
    notifications,
    addNotification,
    removeNotification,
    NotificationContainer: () => (
      <ExportNotificationsContainer 
        notifications={notifications} 
        onRemove={removeNotification} 
      />
    )
  }
}