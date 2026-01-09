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
import { gameStore } from '@/lib/game-store';

interface FileUploadProps {
  gameId: string;
  currentImageUrl?: string;
  onImageUploaded?: (assetId: string, imageUrl: string) => void;
  onImageRemoved?: () => void;
  maxSize?: number; // 最大文件大小 (MB)
  acceptedTypes?: string[];
  label?: string;
  description?: string;
}

export function FileUpload({
  gameId,
  currentImageUrl,
  onImageUploaded,
  onImageRemoved,
  maxSize = 10,
  acceptedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  label = '背景图片',
  description = '上传游戏背景图片，支持 JPG、PNG、WebP、GIF 格式'
}: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string>('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 处理文件选择
  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 重置状态
    setError('');
    setUploadProgress(0);

    // 验证文件类型
    if (!acceptedTypes.includes(file.type)) {
      setError(`不支持的文件类型。支持的格式: ${acceptedTypes.map(t => t.split('/')[1].toUpperCase()).join(', ')}`);
      return;
    }

    // 验证文件大小
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSize) {
      setError(`文件大小超过限制。最大支持 ${maxSize}MB`);
      return;
    }

    setIsUploading(true);

    try {
      // 模拟上传进度
      setUploadProgress(10);
      
      // 创建预览URL
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
      setUploadProgress(50);

      // 存储到IndexedDB
      const assetId = await gameStore.storeAsset(file, file.name, 'image');
      setUploadProgress(80);

      // 通知父组件
      if (onImageUploaded) {
        onImageUploaded(assetId, objectUrl);
      }
      
      setUploadProgress(100);
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

  // 处理文件移除
  const handleRemoveFile = useCallback(async () => {
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    
    setPreviewUrl(null);
    setError('');
    
    if (onImageRemoved) {
      onImageRemoved();
    }

    // 清空文件输入
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [previewUrl, onImageRemoved]);

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
      const event = {
        target: { files: [file] }
      } as React.ChangeEvent<HTMLInputElement>;
      handleFileSelect(event);
    }
  }, [handleFileSelect]);

  // 触发文件选择
  const triggerFileSelect = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
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
                <img
                  src={previewUrl}
                  alt="预览"
                  className="w-full h-full object-cover"
                />
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
                    variant="outline"
                    onClick={triggerFileSelect}
                    disabled={isUploading}
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