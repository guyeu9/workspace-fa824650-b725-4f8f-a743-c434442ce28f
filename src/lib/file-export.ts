import { Filesystem, Directory, Encoding } from '@capacitor/filesystem'
import { Device } from '@capacitor/device'
import { Toast } from '@capacitor/toast'
import { webFileExportManager } from './web-file-export'

export interface ExportOptions {
  fileName: string
  content: string
  contentType: 'application/json' | 'text/plain'
  showToast?: boolean
}

export interface ExportResult {
  success: boolean
  filePath?: string
  error?: string
}

export class FileExportManager {
  private static instance: FileExportManager
  private isNativePlatform: boolean = false
  private hasPermissions: boolean = false

  private constructor() {
    this.initializePlatform()
  }

  public static getInstance(): FileExportManager {
    if (!FileExportManager.instance) {
      FileExportManager.instance = new FileExportManager()
    }
    return FileExportManager.instance
  }

  private async initializePlatform(): Promise<void> {
    try {
      // 检查是否在浏览器环境中
      if (typeof window === 'undefined') {
        this.isNativePlatform = false
        console.log('Running on server, assuming web platform')
        return
      }
      
      const info = await Device.getInfo()
      this.isNativePlatform = info.platform !== 'web'
      console.log('Platform info:', info)
    } catch (error) {
      console.log('Failed to detect platform, assuming web:', error)
      this.isNativePlatform = false
    }
  }

  private async requestPermissions(): Promise<boolean> {
    if (!this.isNativePlatform) {
      return true
    }

    try {
      // 检查是否已经拥有权限
      const permissions = await Filesystem.checkPermissions()
      console.log('Current permissions:', permissions)

      if (permissions.publicStorage === 'granted') {
        this.hasPermissions = true
        return true
      }

      // 请求权限
      const result = await Filesystem.requestPermissions()
      console.log('Permission request result:', result)
      
      this.hasPermissions = result.publicStorage === 'granted'
      return this.hasPermissions
    } catch (error) {
      console.error('Permission request failed:', error)
      
      // 对于Android 11+，尝试使用不同的权限请求方式
      try {
        const result = await (Filesystem as any).requestPermissions({
          permissions: ['publicStorage']
        })
        this.hasPermissions = result.publicStorage === 'granted'
        return this.hasPermissions
      } catch (retryError) {
        console.error('Permission retry failed:', retryError)
        return false
      }
    }
  }

  private async downloadWithWebAPI(options: ExportOptions): Promise<ExportResult> {
    try {
      // 使用标准的Web API进行下载
      const blob = new Blob([options.content], { type: options.contentType })
      const url = URL.createObjectURL(blob)
      
      const a = document.createElement('a')
      a.href = url
      a.download = options.fileName
      a.style.display = 'none'
      
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      
      // 延迟清理URL，确保下载开始
      setTimeout(() => {
        URL.revokeObjectURL(url)
      }, 1000)

      if (options.showToast) {
        await Toast.show({
          text: `文件已下载: ${options.fileName}`,
          duration: 'short'
        })
      }

      return { success: true, filePath: options.fileName }
    } catch (error) {
      console.error('Web API download failed:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : '下载失败'
      }
    }
  }

  private async saveWithFilesystemAPI(options: ExportOptions): Promise<ExportResult> {
    try {
      // 请求权限
      const hasPermission = await this.requestPermissions()
      if (!hasPermission) {
        return { 
          success: false, 
          error: '需要存储权限才能保存文件，请在设置中授予权限'
        }
      }

      // 生成文件路径
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const fileNameWithTimestamp = options.fileName.replace(/\.(\w+)$/, `-${timestamp}.$1`)
      
      // 尝试保存到下载目录
      let filePath: string
      let directory: Directory

      // 根据Android版本选择不同的目录
      try {
        // 首先尝试外部存储根目录
        directory = Directory.ExternalStorage
        filePath = `Download/${fileNameWithTimestamp}`
        
        const result = await Filesystem.writeFile({
          path: filePath,
          data: options.content,
          directory: directory,
          encoding: Encoding.UTF8,
          recursive: true
        })

        console.log('File saved to external storage:', result)
        
      } catch (externalError) {
        console.log('External storage failed, trying Documents:', externalError)
        
        // 如果外部存储失败，尝试Documents目录
        try {
          directory = Directory.Documents
          filePath = fileNameWithTimestamp
          
          const result = await Filesystem.writeFile({
            path: filePath,
            data: options.content,
            directory: directory,
            encoding: Encoding.UTF8,
            recursive: true
          })

          console.log('File saved to documents:', result)
          
        } catch (documentsError) {
          console.log('Documents failed, trying external root:', documentsError)
          
          // 最后尝试外部根目录
          directory = Directory.ExternalStorage
          filePath = fileNameWithTimestamp
          
          const result = await Filesystem.writeFile({
            path: filePath,
            data: options.content,
            directory: directory,
            encoding: Encoding.UTF8,
            recursive: true
          })

          console.log('File saved to external root:', result)
        }
      }

      if (options.showToast) {
        await Toast.show({
          text: `文件已保存到: ${filePath}`,
          duration: 'long'
        })
      }

      return { 
        success: true, 
        filePath: filePath 
      }

    } catch (error) {
      console.error('Filesystem save failed:', error)
      
      // 如果原生API失败，回退到Web API
      console.log('Falling back to Web API')
      return this.downloadWithWebAPI(options)
    }
  }

  public async exportFile(options: ExportOptions): Promise<ExportResult> {
    try {
      console.log('Exporting file:', options)

      // 如果原生平台检测失败，使用Web API作为回退
      if (!this.isNativePlatform) {
        console.log('Using web export manager as fallback')
        return await webFileExportManager.exportFile(options)
      }

      // 尝试使用原生API，如果失败则回退到Web API
      try {
        return await this.saveWithFilesystemAPI(options)
      } catch (nativeError) {
        console.error('Native export failed, falling back to web:', nativeError)
        return await webFileExportManager.exportFile(options)
      }
    } catch (error) {
      console.error('Export failed:', error)
      
      const errorMessage = error instanceof Error ? error.message : '导出失败'
      
      if (options.showToast) {
        try {
          await Toast.show({
            text: `导出失败: ${errorMessage}`,
            duration: 'long'
          })
        } catch (toastError) {
          console.error('Failed to show toast:', toastError)
        }
      }

      return { 
        success: false, 
        error: errorMessage 
      }
    }
  }

  public async exportJson(fileName: string, data: any, showToast: boolean = true): Promise<ExportResult> {
    const content = JSON.stringify(data, null, 2)
    return this.exportFile({
      fileName,
      content,
      contentType: 'application/json',
      showToast
    })
  }

  public async exportText(fileName: string, text: string, showToast: boolean = true): Promise<ExportResult> {
    return this.exportFile({
      fileName,
      content: text,
      contentType: 'text/plain',
      showToast
    })
  }
}

// 创建单例实例
export const fileExportManager = FileExportManager.getInstance()

// 兼容现有代码的导出函数
export const exportFile = async (options: ExportOptions) => {
  return fileExportManager.exportFile(options)
}

export const exportJson = async (fileName: string, data: any, showToast: boolean = true) => {
  return fileExportManager.exportJson(fileName, data, showToast)
}

export const exportText = async (fileName: string, text: string, showToast: boolean = true) => {
  return fileExportManager.exportText(fileName, text, showToast)
}