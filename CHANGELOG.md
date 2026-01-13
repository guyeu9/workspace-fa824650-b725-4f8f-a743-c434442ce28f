# 更新记录

## 版本 1.2.0 (2026-01-14)

### 新增功能

#### FileUpload组件增强
- 添加URL手动输入功能，支持用户直接粘贴或输入图片链接
- 新增`showUrlInput`和`onUrlChange` props，控制URL输入框显示
- 添加"复制链接"按钮，方便用户快速复制图片URL
- URL输入框样式遵循UI设计指南，使用蓝色边框和聚焦效果

#### 图片加载错误处理
- 新增`imageLoadError`状态跟踪图片加载状态
- 实现`handleImageError`和`handleImageLoad`回调处理图片加载事件
- 预览区域显示加载失败时的友好错误提示（红色警告图标+文字）
- URL输入框下方显示错误信息，提示用户检查链接
- 上传成功或重新输入URL时自动重置错误状态

#### Chevereto图床集成
- 集成Chevereto API作为主要图床服务
- 使用提供的API Key进行认证：
- API端点：`https://www.picgo.net/api/1/upload`
- 使用XMLHttpRequest实现实时上传进度回调
- 支持Chevereto API响应格式解析
- 添加`chevereto`到HostingProvider类型

#### ImageHostingService优化
- 重构上传逻辑，支持Chevereto和本地存储双模式
- 实现`uploadToChevereto`方法，使用XMLHttpRequest上传到Chevereto API
- 重构`uploadToLocal`方法，使用XMLHttpRequest替代fetch，支持实时进度
- 移除冗余的`uploadToLocalFallback`方法
- 统一错误处理和进度回调机制

### 改进

#### 用户体验优化
- 图片加载失败时不再显示灰色空白区域，改为显示明确的错误提示
- 支持上传和手动输入两种方式自由切换
- 上传进度实时显示，提升用户感知
- 错误信息更加友好和具体

### 技术细节

#### 新增文件
- `src/components/file-upload.tsx` - 添加URL输入、错误处理、复制链接功能
- `src/lib/image-hosting-service.ts` - 添加Chevereto支持、重构上传逻辑

#### 修改文件
- `src/app/studio/page.tsx` - 启用FileUpload的URL输入功能

#### 核心功能
- URL输入：支持手动输入或粘贴外部图片URL
- 图片预览：实时显示上传或输入的图片
- 错误处理：图片加载失败时显示友好提示
- 上传进度：使用XMLHttpRequest实现实时进度回调
- Chevereto API：使用multipart/form-data上传，支持X-API-Key认证
- 响应解析：支持Chevereto JSON格式响应
- 缓存机制：上传成功后自动缓存，避免重复上传
- 降级机制：Chevereto失败时自动切换到本地存储

### 兼容性
- 完全向后兼容现有游戏数据
- 支持所有现有图片格式（JPEG、PNG、WebP、GIF、BMP、TIFF）
- 支持混合模式（图床URL + 本地文件）
- 降级机制确保服务可用性

---

## 版本 1.1.0 (2026-01-11)

### 新增功能

#### ImgBB 图床集成
- 集成 ImgBB 图床服务，提供专业的图片托管
- 自动上传图片到 ImgBB，获取稳定的图片链接
- 支持缩略图生成，提供快速预览功能
- 实现降级机制，图床不可用时自动切换到本地存储
- 添加上传频率限制，防止 API 滥用（每分钟 10 次）

#### 图片URL验证
- 新增 `ImageUrlValidator` 类，提供完整的图片URL验证功能
- 支持URL格式验证（协议、主机名、扩展名）
- 支持URL可访问性检查（HEAD请求、内容类型验证）
- 支持从游戏数据中自动提取和验证所有图片URL
- 支持批量URL验证

#### 游戏导入优化
- 优化游戏导入逻辑，支持图床URL
- 自动识别和处理图床链接
- 保持对本地文件的支持（向后兼容）
- 增强游戏数据验证，包含图片URL验证

### 改进

#### 图片上传流程
- 优化图片上传进度显示
- 改进错误处理和用户提示
- 增强缓存机制，提升上传速度
- 支持图床和本地存储双模式

#### 安全性增强
- 实现服务器端 API 代理，防止 API 密钥泄露
- 添加请求频率限制，防止 API 滥用
- 增强输入验证，防止安全漏洞

#### 文档更新
- 更新技术设计文档，包含 ImgBB 集成和图片URL验证实现
- 更新用户指南，添加图床服务说明和常见问题
- 添加版本信息和更新日期
- 创建集成测试用例

### 技术细节

#### 新增文件
- `src/lib/image-url-validator.ts` - 图片URL验证器
- `tests/image-hosting-integration.test.ts` - 图床集成测试用例

#### 修改文件
- `src/lib/image-hosting-service.ts` - 添加 ImgBB 提供商支持
- `src/app/api/images/upload/route.ts` - 实现 ImgBB API 集成和降级机制
- `src/lib/game-importer.ts` - 优化导入逻辑，支持图床URL
- `.env` - 添加 ImgBB API 密钥配置
- `docs/IMAGE_HOSTING_OPTIMIZATION.md` - 更新技术文档
- `USER_GUIDE.md` - 更新用户指南，添加图床服务章节

#### 核心功能
- ImgBB API 集成：使用 Base64 编码上传图片
- 降级机制：图床失败时自动切换到本地存储
- 频率限制：每 IP 每分钟最多 10 次上传
- URL格式验证：支持 http:// 和 https:// 协议
- URL可访问性检查：使用 HEAD 请求验证URL可访问性
- 内容类型验证：确保URL返回的是图片内容
- 自动URL提取：从游戏数据中递归提取所有图片URL
- 批量验证：支持同时验证多个URL

### 性能优化

- 图片缓存机制避免重复上传
- 图片压缩和格式转换减少存储空间
- 图床URL直接使用，无需重新下载和上传
- 优化的验证流程，减少不必要的网络请求
- ImgBB CDN 加速图片加载

### 兼容性

- 完全向后兼容现有游戏数据
- 支持混合模式（图床URL + 本地文件）
- 支持所有现有图片格式
- 降级机制确保服务可用性

---

## 版本 1.0.0 (2026-01-11)

### 初始版本发布

#### 核心功能

##### 图片优化
- 使用 Sharp 库进行图片压缩和格式转换
- 自动转换为 WebP 格式，节省 25-35% 空间
- 支持生成多种尺寸的缩略图
- 自适应压缩确保最佳质量/大小比

##### 图片缓存管理
- 使用 Dexie.js + IndexedDB 存储缓存
- LRU 缓存淘汰策略
- 30 天 TTL 自动清理
- 避免重复上传相同图片

##### 图床上传服务
- 统一的图片上传接口
- 支持上传进度回调
- 自动缓存检查
- 客户端哈希计算

##### 图片上传API
- 服务器端图片处理
- 文件验证和优化
- 保存到文件系统
- 返回图片URL

##### 游戏存储优化
- 图片自动上传到图床
- 只存储图床 URL，不再存储 Blob
- 音频和视频保持原有存储方式

##### 文件上传组件
- 集成图床上传服务
- 实时上传进度显示
- 自动缓存利用

##### 游戏发布API
- 验证图床 URL 格式
- 只接受 http:// 和 https:// 协议
- 数据库只保存 URL

### 技术栈

- **前端**：React, Next.js, TypeScript
- **图片处理**：Sharp (服务器端)
- **缓存**：Dexie.js, IndexedDB
- **数据库**：Prisma, PostgreSQL
- **文件存储**：本地文件系统

### 支持的图片格式

- JPEG (.jpg, .jpeg)
- PNG (.png)
- WebP (.webp)
- GIF (.gif)
- BMP (.bmp)
- SVG (.svg)

### 图片大小限制

- 单个图片最大 10MB
- 系统会自动压缩大图片

### 性能优化效果

- **内存占用**：大幅降低（不再存储图片 Blob）
- **上传速度**：缓存机制避免重复上传
- **加载速度**：优化的图片格式和大小
- **存储空间**：WebP 格式节省 25-35% 空间

### 文档

- 技术设计文档：`docs/IMAGE_HOSTING_OPTIMIZATION.md`
- 用户指南：`USER_GUIDE.md`
