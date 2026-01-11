import { ImageCacheManager } from './image-cache-manager';

export type HostingProvider = 'aliyun-oss' | 'tencent-cos' | 'qiniu' | 'cloudflare' | 'custom' | 'imgbb';

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface UploadResult {
  success: boolean;
  url?: string;
  thumbnailUrls?: string[];
  error?: string;
  cached?: boolean;
  optimization?: {
    originalSize: number;
    optimizedSize: number;
    compressionRatio: number;
    format: string;
  };
}

export interface HostingConfig {
  provider: HostingProvider;
  endpoint?: string;
  bucket?: string;
  region?: string;
  accessKeyId?: string;
  accessKeySecret?: string;
  cdnDomain?: string;
  pathPrefix?: string;
  apiKey?: string;
}

export class ImageHostingService {
  private cacheManager: ImageCacheManager;
  private config: HostingConfig;
  private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024;
  private static readonly DEFAULT_TIMEOUT = 30000;

  constructor(cacheManager?: ImageCacheManager, config?: Partial<HostingConfig>) {
    this.cacheManager = cacheManager || new ImageCacheManager();
    this.config = {
      provider: 'custom',
      ...config
    };
  }

  async uploadImage(
    file: File,
    onProgress?: (progress: UploadProgress) => void,
    useImgBB: boolean = true,
    timeout?: number
  ): Promise<UploadResult> {
    try {
      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/bmp', 'image/tiff'];
      if (!validTypes.includes(file.type)) {
        return {
          success: false,
          error: '无效的图片文件'
        };
      }

      if (file.size > ImageHostingService.MAX_FILE_SIZE) {
        return {
          success: false,
          error: `文件过大，请上传小于${Math.round(ImageHostingService.MAX_FILE_SIZE / (1024 * 1024))}MB的图片`
        };
      }

      onProgress?.({ loaded: 0, total: 100, percentage: 10 });

      const fileHash = await this.calculateHash(file);

      onProgress?.({ loaded: 20, total: 100, percentage: 20 });

      const cachedUrl = await this.cacheManager.checkCache(fileHash);
      if (cachedUrl) {
        onProgress?.({ loaded: 100, total: 100, percentage: 100 });
        return {
          success: true,
          url: cachedUrl,
          cached: true
        };
      }

      onProgress?.({ loaded: 30, total: 100, percentage: 30 });

      const formData = new FormData();
      formData.append('file', file);
      formData.append('key', fileHash);
      formData.append('useImgBB', useImgBB.toString());

      const uploadPromise = fetch('/api/images/upload', {
        method: 'POST',
        body: formData
      });

      const progressInterval = setInterval(() => {
        const currentProgress = onProgress?.({ 
          loaded: 50, 
          total: 100, 
          percentage: Math.min(95, 30 + Math.random() * 50) 
        });
      }, 100);

      onProgress?.({ loaded: 50, total: 100, percentage: 50 });

      const timeoutMs = timeout ?? ImageHostingService.DEFAULT_TIMEOUT;
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('timeout')), timeoutMs);
      });

      let response: Response;
      try {
        response = await Promise.race([uploadPromise, timeoutPromise]) as Response;
      } catch (fetchError) {
        clearInterval(progressInterval);
        
        if (fetchError instanceof Error && fetchError.message === 'timeout') {
          return {
            success: false,
            error: 'timeout'
          };
        }
        
        const errorMessage = fetchError instanceof Error ? fetchError.message : '';
        if (errorMessage.toLowerCase().includes('imgbb')) {
          const fallbackUrl = await this.uploadToLocalFallback(file);
          if (fallbackUrl) {
            await this.cacheManager.saveToCache(fileHash, fallbackUrl, file.size);
            onProgress?.({ loaded: 100, total: 100, percentage: 100 });
            return {
              success: true,
              url: fallbackUrl,
              cached: false
            };
          }
        }
        
        return {
          success: false,
          error: errorMessage || '上传失败'
        };
      }
      
      clearInterval(progressInterval);
      onProgress?.({ loaded: 100, total: 100, percentage: 100 });

      if (!response.ok) {
        return {
          success: false,
          error: `上传失败: ${response.status}`
        };
      }

      const responseData = await response.json();
      
      if (responseData.success && responseData.url) {
        await this.cacheManager.saveToCache(fileHash, responseData.url, file.size);
        
        onProgress?.({ loaded: 100, total: 100, percentage: 100 });
        
        return {
          success: true,
          url: responseData.url,
          thumbnailUrls: responseData.thumbnailUrl ? [responseData.thumbnailUrl] : undefined,
          cached: false,
          optimization: {
            originalSize: responseData.originalSize || file.size,
            optimizedSize: responseData.size || file.size,
            compressionRatio: responseData.compressionRatio || 0,
            format: responseData.format || 'webp'
          }
        };
      } else {
        return {
          success: false,
          error: responseData.error || '上传失败'
        };
      }
    } catch (error) {
      console.error('图片上传失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '上传失败'
      };
    }
  }

  async batchUploadImages(
    files: File[],
    onProgress?: (progress: { current: number; total: number; percentage: number }) => void
  ): Promise<UploadResult[]> {
    const results: UploadResult[] = [];
    const total = files.length;

    for (let i = 0; i < files.length; i++) {
      const result = await this.uploadImage(files[i], (uploadProgress) => {
        const overallPercentage = ((i * 100) + uploadProgress.percentage) / total;
        onProgress?.({
          current: i + 1,
          total,
          percentage: overallPercentage
        });
      });

      results.push(result);
    }

    return results;
  }

  private async calculateHash(file: File): Promise<string> {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  }

  private async uploadToLocalFallback(file: File): Promise<string | null> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('useImgBB', 'false');

      const response = await fetch('/api/images/upload', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        if (data.url) {
          return data.url;
        }
      }
      return null;
    } catch {
      return null;
    }
  }

  async getCacheStats() {
    return this.cacheManager.getCacheStats();
  }

  async clearCache() {
    return this.cacheManager.clearCache();
  }

  updateConfig(config: Partial<HostingConfig>) {
    this.config = { ...this.config, ...config };
  }
}
