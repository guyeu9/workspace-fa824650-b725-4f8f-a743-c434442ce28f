'use client';

import React, { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  Image, 
  Trash2, 
  Download,
  AlertCircle,
  CheckCircle,
  FileImage,
  RefreshCw
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ImageHostingService } from '@/lib/image-hosting-service';

interface FileUploadProps {
  gameId: string;
  currentImageUrl?: string;
  onImageUploaded?: (assetId: string, imageUrl: string) => void;
  onImageRemoved?: () => void;
  onUrlChange?: (url: string) => void;
  showUrlInput?: boolean;
  maxSize?: number;
  acceptedTypes?: string[];
  label?: string;
  description?: string;
}

export function FileUpload({
  gameId,
  currentImageUrl,
  onImageUploaded,
  onImageRemoved,
  onUrlChange,
  showUrlInput = false,
  maxSize = 10,
  acceptedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  label = '背景图片',
  description = '上传游戏背景图片，支持 JPG、PNG、WebP、GIF 格式'
}: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string>('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
  const [manualUrl, setManualUrl] = useState<string>(currentImageUrl || '');
  const [imageLoadError, setImageLoadError] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSelectedFile = useCallback(async (file: File) => {
    setError('');
    setUploadProgress(0);

    if (!acceptedTypes.includes(file.type)) {
      setError(`不支持的文件类型。支持的格式: ${acceptedTypes.map(t => t.split('/')[1].toUpperCase()).join(', ')}`);
      return;
    }

    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSize) {
      setError(`文件大小超过限制。最大支持 ${maxSize}MB`);
      return;
    }

    setIsUploading(true);

    try {
      const imageHostingService = new ImageHostingService(undefined, {
        provider: 'chevereto',
        endpoint: 'https://www.picgo.net/api/1/upload',
        apiKey: 'chv_SB3xd_77c449af9e93a0bd1db20a74b4ce825cbe1688cb747b34dd6ce2d5fa0164b1e9_2397459290fc8b2bc736ff2cd13a58bf93d4e31896b04fa5c461af8eb3b34b43'
      });
      const result = await imageHostingService.uploadImage(file, (progress) => {
        setUploadProgress(progress.percentage);
      });
      
      if (!result.success || !result.url) {
        throw new Error(result.error || '上传失败');
      }

      if (onImageUploaded) {
        onImageUploaded(result.url, result.url);
      }
      
      setPreviewUrl(result.url);
      setManualUrl(result.url);
      setImageLoadError(false);
      setError('');
      
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 500);

    } catch (error) {
      console.error('上传失败:', error);
      setError('上传失败，请重试');
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [acceptedTypes, maxSize, onImageUploaded]);

  // 处理URL输入变化
  const handleUrlChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setManualUrl(newUrl);
    setImageLoadError(false);
    
    if (newUrl.trim()) {
      setPreviewUrl(newUrl.trim());
      if (onUrlChange) {
        onUrlChange(newUrl.trim());
      }
    } else {
      setPreviewUrl(null);
      if (onUrlChange) {
        onUrlChange('');
      }
    }
  }, [onUrlChange]);

  // 处理图片加载错误
  const handleImageError = useCallback(() => {
    setImageLoadError(true);
    setError('图片加载失败，请检查链接是否正确');
  }, []);

  // 处理图片加载成功
  const handleImageLoad = useCallback(() => {
    setImageLoadError(false);
    setError('');
  }, []);

  // 处理文件选择
  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    await handleSelectedFile(file);
  }, [handleSelectedFile]);

  // 处理文件移除
  const handleRemoveFile = useCallback(async () => {
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    
    setPreviewUrl(null);
    setManualUrl('');
    setError('');
    
    if (onImageRemoved) {
      onImageRemoved();
    }
    
    if (onUrlChange) {
      onUrlChange('');
    }

    // 清空文件输入
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [previewUrl, onImageRemoved, onUrlChange]);

  // 处理拖拽
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      handleSelectedFile(file);
    }
  }, [handleSelectedFile]);

  // 触发文件选择
  const triggerFileSelect = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <Image className="h-5 w-5" />
          {label}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {/* 预览区域 */}
          {previewUrl && (
            <div className="relative">
              <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden border-2 border-dashed border-gray-300">
                {imageLoadError ? (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-500">
                    <AlertCircle className="h-12 w-12 mb-2 text-red-500" />
                    <p className="text-sm">图片加载失败</p>
                  </div>
                ) : (
                  <img
                    src={previewUrl}
                    alt="预览"
                    className="w-full h-full object-cover"
                    onError={handleImageError}
                    onLoad={handleImageLoad}
                  />
                )}
              </div>
              
              <div className="absolute top-2 right-2 flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={triggerFileSelect}
                  disabled={isUploading}
                >
                  <RefreshCw className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleRemoveFile}
                  disabled={isUploading}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}

          {/* 上传区域 */}
          {!previewUrl && (
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                error 
                  ? 'border-red-300 bg-red-50' 
                  : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
              }`}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <div className="flex flex-col items-center gap-4">
                <div className="p-3 bg-gray-100 rounded-full">
                  {error ? (
                    <AlertCircle className="h-6 w-6 text-red-500" />
                  ) : (
                    <FileImage className="h-6 w-6 text-gray-400" />
                  )}
                </div>
                
                <div className="text-center">
                  <h4 className="text-sm font-medium text-gray-900 mb-1">
                    {error ? '上传失败' : '上传文件'}
                  </h4>
                  <p className="text-sm text-gray-500 mb-3">
                    {error || '拖拽文件到此处，或点击选择文件'}
                  </p>
                  
                  <Button
                    size="sm"
                    variant="default"
                    onClick={triggerFileSelect}
                    disabled={isUploading}
                    className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white transition-all duration-300"
                  >
                    选择文件
                  </Button>
                </div>

                <div className="text-xs text-gray-400">
                  支持 {acceptedTypes.map(t => t.split('/')[1].toUpperCase()).join(', ')} 格式，最大 {maxSize}MB
                </div>
              </div>
            </div>
          )}

          {/* 进度条 */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>上传中...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}

          {/* 状态指示器 */}
          {previewUrl && !isUploading && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span>文件上传成功</span>
            </div>
          )}

          {/* URL输入框 */}
          {showUrlInput && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-700">图片链接</label>
                {previewUrl && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      navigator.clipboard.writeText(manualUrl);
                    }}
                    className="h-6 px-2 text-xs"
                  >
                    复制链接
                  </Button>
                )}
              </div>
              <Input
                value={manualUrl}
                onChange={handleUrlChange}
                placeholder="输入图片URL或上传文件"
                className="bg-white border-blue-300 focus:border-blue-500 focus:ring-blue-500/20 text-slate-800 placeholder:text-slate-400"
              />
              {imageLoadError && error && (
                <div className="flex items-center gap-2 text-sm text-red-600 mt-2">
                  <AlertCircle className="h-4 w-4" />
                  <span>{error}</span>
                </div>
              )}
            </div>
          )}

          {/* 隐藏的文件输入 */}
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptedTypes.join(',')}
            onChange={handleFileSelect}
            className="hidden"
            disabled={isUploading}
          />
        </div>
      </CardContent>
    </Card>
  );
}
