// 回退的文件导出实现，用于Web环境
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

export class WebFileExportManager {
  private static instance: WebFileExportManager

  private constructor() {}

  public static getInstance(): WebFileExportManager {
    if (!WebFileExportManager.instance) {
      WebFileExportManager.instance = new WebFileExportManager()
    }
    return WebFileExportManager.instance
  }

  public async exportFile(options: ExportOptions): Promise<ExportResult> {
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

      // Web环境下显示简单的提示
      if (options.showToast) {
        this.showWebNotification(`文件已下载: ${options.fileName}`)
      }

      return { success: true, filePath: options.fileName }
    } catch (error) {
      console.error('Web export failed:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : '下载失败'
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

  private showWebNotification(message: string): void {
    // 创建简单的DOM通知
    const notification = document.createElement('div')
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #10b981;
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 9999;
      font-size: 14px;
      max-width: 300px;
      opacity: 0;
      transform: translateY(-20px);
      transition: all 0.3s ease;
    `
    notification.textContent = message
    document.body.appendChild(notification)

    // 动画显示
    setTimeout(() => {
      notification.style.opacity = '1'
      notification.style.transform = 'translateY(0)'
    }, 100)

    // 3秒后移除
    setTimeout(() => {
      notification.style.opacity = '0'
      notification.style.transform = 'translateY(-20px)'
      setTimeout(() => {
        document.body.removeChild(notification)
      }, 300)
    }, 3000)
  }
}

// 创建单例实例
export const webFileExportManager = WebFileExportManager.getInstance()

// 兼容现有代码的导出函数
export const exportFile = async (options: ExportOptions) => {
  return webFileExportManager.exportFile(options)
}

export const exportJson = async (fileName: string, data: any, showToast: boolean = true) => {
  return webFileExportManager.exportJson(fileName, data, showToast)
}

export const exportText = async (fileName: string, text: string, showToast: boolean = true) => {
  return webFileExportManager.exportText(fileName, text, showToast)
}