import { ImageHostingService } from './image-hosting-service';

export interface ImageUrlValidationResult {
  valid: boolean;
  url?: string;
  error?: string;
  isAccessible?: boolean;
  contentType?: string;
  size?: number;
}

export class ImageUrlValidator {
  private static readonly ALLOWED_PROTOCOLS = ['http:', 'https:'];
  private static readonly ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];
  private static readonly MAX_URL_LENGTH = 2000;

  private static validateUrlStatic(url: string): ImageUrlValidationResult {
    if (!url || typeof url !== 'string') {
      return {
        valid: false,
        error: 'URL不能为空'
      };
    }

    if (url.length > this.MAX_URL_LENGTH) {
      return {
        valid: false,
        error: `URL长度超过限制（最大${this.MAX_URL_LENGTH}字符）`
      };
    }

    try {
      const parsedUrl = new URL(url);

      if (!this.ALLOWED_PROTOCOLS.includes(parsedUrl.protocol)) {
        return {
          valid: false,
          error: `不支持的协议: ${parsedUrl.protocol}，只支持 http:// 和 https://`
        };
      }

      if (!parsedUrl.hostname) {
        return {
          valid: false,
          error: 'URL缺少主机名'
        };
      }

      const hasValidExtension = this.ALLOWED_EXTENSIONS.some(ext => 
        url.toLowerCase().endsWith(ext)
      );

      if (!hasValidExtension && !this.hasQueryParameter(url)) {
        return {
          valid: false,
          error: `URL必须以支持的图片扩展名结尾: ${this.ALLOWED_EXTENSIONS.join(', ')}`
        };
      }

      return {
        valid: true,
        url
      };

    } catch (error) {
      return {
        valid: false,
        error: `无效的URL格式: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }

  private static hasQueryParameter(url: string): boolean {
    return url.includes('?') || url.includes('&');
  }

  async validateUrl(url: string): Promise<boolean> {
    const result = await ImageUrlValidator.validateUrlAsync(url);
    return result.valid;
  }

  private static async validateUrlAsync(url: string): Promise<ImageUrlValidationResult> {
    return ImageUrlValidator.validateUrlStatic(url);
  }

  static validateUrl(url: string): ImageUrlValidationResult {
    return ImageUrlValidator.validateUrlStatic(url);
  }

  async checkUrlAccessibility(url: string): Promise<boolean> {
    const result = await ImageUrlValidator.checkAccessibility(url);
    return result.valid;
  }

  static async checkAccessibility(url: string): Promise<ImageUrlValidationResult> {
    const validationResult = ImageUrlValidator.validateUrlStatic(url);
    
    if (!validationResult.valid) {
      return validationResult;
    }

    try {
      const response = await fetch(url, {
        method: 'HEAD',
        mode: 'cors',
        cache: 'no-cache'
      });

      if (!response.ok) {
        return {
          valid: false,
          error: `无法访问图片URL: HTTP ${response.status} ${response.statusText}`
        };
      }

      const contentType = response.headers.get('content-type');
      const contentLength = response.headers.get('content-length');

      if (!contentType || !contentType.startsWith('image/')) {
        return {
          valid: false,
          error: `URL返回的不是图片: ${contentType || '未知类型'}`
        };
      }

      return {
        valid: true,
        url,
        isAccessible: true,
        contentType,
        size: contentLength ? parseInt(contentLength, 10) : undefined
      };

    } catch (error) {
      return {
        valid: false,
        error: `检查URL可访问性时出错: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }

  async validateAndCheck(url: string): Promise<ImageUrlValidationResult> {
    return await ImageUrlValidator.validateAndCheck(url);
  }

  static async validateAndCheck(url: string): Promise<ImageUrlValidationResult> {
    const validationResult = ImageUrlValidator.validateUrlStatic(url);
    
    if (!validationResult.valid) {
      return validationResult;
    }

    return await ImageUrlValidator.checkAccessibility(url);
  }

  async validateMultipleUrls(urls: string[]): Promise<Map<string, ImageUrlValidationResult>> {
    return await ImageUrlValidator.validateMultipleUrls(urls);
  }

  static async validateMultipleUrls(urls: string[]): Promise<Map<string, ImageUrlValidationResult>> {
    const results = new Map<string, ImageUrlValidationResult>();

    await Promise.all(
      urls.map(async (url) => {
        const result = await ImageUrlValidator.validateAndCheck(url);
        results.set(url, result);
      })
    );

    return results;
  }

  async isValidImageUrl(url: string): Promise<boolean> {
    return ImageUrlValidator.validateUrlStatic(url).valid;
  }

  static isValidImageUrl(url: string): boolean {
    return ImageUrlValidator.validateUrlStatic(url).valid;
  }

  extractImageUrls(data: any): string[] {
    return ImageUrlValidator.extractImageUrls(data);
  }

  static extractImageUrls(data: any): string[] {
    const urls: string[] = [];
    const visited = new Set<any>();

    const traverse = (obj: any) => {
      if (!obj || visited.has(obj)) {
        return;
      }

      visited.add(obj);

      if (typeof obj === 'string') {
        if (ImageUrlValidator.isValidImageUrl(obj)) {
          urls.push(obj);
        } else {
          const extractedUrls = ImageUrlValidator.parseUrlsFromText(obj);
          extractedUrls.forEach(url => {
            if (!urls.includes(url)) {
              urls.push(url);
            }
          });
        }
        return;
      }

      if (Array.isArray(obj)) {
        obj.forEach(item => traverse(item));
        return;
      }

      if (typeof obj === 'object') {
        Object.values(obj).forEach(value => traverse(value));
      }
    };

    traverse(data);
    return urls;
  }

  private static readonly URL_REGEX = /(https?:\/\/[^\s<>"{}|\\^`\[\]]+\.(?:jpg|jpeg|png|gif|webp|bmp|svg)(?:[^\s<>"{}|\\^`\[\]]*)?)/gi;

  static parseUrlsFromText(text: string): string[] {
    const urls: string[] = [];
    const matches = text.match(this.URL_REGEX);
    if (matches) {
      matches.forEach(url => {
        if (ImageUrlValidator.isValidImageUrl(url) && !urls.includes(url)) {
          urls.push(url);
        }
      });
    }
    return urls;
  }

  async validateGameDataImages(data: any): Promise<{
    valid: boolean;
    totalImages: number;
    validImages: number;
    invalidImages: number;
    results: Map<string, ImageUrlValidationResult>;
  }> {
    return await ImageUrlValidator.validateGameDataImages(data);
  }

  static async validateGameDataImages(data: any): Promise<{
    valid: boolean;
    totalImages: number;
    validImages: number;
    invalidImages: number;
    results: Map<string, ImageUrlValidationResult>;
  }> {
    const imageUrls = ImageUrlValidator.extractImageUrls(data);
    const results = await ImageUrlValidator.validateMultipleUrls(imageUrls);

    let validImages = 0;
    let invalidImages = 0;

    results.forEach((result) => {
      if (result.valid) {
        validImages++;
      } else {
        invalidImages++;
      }
    });

    return {
      valid: invalidImages === 0,
      totalImages: imageUrls.length,
      validImages,
      invalidImages,
      results
    };
  }
}

export default ImageUrlValidator;
