import { Capacitor } from '@capacitor/core'
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'

export interface DownloadOptions {
  fileName: string
  mimeType?: string
  data: string | ArrayBuffer | Blob
  onProgress?: (progress: number) => void
  onError?: (error: Error) => void
  onSuccess?: (result: DownloadResult) => void
}

export interface DownloadResult {
  success: boolean
  uri?: string
  error?: string
}

export class PlatformFileDownloader {
  private static isNativePlatform(): boolean {
    return Capacitor.isNativePlatform()
  }

  private static isMobileBrowser(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    )
  }

  private static async downloadWeb(
    options: DownloadOptions
  ): Promise<DownloadResult> {
    try {
      let blob: Blob

      if (options.data instanceof Blob) {
        blob = options.data
      } else if (typeof options.data === 'string') {
        blob = new Blob([options.data], {
          type: options.mimeType || 'text/plain'
        })
      } else {
        blob = new Blob([options.data], {
          type: options.mimeType || 'application/octet-stream'
        })
      }

      const url = URL.createObjectURL(blob)
      let downloadAttempted = false

      try {
        const link = document.createElement('a')
        link.href = url
        link.download = options.fileName
        link.style.display = 'none'
        document.body.appendChild(link)

        link.addEventListener('click', () => {
          downloadAttempted = true
          options.onProgress?.(100)
        })

        link.click()
        document.body.removeChild(link)

        if (!downloadAttempted) {
          throw new Error('Download was not triggered')
        }

        await new Promise(resolve => setTimeout(resolve, 100))

        return {
          success: true,
          uri: url
        }
      } finally {
        if (url) {
          setTimeout(() => {
            try {
              URL.revokeObjectURL(url)
            } catch (e) {
              console.warn('Failed to revoke object URL:', e)
            }
          }, 1000)
        }
      }
    } catch (error) {
      console.error('Web download failed:', error)
      throw error
    }
  }

  private static async downloadNative(
    options: DownloadOptions
  ): Promise<DownloadResult> {
    try {
      let data: string

      if (typeof options.data === 'string') {
        data = options.data
      } else if (options.data instanceof Blob) {
        data = await this.blobToBase64(options.data)
      } else {
        const blob = new Blob([options.data], {
          type: options.mimeType || 'application/octet-stream'
        })
        data = await this.blobToBase64(blob)
      }

      const result = await Filesystem.writeFile({
        path: options.fileName,
        data: data,
        directory: Directory.Documents,
        encoding: Encoding.UTF8,
        recursive: true
      })

      return {
        success: true,
        uri: result.uri
      }
    } catch (error) {
      console.error('Native download failed:', error)
      throw error
    }
  }

  private static async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        const result = reader.result as string
        resolve(result.split(',')[1])
      }
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  }

  private static async downloadWithFallback(
    options: DownloadOptions
  ): Promise<DownloadResult> {
    const errors: Error[] = []

    try {
      return await this.downloadWeb(options)
    } catch (webError) {
      console.warn('Web download failed, trying alternative:', webError)
      errors.push(webError)

      if (this.isMobileBrowser()) {
        try {
          const blob =
            options.data instanceof Blob
              ? options.data
              : new Blob([options.data], {
                  type: options.mimeType || 'application/octet-stream'
                })

          await Share.share({
            title: 'Download File',
            text: `Download ${options.fileName}`,
            url: URL.createObjectURL(blob)
          })

          return {
            success: true,
            uri: 'shared'
          }
        } catch (shareError) {
          console.warn('Share failed:', shareError)
          errors.push(shareError)
        }
      }

      try {
        const blob =
          options.data instanceof Blob
            ? options.data
            : new Blob([options.data], {
                type: options.mimeType || 'application/octet-stream'
              })

        if (window.navigator.msSaveOrOpenBlob) {
          window.navigator.msSaveOrOpenBlob(blob, options.fileName)
          return {
            success: true,
            uri: 'ms-blob'
          }
        }
      } catch (msError) {
        console.warn('MS Blob save failed:', msError)
        errors.push(msError)
      }

      throw new Error(
        `All download methods failed: ${errors.map(e => e.message).join(', ')}`
      )
    }
  }

  public static async download(options: DownloadOptions): Promise<DownloadResult> {
    try {
      options.onProgress?.(0)

      if (this.isNativePlatform()) {
        const result = await this.downloadNative(options)
        options.onProgress?.(100)
        options.onSuccess?.(result)
        return result
      } else {
        const result = await this.downloadWithFallback(options)
        options.onSuccess?.(result)
        return result
      }
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error))
      options.onError?.(errorObj)
      return {
        success: false,
        error: errorObj.message
      }
    }
  }

  public static async downloadJson(
    fileName: string,
    jsonData: any,
    options?: Partial<DownloadOptions>
  ): Promise<DownloadResult> {
    const jsonString = JSON.stringify(jsonData, null, 2)
    return this.download({
      fileName,
      mimeType: 'application/json',
      data: jsonString,
      ...options
    })
  }

  public static async downloadText(
    fileName: string,
    text: string,
    options?: Partial<DownloadOptions>
  ): Promise<DownloadResult> {
    return this.download({
      fileName,
      mimeType: 'text/plain',
      data: text,
      ...options
    })
  }

  public static async downloadBlob(
    fileName: string,
    blob: Blob,
    options?: Partial<DownloadOptions>
  ): Promise<DownloadResult> {
    return this.download({
      fileName,
      mimeType: blob.type,
      data: blob,
      ...options
    })
  }
}
