import { Capacitor } from '@capacitor/core'
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem'

export interface UploadOptions {
  accept?: string
  maxSize?: number
  onProgress?: (progress: number) => void
  onError?: (error: Error) => void
  onSuccess?: (result: UploadResult) => void
  validateFile?: (file: File) => boolean
}

export interface UploadResult {
  success: boolean
  file?: File
  data?: string | ArrayBuffer
  error?: string
}

export class PlatformFileUploader {
  private static isNativePlatform(): boolean {
    return Capacitor.isNativePlatform()
  }

  private static validateFile(
    file: File,
    maxSize: number,
    accept?: string
  ): { valid: boolean; error?: string } {
    if (maxSize && file.size > maxSize) {
      return {
        valid: false,
        error: `文件大小超过限制 (${this.formatFileSize(maxSize)})`
      }
    }

    if (accept) {
      const acceptedTypes = accept.split(',').map(type => type.trim())
      const isAccepted = acceptedTypes.some(type => {
        if (type.startsWith('.')) {
          return file.name.toLowerCase().endsWith(type.toLowerCase())
        }
        if (type === '*/*') return true
        return file.type.match(type.replace('*', '.*'))
      })

      if (!isAccepted) {
        return {
          valid: false,
          error: `不支持的文件类型: ${file.type}`
        }
      }
    }

    return { valid: true }
  }

  private static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  private static readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => reject(new Error('读取文件失败'))
      reader.readAsText(file)
    })
  }

  private static readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as ArrayBuffer)
      reader.onerror = () => reject(new Error('读取文件失败'))
      reader.readAsArrayBuffer(file)
    })
  }

  private static readFileAsDataURL(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => reject(new Error('读取文件失败'))
      reader.readAsDataURL(file)
    })
  }

  public static async upload(
    options: UploadOptions
  ): Promise<UploadResult> {
    try {
      options.onProgress?.(0)

      if (this.isNativePlatform()) {
        return await this.uploadNative(options)
      } else {
        return await this.uploadWeb(options)
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

  private static async uploadWeb(
    options: UploadOptions
  ): Promise<UploadResult> {
    return new Promise((resolve) => {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = options.accept || '*/*'
      input.style.display = 'none'

      input.addEventListener('change', async (event) => {
        const target = event.target as HTMLInputElement
        const file = target.files?.[0]

        if (!file) {
          resolve({
            success: false,
            error: '未选择文件'
          })
          return
        }

        try {
          options.onProgress?.(25)

          const maxSize = options.maxSize || 50 * 1024 * 1024
          const validation = this.validateFile(file, maxSize, options.accept)

          if (!validation.valid) {
            resolve({
              success: false,
              error: validation.error
            })
            return
          }

          options.onProgress?.(50)

          if (options.validateFile && !options.validateFile(file)) {
            resolve({
              success: false,
              error: '文件验证失败'
            })
            return
          }

          options.onProgress?.(75)

          let data: string | ArrayBuffer

          if (file.type.startsWith('text/') || file.name.endsWith('.json')) {
            data = await this.readFileAsText(file)
          } else if (file.type.startsWith('image/')) {
            data = await this.readFileAsDataURL(file)
          } else {
            data = await this.readFileAsArrayBuffer(file)
          }

          options.onProgress?.(100)

          const result: UploadResult = {
            success: true,
            file,
            data
          }

          options.onSuccess?.(result)
          resolve(result)
        } catch (error) {
          const errorObj = error instanceof Error ? error : new Error(String(error))
          options.onError?.(errorObj)
          resolve({
            success: false,
            error: errorObj.message
          })
        }
      })

      document.body.appendChild(input)
      input.click()
      document.body.removeChild(input)
    })
  }

  private static async uploadNative(
    options: UploadOptions
  ): Promise<UploadResult> {
    try {
      // 原生端暂时使用Web端实现
      return await this.uploadWeb(options)
    } catch (error) {
      console.error('Native file picker failed:', error)
      return await this.uploadWeb(options)
    }
  }

  public static async uploadJson(
    options?: Partial<UploadOptions>
  ): Promise<UploadResult> {
    return this.upload({
      accept: 'application/json,.json',
      maxSize: 10 * 1024 * 1024,
      ...options
    })
  }

  public static async uploadImage(
    options?: Partial<UploadOptions>
  ): Promise<UploadResult> {
    return this.upload({
      accept: 'image/*',
      maxSize: 10 * 1024 * 1024,
      ...options
    })
  }

  public static async uploadZip(
    options?: Partial<UploadOptions>
  ): Promise<UploadResult> {
    return this.upload({
      accept: 'application/zip,.zip,application/x-zip-compressed',
      maxSize: 100 * 1024 * 1024,
      ...options
    })
  }

  public static async uploadAny(
    options?: Partial<UploadOptions>
  ): Promise<UploadResult> {
    return this.upload({
      accept: '*/*',
      maxSize: 100 * 1024 * 1024,
      ...options
    })
  }
}
