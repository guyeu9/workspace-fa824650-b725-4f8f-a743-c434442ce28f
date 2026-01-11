import { ImageHostingService } from '../src/lib/image-hosting-service';
import { ImageCacheManager } from '../src/lib/image-cache-manager';
import { ImageUrlValidator } from '../src/lib/image-url-validator';

describe('Image Hosting Integration Tests', () => {
  let imageHostingService: ImageHostingService;
  let imageCacheManager: ImageCacheManager;
  let imageUrlValidator: ImageUrlValidator;

  beforeEach(() => {
    imageCacheManager = new ImageCacheManager();
    imageHostingService = new ImageHostingService(imageCacheManager);
    imageUrlValidator = new ImageUrlValidator();
  });

  afterEach(async () => {
    await imageCacheManager.clearCache();
  });

  describe('完整上传流程测试', () => {
    it('应该成功上传图片到ImgBB并返回URL', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      
      const result = await imageHostingService.uploadImage(mockFile);
      
      expect(result.success).toBe(true);
      expect(result.url).toBeDefined();
      expect(typeof result.url).toBe('string');
      expect(result.url).toMatch(/^https?:\/\//);
    });

    it('应该在上传时显示进度', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const progressUpdates: number[] = [];
      
      const result = await imageHostingService.uploadImage(mockFile, (progress) => {
        progressUpdates.push(progress.percentage);
      });
      
      expect(progressUpdates.length).toBeGreaterThan(0);
      expect(progressUpdates[progressUpdates.length - 1]).toBe(100);
      expect(result.success).toBe(true);
    });

    it('应该拒绝非图片文件', async () => {
      const mockFile = new File(['test'], 'test.txt', { type: 'text/plain' });
      
      const result = await imageHostingService.uploadImage(mockFile);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('无效的图片文件');
    });

    it('应该拒绝过大的文件', async () => {
      const largeContent = new Array(11 * 1024 * 1024).fill('a').join('');
      const mockFile = new File([largeContent], 'large.jpg', { type: 'image/jpeg' });
      
      const result = await imageHostingService.uploadImage(mockFile);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('文件过大');
    });
  });

  describe('缓存机制测试', () => {
    it('应该使用缓存的图片URL', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      
      const firstResult = await imageHostingService.uploadImage(mockFile);
      expect(firstResult.success).toBe(true);
      expect(firstResult.cached).toBe(false);
      
      const secondResult = await imageHostingService.uploadImage(mockFile);
      expect(secondResult.success).toBe(true);
      expect(secondResult.cached).toBe(true);
      expect(secondResult.url).toBe(firstResult.url);
    });

    it('应该在缓存过期后重新上传', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      
      const firstResult = await imageHostingService.uploadImage(mockFile);
      expect(firstResult.success).toBe(true);
      
      await imageCacheManager.clearCache();
      
      const secondResult = await imageHostingService.uploadImage(mockFile);
      expect(secondResult.success).toBe(true);
      expect(secondResult.cached).toBe(false);
    });
  });

  describe('URL验证测试', () => {
    it('应该验证有效的图片URL', async () => {
      const validUrls = [
        'https://i.imgur.com/test.jpg',
        'https://example.com/image.png',
        'https://cdn.example.com/photos/image.webp'
      ];
      
      for (const url of validUrls) {
        const isValid = await imageUrlValidator.validateUrl(url);
        expect(isValid).toBe(true);
      }
    });

    it('应该拒绝无效的图片URL', async () => {
      const invalidUrls = [
        'not-a-url',
        'ftp://example.com/image.jpg',
        'javascript:alert(1)',
        'data:image/png;base64,abc'
      ];
      
      for (const url of invalidUrls) {
        const isValid = await imageUrlValidator.validateUrl(url);
        expect(isValid).toBe(false);
      }
    });

    it('应该从文本中提取图片URL', () => {
      const text = '这是一张图片: https://example.com/image.jpg 和另一张: https://i.imgur.com/test.png';
      const urls = imageUrlValidator.extractImageUrls(text);
      
      expect(urls).toHaveLength(2);
      expect(urls).toContain('https://example.com/image.jpg');
      expect(urls).toContain('https://i.imgur.com/test.png');
    });

    it('应该检查URL的可访问性', async () => {
      const accessibleUrl = 'https://i.imgur.com/test.jpg';
      const isAccessible = await imageUrlValidator.checkUrlAccessibility(accessibleUrl);
      
      expect(typeof isAccessible).toBe('boolean');
    });
  });

  describe('错误处理测试', () => {
    it('应该处理网络错误', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      
      jest.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('Network error'));
      
      const result = await imageHostingService.uploadImage(mockFile);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('应该处理服务器错误', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      
      jest.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Internal server error' })
      } as Response);
      
      const result = await imageHostingService.uploadImage(mockFile);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('应该处理超时', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      
      jest.spyOn(global, 'fetch').mockImplementationOnce(() => 
        new Promise((resolve) => setTimeout(() => resolve({} as Response), 30000))
      );
      
      const result = await imageHostingService.uploadImage(mockFile, undefined, 1000);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('timeout');
    });
  });

  describe('降级机制测试', () => {
    it('应该在ImgBB失败时降级到本地存储', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      
      jest.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('ImgBB error'));
      
      const result = await imageHostingService.uploadImage(mockFile);
      
      expect(result.success).toBe(true);
      expect(result.url).toBeDefined();
    });
  });

  describe('性能测试', () => {
    it('应该在合理时间内完成上传', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      
      const startTime = Date.now();
      const result = await imageHostingService.uploadImage(mockFile);
      const endTime = Date.now();
      
      expect(result.success).toBe(true);
      expect(endTime - startTime).toBeLessThan(30000);
    });

    it('应该处理并发上传', async () => {
      const files = Array(5).fill(null).map((_, i) => 
        new File([`test${i}`], `test${i}.jpg`, { type: 'image/jpeg' })
      );
      
      const results = await Promise.all(
        files.map(file => imageHostingService.uploadImage(file))
      );
      
      expect(results.every(r => r.success)).toBe(true);
    });
  });
});
