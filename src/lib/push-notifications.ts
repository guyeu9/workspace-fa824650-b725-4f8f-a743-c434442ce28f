import { apiClient } from '@/lib/api-client'

export interface NotificationPermission {
  granted: boolean
  denied: boolean
  prompt: boolean
}

export interface PushSubscription {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

export interface NotificationPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  image?: string
  vibrate?: number[]
  actions?: NotificationAction[]
  data?: any
  tag?: string
  requireInteraction?: boolean
  renotify?: boolean
  silent?: boolean
}

export interface NotificationAction {
  action: string
  title: string
  icon?: string
}

/**
 * 推送通知管理器
 */
export class PushNotificationManager {
  private static instance: PushNotificationManager
  private swRegistration: ServiceWorkerRegistration | null = null
  private vapidPublicKey: string = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''

  private constructor() {}

  static getInstance(): PushNotificationManager {
    if (!PushNotificationManager.instance) {
      PushNotificationManager.instance = new PushNotificationManager()
    }
    return PushNotificationManager.instance
  }

  /**
   * 初始化推送通知
   */
  async initialize(): Promise<boolean> {
    try {
      // 检查浏览器支持
      if (!('serviceWorker' in navigator)) {
        console.log('Service Worker 不支持')
        return false
      }

      if (!('PushManager' in window)) {
        console.log('推送通知不支持')
        return false
      }

      // 注册Service Worker
      this.swRegistration = await navigator.serviceWorker.register('/sw.js')
      console.log('Service Worker 注册成功')

      return true
    } catch (error) {
      console.error('推送通知初始化失败:', error)
      return false
    }
  }

  /**
   * 获取通知权限状态
   */
  getPermissionStatus(): NotificationPermission {
    if (!('Notification' in window)) {
      return { granted: false, denied: true, prompt: false }
    }

    return {
      granted: Notification.permission === 'granted',
      denied: Notification.permission === 'denied',
      prompt: Notification.permission === 'default'
    }
  }

  /**
   * 请求通知权限
   */
  async requestPermission(): Promise<boolean> {
    try {
      const permission = await Notification.requestPermission()
      return permission === 'granted'
    } catch (error) {
      console.error('请求通知权限失败:', error)
      return false
    }
  }

  /**
   * 获取推送订阅
   */
  async getPushSubscription(): Promise<PushSubscription | null> {
    if (!this.swRegistration) {
      console.error('Service Worker 未注册')
      return null
    }

    try {
      const subscription = await this.swRegistration.pushManager.getSubscription()
      if (subscription) {
        return {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: this.arrayBufferToBase64(subscription.getKey('p256dh')!),
            auth: this.arrayBufferToBase64(subscription.getKey('auth')!)
          }
        }
      }
      return null
    } catch (error) {
      console.error('获取推送订阅失败:', error)
      return null
    }
  }

  /**
   * 订阅推送通知
   */
  async subscribeToPush(): Promise<PushSubscription | null> {
    if (!this.swRegistration) {
      console.error('Service Worker 未注册')
      return null
    }

    try {
      // 检查权限
      const permissionStatus = this.getPermissionStatus()
      if (!permissionStatus.granted) {
        const granted = await this.requestPermission()
        if (!granted) {
          console.log('用户拒绝了通知权限')
          return null
        }
      }

      // 获取应用服务器密钥
      const applicationServerKey = this.urlBase64ToUint8Array(this.vapidPublicKey)

      // 创建推送订阅
      const pushSubscription = await this.swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey
      })

      const subscription: PushSubscription = {
        endpoint: pushSubscription.endpoint,
        keys: {
          p256dh: this.arrayBufferToBase64(pushSubscription.getKey('p256dh')!),
          auth: this.arrayBufferToBase64(pushSubscription.getKey('auth')!)
        }
      }

      // 发送到服务器保存
      await this.saveSubscriptionToServer(subscription)

      console.log('推送订阅成功')
      return subscription
    } catch (error) {
      console.error('推送订阅失败:', error)
      return null
    }
  }

  /**
   * 取消推送订阅
   */
  async unsubscribeFromPush(): Promise<boolean> {
    if (!this.swRegistration) {
      console.error('Service Worker 未注册')
      return false
    }

    try {
      const subscription = await this.swRegistration.pushManager.getSubscription()
      if (subscription) {
        await subscription.unsubscribe()
        
        // 从服务器删除订阅
        await this.removeSubscriptionFromServer(subscription.endpoint)
        
        console.log('推送取消订阅成功')
        return true
      }
      return false
    } catch (error) {
      console.error('推送取消订阅失败:', error)
      return false
    }
  }

  /**
   * 显示本地通知
   */
  async showNotification(payload: NotificationPayload): Promise<void> {
    if (!('Notification' in window)) {
      console.log('浏览器不支持通知')
      return
    }

    const permissionStatus = this.getPermissionStatus()
    if (!permissionStatus.granted) {
      console.log('没有通知权限')
      return
    }

    try {
      if (this.swRegistration && this.swRegistration.active) {
        // 通过Service Worker显示通知
        this.swRegistration.active.postMessage({
          type: 'SHOW_NOTIFICATION',
          payload
        })
      } else {
        // 直接显示通知
        new Notification(payload.title, {
          body: payload.body,
          icon: payload.icon,
          badge: payload.badge,
          image: payload.image,
          vibrate: payload.vibrate,
          actions: payload.actions,
          data: payload.data,
          tag: payload.tag,
          requireInteraction: payload.requireInteraction,
          renotify: payload.renotify,
          silent: payload.silent
        })
      }
    } catch (error) {
      console.error('显示通知失败:', error)
    }
  }

  /**
   * 发送推送通知（从服务器）
   */
  async sendPushNotification(userId: string, payload: NotificationPayload): Promise<boolean> {
    try {
      const response = await apiClient.post('/api/notifications/send', {
        userId,
        payload
      })
      
      return response.success
    } catch (error) {
      console.error('发送推送通知失败:', error)
      return false
    }
  }

  /**
   * 保存订阅到服务器
   */
  private async saveSubscriptionToServer(subscription: PushSubscription): Promise<void> {
    try {
      await apiClient.post('/api/notifications/subscribe', {
        subscription
      })
    } catch (error) {
      console.error('保存订阅到服务器失败:', error)
      throw error
    }
  }

  /**
   * 从服务器删除订阅
   */
  private async removeSubscriptionFromServer(endpoint: string): Promise<void> {
    try {
      await apiClient.post('/api/notifications/unsubscribe', {
        endpoint
      })
    } catch (error) {
      console.error('从服务器删除订阅失败:', error)
    }
  }

  /**
   * ArrayBuffer转Base64
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer)
    let binary = ''
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return btoa(binary)
  }

  /**
   * Base64URL转Uint8Array
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/')

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }
}

/**
 * 通知类型枚举
 */
export enum NotificationType {
  GAME_LIKED = 'GAME_LIKED',
  COMMENT_REPLY = 'COMMENT_REPLY',
  GAME_SHARED = 'GAME_SHARED',
  SYSTEM_UPDATE = 'SYSTEM_UPDATE',
  NEW_FEATURE = 'NEW_FEATURE',
  WEEKLY_SUMMARY = 'WEEKLY_SUMMARY'
}

/**
 * 创建通知内容
 */
export function createNotificationContent(
  type: NotificationType,
  data: any
): NotificationPayload {
  const basePayload: Partial<NotificationPayload> = {
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    requireInteraction: false,
    data: { type, ...data }
  }

  switch (type) {
    case NotificationType.GAME_LIKED:
      return {
        ...basePayload,
        title: '游戏获得点赞！',
        body: `您的游戏"${data.gameTitle}"获得了新的点赞`,
        tag: `game-liked-${data.gameId}`,
        actions: [
          { action: 'view', title: '查看游戏' },
          { action: 'dismiss', title: '忽略' }
        ]
      }

    case NotificationType.COMMENT_REPLY:
      return {
        ...basePayload,
        title: '评论收到回复',
        body: `${data.userName}回复了您的评论："${data.replyText}"`,
        tag: `comment-reply-${data.commentId}`,
        actions: [
          { action: 'view', title: '查看回复' },
          { action: 'reply', title: '回复' }
        ]
      }

    case NotificationType.GAME_SHARED:
      return {
        ...basePayload,
        title: '游戏被分享',
        body: `您的游戏"${data.gameTitle}"被分享到了社区`,
        tag: `game-shared-${data.gameId}`,
        actions: [
          { action: 'view', title: '查看分享' },
          { action: 'stats', title: '查看统计' }
        ]
      }

    case NotificationType.SYSTEM_UPDATE:
      return {
        ...basePayload,
        title: '系统更新',
        body: '文字冒险游戏平台已更新到新版本，快来体验新功能吧！',
        tag: 'system-update',
        requireInteraction: true,
        actions: [
          { action: 'view', title: '查看更新' },
          { action: 'later', title: '稍后' }
        ]
      }

    case NotificationType.NEW_FEATURE:
      return {
        ...basePayload,
        title: '新功能上线',
        body: data.featureDescription || '平台新增了实用功能，快来试试吧！',
        tag: `new-feature-${data.featureId}`,
        actions: [
          { action: 'try', title: '立即体验' },
          { action: 'learn', title: '了解详情' }
        ]
      }

    case NotificationType.WEEKLY_SUMMARY:
      return {
        ...basePayload,
        title: '本周游戏创作报告',
        body: `本周您创建了${data.gamesCreated}个游戏，获得了${data.totalLikes}个点赞！`,
        tag: 'weekly-summary',
        requireInteraction: false,
        silent: true
      }

    default:
      return {
        ...basePayload,
        title: '新消息',
        body: '您有一条新的通知'
      }
  }
}

/**
 * 通知设置管理
 */
export class NotificationSettings {
  private static readonly STORAGE_KEY = 'notification-settings'

  static getSettings(): Record<string, boolean> {
    if (typeof window === 'undefined') return {}
    
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      return stored ? JSON.parse(stored) : this.getDefaultSettings()
    } catch {
      return this.getDefaultSettings()
    }
  }

  static setSettings(settings: Record<string, boolean>): void {
    if (typeof window === 'undefined') return
    
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(settings))
    } catch (error) {
      console.error('保存通知设置失败:', error)
    }
  }

  static updateSetting(type: NotificationType, enabled: boolean): void {
    const settings = this.getSettings()
    settings[type] = enabled
    this.setSettings(settings)
  }

  static isEnabled(type: NotificationType): boolean {
    const settings = this.getSettings()
    return settings[type] ?? true // 默认启用
  }

  private static getDefaultSettings(): Record<string, boolean> {
    return {
      [NotificationType.GAME_LIKED]: true,
      [NotificationType.COMMENT_REPLY]: true,
      [NotificationType.GAME_SHARED]: true,
      [NotificationType.SYSTEM_UPDATE]: true,
      [NotificationType.NEW_FEATURE]: true,
      [NotificationType.WEEKLY_SUMMARY]: false
    }
  }
}