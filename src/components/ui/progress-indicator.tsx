'use client'

import React, { useEffect, useState } from 'react'
import { X, Check, AlertCircle } from 'lucide-react'

export interface ProgressIndicatorProps {
  progress: number
  status?: 'idle' | 'loading' | 'success' | 'error'
  message?: string
  showPercentage?: boolean
  showCancel?: boolean
  onCancel?: () => void
  className?: string
  currentFile?: string
  totalFiles?: number
  processedFiles?: number
}

export function ProgressIndicator({
  progress,
  status = 'loading',
  message,
  showPercentage = true,
  showCancel = true,
  onCancel,
  className = '',
  currentFile,
  totalFiles,
  processedFiles
}: ProgressIndicatorProps) {
  const [displayProgress, setDisplayProgress] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDisplayProgress(progress)
    }, 50)
    return () => clearTimeout(timer)
  }, [progress])

  const getStatusIcon = () => {
    switch (status) {
      case 'success':
        return <Check className="h-5 w-5 text-green-500" />
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />
      default:
        return null
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return 'bg-green-500'
      case 'error':
        return 'bg-red-500'
      default:
        return 'bg-blue-500'
    }
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {getStatusIcon()}
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {status === 'idle' && '准备中'}
              {status === 'loading' && '处理中'}
              {status === 'success' && '完成'}
              {status === 'error' && '错误'}
            </h3>
            {message && (
              <p className="text-sm text-gray-600 mt-1">{message}</p>
            )}
          </div>
        </div>
        {showCancel && status === 'loading' && onCancel && (
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="取消"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        )}
      </div>

      <div className="space-y-3">
        <div className="relative">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full ${getStatusColor()} transition-all duration-300 ease-out`}
              style={{ width: `${displayProgress}%` }}
            />
          </div>
        </div>
        {showPercentage && (
          <div className="flex justify-between mt-2">
            <span className="text-sm text-gray-600">
              {displayProgress.toFixed(1)}%
            </span>
            {totalFiles && processedFiles !== undefined && (
              <span className="text-sm text-gray-600">
                {processedFiles} / {totalFiles} 文件
              </span>
            )}
          </div>
        )}
      </div>

      {currentFile && (
        <div className="mt-3 p-3 bg-gray-50 rounded-md">
          <p className="text-sm text-gray-700 truncate">
            当前文件: {currentFile}
          </p>
        </div>
      )}

      {status === 'error' && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-700">
            操作失败，请重试或联系支持
          </p>
        </div>
      )}

      {status === 'success' && (
        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-700">
            操作成功完成！
          </p>
        </div>
      )}
    </div>
  )
}

export interface CompactProgressProps {
  progress: number
  message?: string
  className?: string
}

export function CompactProgress({
  progress,
  message,
  className = ''
}: CompactProgressProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="flex-1">
        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      {message && (
        <span className="text-sm text-gray-600 whitespace-nowrap">
          {message}
        </span>
      )}
    </div>
  )
}

export interface FileUploadProgressProps {
  fileName: string
  progress: number
  size?: number
  speed?: string
  onCancel?: () => void
}

export function FileUploadProgress({
  fileName,
  progress,
  size,
  speed,
  onCancel
}: FileUploadProgressProps) {
  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {fileName}
          </p>
          {size && (
            <p className="text-xs text-gray-500">
              {formatSize(size)}
            </p>
          )}
        </div>
        {onCancel && (
          <button
            onClick={onCancel}
            className="ml-2 p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <X className="h-4 w-4 text-gray-500" />
          </button>
        )}
      </div>

      <div className="space-y-2">
        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex justify-between text-xs text-gray-500">
          <span>{progress.toFixed(1)}%</span>
          {speed && <span>{speed}</span>}
        </div>
      </div>
    </div>
  )
}
