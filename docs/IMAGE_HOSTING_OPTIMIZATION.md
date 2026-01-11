# 图床优化功能技术设计文档

## 1. 功能概述

### 1.1 背景
原系统在图片存储方面存在以下问题：
- 图片以Blob形式存储在IndexedDB中，占用大量内存
- 游戏发布时需要传输完整的图片数据，导致性能问题
- 缺乏图片优化和压缩机制
- 缺乏图片缓存机制，重复上传相同图片

### 1.2 目标
- 实现图片上传到图床服务
- 图片自动优化和压缩
- 图片缓存机制避免重复上传
- 游戏发布时只保留图床链接
- 导入时从图床加载图片

## 2. 架构设计

### 2.1 系统架构

```
┌─────────────────────────────────────────────────────────┐
│                     前端应用                             │
├─────────────────────────────────────────────────────────┤
│  FileUpload组件 → ImageHostingService → ImageCacheManager │
│         ↓                    ↓                      ↓    │
│  用户上传图片          图片上传逻辑           缓存管理     │
└─────────────────────────────────────────────────────────┘
         ↓                    ↓                      ↓
┌─────────────────────────────────────────────────────────┐
│                    后端API                               │
├─────────────────────────────────────────────────────────┤
│  /api/images/upload → ImageOptimizer → ImgBB API       │
│         ↓                    ↓                      ↓    │
│  接收上传请求          图片优化处理           上传到图床   │
└─────────────────────────────────────────────────────────┘
                              ↓
                    ┌─────────────────┐
                    │   ImgBB 图床    │
                    │  (CDN加速存储)   │
                    └─────────────────┘
```

### 2.2 核心组件

#### 2.2.1 ImageOptimizer (服务器端)
- 位置：`src/lib/image-optimizer.ts`
- 功能：图片优化和压缩
- 技术栈：Sharp库
- 主要方法：
  - `optimize()`: 优化图片（压缩、格式转换）
  - `generateThumbnails()`: 生成缩略图
  - `compressToTargetSize()`: 压缩到目标大小

#### 2.2.2 ImageCacheManager (客户端)
- 位置：`src/lib/image-cache-manager.ts`
- 功能：图片缓存管理
- 技术栈：Dexie.js + IndexedDB
- 主要方法：
  - `checkCache()`: 检查缓存
  - `saveToCache()`: 保存到缓存
  - `cleanupCache()`: 清理过期缓存

#### 2.2.3 ImageHostingService (客户端)
- 位置：`src/lib/image-hosting-service.ts`
- 功能：图床上传服务管理
- 主要方法：
  - `uploadImage()`: 上传图片到图床
  - `batchUploadImages()`: 批量上传
  - `calculateHash()`: 计算文件哈希

#### 2.2.4 图片上传API (服务器端)
- 位置：`src/app/api/images/upload/route.ts`
- 功能：处理图片上传请求
- 流程：
  1. 验证文件类型和大小
  2. 检查请求频率限制
  3. 使用ImageOptimizer优化图片
  4. 上传到ImgBB图床
  5. 失败时降级到本地存储
  6. 返回图片URL和缩略图URL

#### 2.2.5 ImgBB 图床集成
- 位置：`src/app/api/images/upload/route.ts`
- 功能：ImgBB API 调用
- API端点：`https://api.imgbb.com/1/upload`
- 主要方法：
  - `uploadToImgBB()`: 上传图片到ImgBB
  - `checkRateLimit()`: 检查请求频率限制
  - `getClientIdentifier()`: 获取客户端标识
- 特性：
  - 自动CDN加速
  - 免费API密钥
  - 支持Base64上传
  - 自动生成缩略图

#### 2.2.6 ImageUrlValidator (客户端)
- 位置：`src/lib/image-url-validator.ts`
- 功能：图片URL验证和可访问性检查
- 主要方法：
  - `validateUrl()`: 验证URL格式和协议
  - `checkAccessibility()`: 检查URL可访问性
  - `validateAndCheck()`: 完整验证流程
  - `extractImageUrls()`: 从数据中提取图片URL
  - `validateGameDataImages()`: 验证游戏数据中的所有图片

### 2.3 数据流

#### 2.3.1 图片上传流程
```
用户选择图片
    ↓
FileUpload组件验证
    ↓
ImageHostingService上传
    ↓
检查缓存（ImageCacheManager）
    ↓
缓存命中 → 返回URL
    ↓
缓存未命中 → 上传到API
    ↓
API检查频率限制
    ↓
API优化图片（ImageOptimizer）
    ↓
上传到ImgBB图床
    ↓
ImgBB返回图片URL和缩略图URL
    ↓
失败时降级到本地存储
    ↓
返回URL给客户端
    ↓
保存到缓存
    ↓
更新UI显示
```

#### 2.3.2 游戏发布流程
```
用户填写游戏信息
    ↓
上传背景图片（返回图床URL）
    ↓
提交游戏数据（包含图床URL）
    ↓
API验证URL格式
    ↓
保存到数据库（只保存URL）
    ↓
发布成功
```

#### 2.3.3 游戏导入流程
```
用户导入游戏数据
    ↓
解析JSON数据
    ↓
获取图片URL
    ↓
直接使用URL显示图片
    ↓
无需重新上传
```

## 3. 技术实现

### 3.1 图片优化实现

#### 3.1.1 图片压缩
```typescript
async optimize(file: File, options?: OptimizationOptions): Promise<OptimizationResult> {
  const buffer = await file.arrayBuffer();
  let image = sharp(Buffer.from(buffer));
  
  // 格式转换
  if (options?.format === 'webp') {
    image = image.webp({ quality: options.quality || 85 });
  }
  
  // 压缩
  const optimizedBuffer = await image
    .resize(options?.maxWidth, options?.maxHeight, { fit: 'inside' })
    .toBuffer();
    
  return {
    originalSize: file.size,
    optimizedSize: optimizedBuffer.length,
    compressionRatio: (1 - optimizedBuffer.length / file.size) * 100,
    format: options?.format || 'webp'
  };
}
```

#### 3.1.2 缩略图生成
```typescript
async generateThumbnails(file: File, sizes: number[], format: string): Promise<File[]> {
  const thumbnails: File[] = [];
  
  for (const size of sizes) {
    const buffer = await file.arrayBuffer();
    const thumbnail = await sharp(Buffer.from(buffer))
      .resize(size, size, { fit: 'cover' })
      .toFormat(format)
      .toBuffer();
      
    thumbnails.push(new File([thumbnail], `thumb_${size}.${format}`));
  }
  
  return thumbnails;
}
```

### 3.2 缓存管理实现

#### 3.2.1 缓存检查
```typescript
async checkCache(fileHash: string): Promise<string | null> {
  const cached = await db.imageCache.where('fileHash').equals(fileHash).first();
  
  if (cached) {
    if (Date.now() - cached.timestamp > this.CACHE_TTL) {
      await db.imageCache.delete(cached.id);
      return null;
    }
    return cached.imageUrl;
  }
  
  return null;
}
```

#### 3.2.2 缓存保存
```typescript
async saveToCache(fileHash: string, imageUrl: string, fileSize: number): Promise<void> {
  await db.imageCache.add({
    fileHash,
    imageUrl,
    fileSize,
    timestamp: Date.now()
  });
  
  await this.cleanupCache();
}
```

### 3.3 上传服务实现

#### 3.3.1 图片上传
```typescript
async uploadImage(
  file: File,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
  const fileHash = await this.calculateHash(file);
  
  const cachedUrl = await this.cacheManager.checkCache(fileHash);
  if (cachedUrl) {
    return { success: true, url: cachedUrl, cached: true };
  }
  
  const formData = new FormData();
  formData.append('file', file);
  formData.append('key', fileHash);
  
  const response = await fetch('/api/images/upload', {
    method: 'POST',
    body: formData
  });
  
  const data = await response.json();
  await this.cacheManager.saveToCache(fileHash, data.url, file.size);
  
  return { success: true, url: data.url };
}
```

### 3.4 ImgBB 图床集成实现

#### 3.4.1 ImgBB API 调用
```typescript
async function uploadToImgBB(file: File): Promise<{ url: string; thumbnailUrl?: string }> {
  const apiKey = process.env.IMGBB_API_KEY;
  
  if (!apiKey) {
    throw new Error('ImgBB API Key 未配置');
  }

  const buffer = await file.arrayBuffer();
  const base64 = Buffer.from(buffer).toString('base64');

  const formData = new FormData();
  formData.append('image', base64);

  const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `ImgBB API 错误: ${response.status}`);
  }

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error?.message || '上传到 ImgBB 失败');
  }

  return {
    url: data.data.url,
    thumbnailUrl: data.data.thumb?.url
  };
}
```

#### 3.4.2 请求频率限制
```typescript
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();
const RATE_LIMIT = 10;
const RATE_LIMIT_WINDOW = 60 * 1000;

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(identifier);

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(identifier, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW
    });
    return true;
  }

  if (entry.count >= RATE_LIMIT) {
    return false;
  }

  entry.count++;
  return true;
}

function getClientIdentifier(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown';
  return ip;
}
```

#### 3.4.3 降级机制
```typescript
if (useImgBB) {
  try {
    const imgbbResult = await uploadToImgBB(optimizedFile);
    url = imgbbResult.url;
    thumbnailUrl = imgbbResult.thumbnailUrl;
    provider = 'imgbb';
    fileName = key || optimizedFile.name;
  } catch (error) {
    console.error('ImgBB 上传失败，切换到本地存储:', error);
    const timestamp = Date.now();
    fileName = `${timestamp}_${optimizedFile.name}`;
    const localResult = await uploadToLocal(optimizedFile, fileName);
    url = localResult.url;
    filePath = localResult.filePath;
    provider = 'local';
  }
}
```

### 3.5 图片URL验证实现

#### 3.5.1 URL格式验证
```typescript
static validateUrl(url: string): ImageUrlValidationResult {
  if (!url || typeof url !== 'string') {
    return {
      valid: false,
      error: 'URL不能为空'
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
        error: `URL必须以支持的图片扩展名结尾`
      };
    }

    return { valid: true, url };

  } catch (error) {
    return {
      valid: false,
      error: `无效的URL格式`
    };
  }
}
```

#### 3.5.2 URL可访问性检查
```typescript
static async checkAccessibility(url: string): Promise<ImageUrlValidationResult> {
  const validationResult = this.validateUrl(url);
  
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
        error: `无法访问图片URL: HTTP ${response.status}`
      };
    }

    const contentType = response.headers.get('content-type');

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
      size: parseInt(response.headers.get('content-length') || '0', 10)
    };

  } catch (error) {
    return {
      valid: false,
      error: `检查URL可访问性时出错`
    };
  }
}
```

#### 3.5.3 从游戏数据中提取图片URL
```typescript
static extractImageUrls(data: any): string[] {
  const urls: string[] = [];
  const visited = new Set<any>();

  const traverse = (obj: any) => {
    if (!obj || visited.has(obj)) {
      return;
    }

    visited.add(obj);

    if (typeof obj === 'string') {
      if (this.isValidImageUrl(obj)) {
        urls.push(obj);
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
```

### 3.6 游戏导入逻辑修改

#### 3.6.1 支持图床URL的缩略图提取
```typescript
static extractThumbnail(data: any): string | null {
  const possibleFields = [
    'thumbnail',
    'cover_image',
    'background_image',
    'image',
    'img',
    'icon'
  ];

  for (const field of possibleFields) {
    if (data[field]) {
      const value = data[field];
      if (typeof value === 'string' && 
          (value.startsWith('http://') || value.startsWith('https://'))) {
        return value;
      }
      return value;
    }
  }

  if (data.branches && data.branches.length > 0) {
    const firstBranch = data.branches[0];
    for (const field of possibleFields) {
      if (firstBranch[field]) {
        const value = firstBranch[field];
        if (typeof value === 'string' && 
            (value.startsWith('http://') || value.startsWith('https://'))) {
          return value;
        }
        return value;
      }
    }
  }

  return null;
}
```

#### 3.6.2 图床URL处理逻辑
```typescript
if (metadata.thumbnail) {
  if (typeof metadata.thumbnail === 'string' && 
      (metadata.thumbnail.startsWith('http://') || metadata.thumbnail.startsWith('https://'))) {
    thumbnailAssetId = metadata.thumbnail;
  } else {
    const assetFile = assetFiles.get(metadata.thumbnail) || 
                     Array.from(assetFiles.values()).find(f => 
                       f.name.includes(metadata.thumbnail!) || 
                       metadata.thumbnail!.includes(f.name)
                     );
    
    if (assetFile) {
      const blob = await assetFile.async('blob');
      thumbnailAssetId = await gameStore.storeAsset(blob, assetFile.name, 'image');
    }
  }
}
```

#### 3.6.3 游戏数据验证增强
```typescript
static validateGameData(data: any): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!data) {
    errors.push('游戏数据不能为空');
    return { valid: false, errors, warnings };
  }

  // 基本结构验证
  if (!data.game_title && !data.title) {
    errors.push('缺少游戏标题');
  }

  if (!data.branches && !data.scenes) {
    errors.push('缺少游戏分支或场景数据');
  }

  // 验证图片URL
  const imageUrls = ImageUrlValidator.extractImageUrls(data);
  imageUrls.forEach(url => {
    const validation = ImageUrlValidator.validateUrl(url);
    if (!validation.valid) {
      errors.push(`无效的图片URL: ${url} - ${validation.error}`);
    }
  });

  // ... 其他验证逻辑

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}
```

### 3.6 游戏存储逻辑修改
```typescript
async storeAsset(blob: Blob, name: string, type: 'image' | 'audio' | 'video'): Promise<string> {
  if (type === 'image') {
    const imageHostingService = new ImageHostingService();
    const file = new File([blob], name, { type: blob.type });
    const result = await imageHostingService.uploadImage(file);
    
    if (!result.success || !result.url) {
      throw new Error('图片上传失败: ' + result.error);
    }
    
    return result.url;
  } else {
    const assetId = this.generateId();
    const asset: AssetItem = {
      id: assetId,
      blob,
      type,
      name,
      size: blob.size,
      createdAt: new Date().toISOString()
    };
    
    await db.assets.add(asset);
    return assetId;
  }
}
```

#### 3.4.2 获取图片URL
```typescript
async getAsset(id: string): Promise<AssetItem | string | undefined> {
  if (id.startsWith('http://') || id.startsWith('https://')) {
    return id;
  }
  
  return await db.assets.get(id);
}
```

## 4. 性能优化

### 4.1 内存优化
- 图片不再存储在IndexedDB中，减少内存占用
- 使用图床URL代替Blob，降低数据传输量
- 缓存管理器自动清理过期缓存

### 4.2 网络优化
- 图片压缩减少上传和下载时间
- 缓存机制避免重复上传
- 缩略图提供快速预览

### 4.3 存储优化
- WebP格式比JPEG节省25-35%空间
- 自适应压缩确保最佳质量/大小比
- 服务器端统一管理图片文件

## 5. 安全考虑

### 5.1 文件验证
- 严格的文件类型检查
- 文件大小限制（默认10MB）
- 文件内容验证（不仅检查扩展名）

### 5.2 URL验证
- 游戏发布API验证URL格式
- 只允许http://和https://协议
- 防止XSS攻击

### 5.3 错误处理
- 完善的错误捕获和提示
- 上传失败时的回退机制
- 网络错误重试逻辑

## 6. 测试方案

### 6.1 单元测试
- ImageOptimizer功能测试
  - 测试图片压缩功能
  - 测试格式转换功能
  - 测试尺寸调整功能
  - 测试质量参数设置
- ImageCacheManager缓存测试
  - 测试缓存读写功能
  - 测试缓存过期机制
  - 测试缓存清理功能
  - 测试并发访问处理
- ImageHostingService上传测试
  - 测试文件上传功能
  - 测试缓存命中逻辑
  - 测试错误处理机制
  - 测试ImgBB集成
  - 测试降级机制
- ImageUrlValidator测试
  - 测试URL格式验证
  - 测试可访问性检查
  - 测试图片URL提取
  - 测试错误处理

### 6.2 集成测试
- 完整上传流程测试
- 缓存机制验证
- 游戏发布和导入测试

### 6.3 性能测试
- 大文件上传测试
- 并发上传测试
- 内存占用测试

## 7. 部署说明

### 7.1 环境要求
- Node.js 18+
- Sharp库依赖（需要编译环境）
- 足够的磁盘空间存储图片

### 7.2 配置项
```env
# ImgBB 图床配置
IMGBB_API_KEY=fed32bd809f1ed488421381a5d14dd8b

# 图片上传配置
MAX_IMAGE_SIZE=10485760  # 10MB
IMAGE_QUALITY=85
IMAGE_FORMAT=webp

# 请求频率限制
RATE_LIMIT=10  # 每分钟最多10次上传
RATE_LIMIT_WINDOW=60000  # 60秒

# 缓存配置
CACHE_TTL=2592000000  # 30天
MAX_CACHE_SIZE=10000
```

### 7.3 文件结构
```
public/uploads/
  └── images/
      ├── original/
      ├── optimized/
      └── thumbnails/
```

## 8. 维护指南

### 8.1 日常维护
- 定期清理过期缓存
- 监控磁盘空间使用
- 检查上传失败日志

### 8.2 故障排查
- 检查Sharp库是否正确安装
- 验证文件系统权限
- 查看浏览器控制台错误

### 8.3 性能监控
- 监控上传成功率
- 跟踪平均上传时间
- 分析缓存命中率

## 9. 未来扩展

### 9.1 支持更多图床
- 阿里云OSS
- 腾讯云COS
- 七牛云
- Cloudflare Images

### 9.2 高级功能
- 图片CDN加速
- 智能图片裁剪
- 图片水印
- 图片编辑器

### 9.3 性能提升
- Web Workers处理图片
- Service Worker离线缓存
- 渐进式图片加载

## 10. 更新记录

### v1.1.0 (2026-01-11)
- 新增图片URL验证功能
- 优化游戏导入逻辑支持图床链接
- 添加图片可访问性检查
- 完善游戏数据验证流程

### v1.0.0 (2026-01-11)
- 初始版本发布
- 实现基本图床功能
- 图片优化和压缩
- 缓存机制
- 游戏发布和导入集成
