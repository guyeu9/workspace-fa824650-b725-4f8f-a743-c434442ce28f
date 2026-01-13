import { ImageCacheManager } from './image-cache-manager';

export type HostingProvider = 'aliyun-oss' | 'tencent-cos' | 'qiniu' | 'cloudflare' | 'custom' | 'imgbb' | 'chevereto';

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
    useImgBB: boolean = false,
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

      let uploadResult: UploadResult;

      if (this.config.provider === 'chevereto') {
        uploadResult = await this.uploadToChevereto(file, onProgress);
      } else {
        uploadResult = await this.uploadToLocal(file, onProgress, useImgBB);
      }

      if (uploadResult.success && uploadResult.url) {
        await this.cacheManager.saveToCache(fileHash, uploadResult.url, file.size);
      }

      return uploadResult;
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

  private async uploadToChevereto(
    file: File,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResult> {
    try {
      const formData = new FormData();
      formData.append('source', file);
      formData.append('format', 'json');

      const endpoint = this.config.endpoint || 'https://www.picgo.net/api/1/upload';
      const apiKey = this.config.apiKey || 'chv_SB3xd_77c449af9e93a0bd1db20a74b4ce825cbe1688cb747b34dd6ce2d5fa0164b1e9_2397459290fc8b2bc736ff2cd13a58bf93d4e31896b04fa5c461af8eb3b34b43';

      const xhr = new XMLHttpRequest();
      
      return new Promise<UploadResult>((resolve, reject) => {
        xhr.open('POST', endpoint, true);
        xhr.setRequestHeader('X-API-Key', apiKey);
        
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable && onProgress) {
            const percentage = Math.round((event.loaded / event.total) * 100);
            onProgress({
              loaded: event.loaded,
              total: event.total,
              percentage
            });
          }
        };

        xhr.onload = () => {
          if (xhr.status === 200) {
            try {
              const response = JSON.parse(xhr.responseText);
              
              if (response.status_code === 200 && response.image && response.image.url) {
                resolve({
                  success: true,
                  url: response.image.url,
                  thumbnailUrls: response.image.medium ? [response.image.medium.url] : undefined
                });
              } else {
                resolve({
                  success: false,
                  error: response.error?.message || '上传失败'
                });
              }
            } catch (parseError) {
              resolve({
                success: false,
                error: '响应解析失败'
              });
            }
          } else {
            resolve({
              success: false,
              error: `上传失败: ${xhr.status}`
            });
          }
        };

        xhr.onerror = () => {
          resolve({
            success: false,
            error: '网络错误'
          });
        };

        xhr.ontimeout = () => {
          resolve({
            success: false,
            error: '上传超时'
          });
        };

        xhr.timeout = ImageHostingService.DEFAULT_TIMEOUT;
        xhr.send(formData);
      });
    } catch (error) {
      console.error('Chevereto上传失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '上传失败'
      };
    }
  }

  private async uploadToLocal(
    file: File,
    onProgress?: (progress: UploadProgress) => void,
    useImgBB: boolean = false
  ): Promise<UploadResult> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('key', await this.calculateHash(file));
      formData.append('useImgBB', useImgBB.toString());

      const xhr = new XMLHttpRequest();
      
      return new Promise<UploadResult>((resolve, reject) => {
        xhr.open('POST', '/api/images/upload', true);
        
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable && onProgress) {
            const percentage = Math.round((event.loaded / event.total) * 100);
            onProgress({
              loaded: event.loaded,
              total: event.total,
              percentage
            });
          }
        };

        xhr.onload = () => {
          if (xhr.status === 200) {
            try {
              const response = JSON.parse(xhr.responseText);
              
              if (response.success && response.url) {
                resolve({
                  success: true,
                  url: response.url,
                  thumbnailUrls: response.thumbnailUrl ? [response.thumbnailUrl] : undefined
                });
              } else {
                resolve({
                  success: false,
                  error: response.error || '上传失败'
                });
              }
            } catch (parseError) {
              resolve({
                success: false,
                error: '响应解析失败'
              });
            }
          } else {
            resolve({
              success: false,
              error: `上传失败: ${xhr.status}`
            });
          }
        };

        xhr.onerror = () => {
          resolve({
            success: false,
            error: '网络错误'
          });
        };

        xhr.ontimeout = () => {
          resolve({
            success: false,
            error: '上传超时'
          });
        };

        xhr.timeout = ImageHostingService.DEFAULT_TIMEOUT;
        xhr.send(formData);
      });
    } catch (error) {
      console.error('本地上传失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '上传失败'
      };
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
