export interface FileSizeConfig {
  maxSize: number
  maxSizeFormatted: string
  description: string
}

export interface FileTypeConfig {
  maxSize: number
  accept: string
  description: string
}

export const FILE_SIZE_LIMITS = {
  TINY: 1 * 1024 * 1024,
  SMALL: 5 * 1024 * 1024,
  MEDIUM: 10 * 1024 * 1024,
  LARGE: 50 * 1024 * 1024,
  HUGE: 100 * 1024 * 1024,
  MASSIVE: 500 * 1024 * 1024
} as const

export const FILE_TYPE_CONFIGS: Record<string, FileTypeConfig> = {
  json: {
    maxSize: FILE_SIZE_LIMITS.MEDIUM,
    accept: 'application/json,.json',
    description: 'JSON文件'
  },
  image: {
    maxSize: FILE_SIZE_LIMITS.MEDIUM,
    accept: 'image/*',
    description: '图片文件'
  },
  zip: {
    maxSize: FILE_SIZE_LIMITS.HUGE,
    accept: 'application/zip,.zip,application/x-zip-compressed',
    description: 'ZIP压缩包'
  },
  backup: {
    maxSize: FILE_SIZE_LIMITS.LARGE,
    accept: 'application/json,.json',
    description: '备份文件'
  },
  audio: {
    maxSize: FILE_SIZE_LIMITS.MEDIUM,
    accept: 'audio/*',
    description: '音频文件'
  },
  video: {
    maxSize: FILE_SIZE_LIMITS.HUGE,
    accept: 'video/*',
    description: '视频文件'
  },
  any: {
    maxSize: FILE_SIZE_LIMITS.HUGE,
    accept: '*/*',
    description: '任意文件'
  }
} as const

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

export function validateFileSize(
  fileSize: number,
  maxSize: number
): { valid: boolean; error?: string } {
  if (fileSize > maxSize) {
    return {
      valid: false,
      error: `文件大小超过限制 (${formatFileSize(maxSize)})`
    }
  }
  return { valid: true }
}

export function validateFileType(
  fileName: string,
  mimeType: string,
  accept: string
): { valid: boolean; error?: string } {
  const acceptedTypes = accept.split(',').map(type => type.trim())

  const isAccepted = acceptedTypes.some(type => {
    if (type.startsWith('.')) {
      return fileName.toLowerCase().endsWith(type.toLowerCase())
    }
    if (type === '*/*') return true
    return mimeType.match(type.replace('*', '.*'))
  })

  if (!isAccepted) {
    return {
      valid: false,
      error: `不支持的文件类型: ${mimeType}`
    }
  }

  return { valid: true }
}

export function getFileConfig(type: keyof typeof FILE_TYPE_CONFIGS): FileTypeConfig {
  return FILE_TYPE_CONFIGS[type]
}

export function getMaxFileSize(type: keyof typeof FILE_TYPE_LIMITS): number {
  return FILE_SIZE_LIMITS[type]
}
