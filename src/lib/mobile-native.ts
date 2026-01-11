import { Capacitor } from '@capacitor/core'
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera'
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'
import { Device } from '@capacitor/device'
import { Geolocation } from '@capacitor/geolocation'
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics'
import { Network } from '@capacitor/network'
import { Storage } from '@capacitor/storage'
import { StatusBar, Style } from '@capacitor/status-bar'
import { SplashScreen } from '@capacitor/splash-screen'
import { PushNotifications } from '@capacitor/push-notifications'
import { LocalNotifications } from '@capacitor/local-notifications'
import { ActionSheet } from '@capacitor/action-sheet'
import { Dialog } from '@capacitor/dialog'
import { Browser } from '@capacitor/browser'
import { App } from '@capacitor/app'
import { BackgroundTask } from '@capacitor/background-task'

/**
 * 移动端原生功能管理器
 */
export class MobileNativeManager {
  private static instance: MobileNativeManager
  private isNativePlatform: boolean = false

  private constructor() {
    this.isNativePlatform = Capacitor.isNativePlatform()
  }

  static getInstance(): MobileNativeManager {
    if (!MobileNativeManager.instance) {
      MobileNativeManager.instance = new MobileNativeManager()
    }
    return MobileNativeManager.instance
  }

  /**
   * 获取设备信息
   */
  async getDeviceInfo() {
    if (!this.isNativePlatform) {
      return {
        platform: 'web',
        isVirtual: false,
        manufacturer: 'unknown',
        model: 'unknown',
        operatingSystem: 'unknown',
        osVersion: 'unknown'
      }
    }

    try {
      const info = await Device.getInfo()
      return {
        platform: info.platform,
        isVirtual: info.isVirtual,
        manufacturer: info.manufacturer,
        model: info.model,
        operatingSystem: info.operatingSystem,
        osVersion: info.osVersion
      }
    } catch (error) {
      console.error('获取设备信息失败:', error)
      throw error
    }
  }

  /**
   * 拍照或选择图片
   */
  async takePhoto(options: {
    quality?: number
    allowEditing?: boolean
    resultType?: CameraResultType
    saveToGallery?: boolean
    width?: number
    height?: number
  } = {}) {
    if (!this.isNativePlatform) {
      throw new Error('拍照功能需要在原生应用中运行')
    }

    try {
      const photo = await Camera.getPhoto({
        quality: options.quality || 90,
        allowEditing: options.allowEditing || false,
        resultType: options.resultType || CameraResultType.DataUrl,
        saveToGallery: options.saveToGallery || false,
        width: options.width,
        height: options.height,
        source: CameraSource.Camera
      })

      return {
        dataUrl: photo.dataUrl,
        base64String: photo.base64String,
        webPath: photo.webPath,
        format: photo.format,
        saved: photo.saved
      }
    } catch (error) {
      console.error('拍照失败:', error)
      throw error
    }
  }

  /**
   * 选择图片
   */
  async selectPhoto(options: {
    quality?: number
    allowEditing?: boolean
    resultType?: CameraResultType
    width?: number
    height?: number
  } = {}) {
    if (!this.isNativePlatform) {
      throw new Error('选择图片功能需要在原生应用中运行')
    }

    try {
      const photo = await Camera.getPhoto({
        quality: options.quality || 90,
        allowEditing: options.allowEditing || false,
        resultType: options.resultType || CameraResultType.DataUrl,
        width: options.width,
        height: options.height,
        source: CameraSource.Photos
      })

      return {
        dataUrl: photo.dataUrl,
        base64String: photo.base64String,
        webPath: photo.webPath,
        format: photo.format
      }
    } catch (error) {
      console.error('选择图片失败:', error)
      throw error
    }
  }

  /**
   * 保存文件到设备
   */
  async saveFile(fileName: string, data: string, options: {
    directory?: Directory
    encoding?: Encoding
    recursive?: boolean
  } = {}) {
    if (!this.isNativePlatform) {
      // Web端使用本地存储
      localStorage.setItem(fileName, data)
      return { uri: `localstorage://${fileName}` }
    }

    try {
      const result = await Filesystem.writeFile({
        path: fileName,
        data: data,
        directory: options.directory || Directory.Documents,
        encoding: options.encoding || Encoding.UTF8,
        recursive: options.recursive || false
      })

      return result
    } catch (error) {
      console.error('保存文件失败:', error)
      throw error
    }
  }

  /**
   * 读取文件
   */
  async readFile(fileName: string, options: {
    directory?: Directory
    encoding?: Encoding
  } = {}) {
    if (!this.isNativePlatform) {
      // Web端使用本地存储
      const data = localStorage.getItem(fileName)
      return data
    }

    try {
      const result = await Filesystem.readFile({
        path: fileName,
        directory: options.directory || Directory.Documents,
        encoding: options.encoding || Encoding.UTF8
      })

      return result.data
    } catch (error) {
      console.error('读取文件失败:', error)
      throw error
    }
  }

  /**
   * 获取地理位置
   */
  async getCurrentPosition(options: {
    enableHighAccuracy?: boolean
    timeout?: number
    maximumAge?: number
  } = {}) {
    if (!this.isNativePlatform) {
      throw new Error('地理位置功能需要在原生应用中运行')
    }

    try {
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: options.enableHighAccuracy || true,
        timeout: options.timeout || 10000,
        maximumAge: options.maximumAge || 0
      })

      return {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        altitude: position.coords.altitude,
        accuracy: position.coords.accuracy,
        altitudeAccuracy: position.coords.altitudeAccuracy,
        heading: position.coords.heading,
        speed: position.coords.speed,
        timestamp: position.timestamp
      }
    } catch (error) {
      console.error('获取地理位置失败:', error)
      throw error
    }
  }

  /**
   * 分享内容
   */
  async share(options: {
    title?: string
    text?: string
    url?: string
    dialogTitle?: string
  }) {
    if (!this.isNativePlatform) {
      // Web端使用Web Share API
      if (navigator.share) {
        try {
          await navigator.share({
            title: options.title,
            text: options.text,
            url: options.url
          })
          return true
        } catch (error) {
          console.error('分享失败:', error)
          return false
        }
      } else {
        // 复制到剪贴板
        const shareText = `${options.title || ''}\n${options.text || ''}\n${options.url || ''}`
        await navigator.clipboard.writeText(shareText)
        return true
      }
    }

    try {
      await Share.share({
        title: options.title,
        text: options.text,
        url: options.url,
        dialogTitle: options.dialogTitle
      })
      return true
    } catch (error) {
      console.error('分享失败:', error)
      return false
    }
  }

  /**
   * 振动反馈
   */
  async vibrate(options: {
    duration: number
    style?: ImpactStyle
    type?: NotificationType
  }) {
    if (!this.isNativePlatform) {
      // Web端使用Vibration API
      if ('vibrate' in navigator) {
        navigator.vibrate(options.duration)
      }
      return
    }

    try {
      if (options.type) {
        await Haptics.notification({ type: options.type })
      } else if (options.style) {
        await Haptics.impact({ style: options.style })
      } else {
        await Haptics.vibrate({ duration: options.duration })
      }
    } catch (error) {
      console.error('振动反馈失败:', error)
    }
  }

  /**
   * 获取网络状态
   */
  async getNetworkStatus() {
    if (!this.isNativePlatform) {
      return {
        connected: navigator.onLine,
        connectionType: 'unknown'
      }
    }

    try {
      const status = await Network.getStatus()
      return {
        connected: status.connected,
        connectionType: status.connectionType
      }
    } catch (error) {
      console.error('获取网络状态失败:', error)
      throw error
    }
  }

  /**
   * 本地存储
   */
  async setStorage(key: string, value: string) {
    if (!this.isNativePlatform) {
      localStorage.setItem(key, value)
      return
    }

    try {
      await Storage.set({ key, value })
    } catch (error) {
      console.error('本地存储失败:', error)
      throw error
    }
  }

  /**
   * 获取本地存储
   */
  async getStorage(key: string): Promise<string | null> {
    if (!this.isNativePlatform) {
      return localStorage.getItem(key)
    }

    try {
      const result = await Storage.get({ key })
      return result.value
    } catch (error) {
      console.error('获取本地存储失败:', error)
      throw error
    }
  }

  /**
   * 显示动作表
   */
  async showActionSheet(options: {
    title?: string
    message?: string
    options: string[]
    destructiveButtonIndex?: number
    cancelButtonIndex?: number
  }) {
    if (!this.isNativePlatform) {
      // Web端使用confirm
      const choice = window.confirm(`${options.title || ''}\n${options.message || ''}\n\n${options.options.join('\n')}`)
      return choice ? 0 : -1
    }

    try {
      const result = await ActionSheet.showActions({
        title: options.title,
        message: options.message,
        options: options.options,
        destructiveButtonIndex: options.destructiveButtonIndex,
        cancelButtonIndex: options.cancelButtonIndex
      })

      return result.index
    } catch (error) {
      console.error('显示动作表失败:', error)
      throw error
    }
  }

  /**
   * 显示对话框
   */
  async showDialog(options: {
    title?: string
    message: string
    buttonTitle?: string
    cancelButtonTitle?: string
  }) {
    if (!this.isNativePlatform) {
      // Web端使用alert
      const confirmed = window.confirm(`${options.title || ''}\n${options.message}`)
      return confirmed
    }

    try {
      const result = await Dialog.confirm({
        title: options.title,
        message: options.message,
        buttonTitle: options.buttonTitle,
        cancelButtonTitle: options.cancelButtonTitle
      })

      return result.value
    } catch (error) {
      console.error('显示对话框失败:', error)
      throw error
    }
  }

  /**
   * 打开应用内浏览器
   */
  async openBrowser(url: string, options: {
    toolbarColor?: string
    showTitle?: boolean
    presentationStyle?: 'fullscreen' | 'popover'
  } = {}) {
    if (!this.isNativePlatform) {
      // Web端直接打开
      window.open(url, '_blank')
      return
    }

    try {
      await Browser.open({
        url: url,
        toolbarColor: options.toolbarColor,
        showTitle: options.showTitle,
        presentationStyle: options.presentationStyle
      })
    } catch (error) {
      console.error('打开浏览器失败:', error)
      throw error
    }
  }

  /**
   * 设置状态栏
   */
  async setStatusBar(options: {
    style?: Style
    backgroundColor?: string
    overlaysWebView?: boolean
  }) {
    if (!this.isNativePlatform) return

    try {
      await StatusBar.setStyle({ style: options.style || Style.Dark })
      if (options.backgroundColor) {
        await StatusBar.setBackgroundColor({ color: options.backgroundColor })
      }
      if (options.overlaysWebView !== undefined) {
        await StatusBar.setOverlaysWebView({ overlay: options.overlaysWebView })
      }
    } catch (error) {
      console.error('设置状态栏失败:', error)
    }
  }

  /**
   * 隐藏启动画面
   */
  async hideSplashScreen() {
    if (!this.isNativePlatform) return

    try {
      await SplashScreen.hide()
    } catch (error) {
      console.error('隐藏启动画面失败:', error)
    }
  }

  /**
   * 获取应用信息
   */
  async getAppInfo() {
    try {
      const info = await App.getInfo()
      return {
        name: info.name,
        id: info.id,
        build: info.build,
        version: info.version
      }
    } catch (error) {
      console.error('获取应用信息失败:', error)
      return null
    }
  }

  /**
   * 监听应用状态变化
   */
  addAppStateListener(callback: (state: { isActive: boolean }) => void) {
    if (!this.isNativePlatform) {
      // Web端监听页面可见性
      document.addEventListener('visibilitychange', () => {
        callback({ isActive: !document.hidden })
      })
      return
    }

    App.addListener('appStateChange', callback)
  }

  /**
   * 注册推送通知
   */
  async registerPushNotifications() {
    if (!this.isNativePlatform) return

    try {
      // 请求权限
      const permission = await PushNotifications.requestPermissions()
      if (permission.receive !== 'granted') {
        throw new Error('用户拒绝了推送通知权限')
      }

      // 注册推送
      await PushNotifications.register()

      // 监听推送事件
      PushNotifications.addListener('pushNotificationReceived', (notification) => {
        console.log('收到推送通知:', notification)
      })

      PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
        console.log('推送通知动作:', action)
      })

      return true
    } catch (error) {
      console.error('注册推送通知失败:', error)
      return false
    }
  }

  /**
   * 发送本地通知
   */
  async sendLocalNotification(options: {
    title: string
    body: string
    id: number
    schedule?: { at: Date; repeats?: boolean }
    actionTypeId?: string
    extra?: any
  }) {
    if (!this.isNativePlatform) return

    try {
      await LocalNotifications.schedule({
        notifications: [{
          title: options.title,
          body: options.body,
          id: options.id,
          schedule: options.schedule,
          actionTypeId: options.actionTypeId,
          extra: options.extra
        }]
      })
    } catch (error) {
      console.error('发送本地通知失败:', error)
    }
  }

  /**
   * 是否是原生平台
   */
  get isNative(): boolean {
    return this.isNativePlatform
  }
}

// 导出单例实例
export const mobileNative = MobileNativeManager.getInstance()