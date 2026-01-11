# 开发设计文档

## 项目概述

这是一个基于 Next.js + TypeScript + Tailwind CSS + Shadcn UI 的互动式故事游戏编辑器和播放器系统。项目支持多平台部署（Web、Android），并提供完整的游戏创作、编辑、分享和社区功能。

## 技术栈

### 前端框架
- **Next.js 15.3.5** - React 框架，支持 SSR/SSG
- **React 18** - UI 库
- **TypeScript** - 类型安全

### UI 组件库
- **Tailwind CSS** - CSS 框架
- **Shadcn UI** - UI 组件库
- **Lucide React** - 图标库

### 状态管理
- **Zustand** - 轻量级状态管理
- **Dexie** - IndexedDB 封装库

### 数据库
- **PostgreSQL** - 主数据库
- **Prisma** - ORM
- **IndexedDB** - 本地存储

### 认证
- **NextAuth.js** - 认证框架

### 移动端
- **Capacitor** - 跨平台移动应用框架
- **@capacitor/core** - 核心库
- **@capacitor/filesystem** - 文件系统
- **@capacitor/share** - 分享功能

### 文件处理
- **JSZip** - ZIP 文件处理
- **pako** - 压缩库
- **FileSaver.js** - 文件下载

### 其他
- **Sonner** - Toast 通知
- **React Hook Form** - 表单处理
- **Zod** - 数据验证

## 项目结构

```
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── admin/             # 后台管理
│   │   ├── auth/              # 认证页面
│   │   ├── game-editor/        # 游戏编辑器
│   │   ├── enhanced-editor/    # 增强编辑器
│   │   ├── game-library/      # 游戏库
│   │   ├── studio/            # 工作室
│   │   └── api/               # API 路由
│   ├── components/            # React 组件
│   │   ├── ui/               # UI 组件
│   │   └── game/             # 游戏相关组件
│   ├── lib/                  # 工具库
│   │   ├── game-store.ts     # 游戏存储
│   │   ├── platform-file-download.ts  # 跨平台下载
│   │   ├── platform-file-upload.ts    # 跨平台上传
│   │   └── workers/         # Web Workers
│   └── styles/              # 样式文件
├── prisma/                  # Prisma 配置
├── android/                 # Android 原生代码
└── public/                  # 静态资源
```

## 核心功能模块

### 1. 游戏编辑器

#### 游戏编辑器 (game-editor)
- **路径**: `src/app/game-editor/page.tsx`
- **功能**: 基础游戏编辑器
- **特性**:
  - 创建和编辑游戏分支
  - 添加和编辑选项
  - 设置背景图片
  - 导出/导入游戏（JSON）
  - 实时预览

#### 增强编辑器 (enhanced-editor)
- **路径**: `src/app/enhanced-editor/page.tsx`
- **功能**: 高级游戏编辑器
- **特性**:
  - 可视化编辑界面
  - 拖拽式分支管理
  - 资产管理
  - 高级选项配置

#### 工作室 (studio)
- **路径**: `src/app/studio/page.tsx`
- **功能**: 游戏工作室
- **特性**:
  - 游戏项目管理
  - 团队协作
  - 版本控制
  - 发布管理

### 2. 游戏库

#### 游戏库 (game-library)
- **路径**: `src/app/game-library/page.tsx`
- **功能**: 游戏库管理
- **特性**:
  - 本地游戏管理
  - 社区游戏浏览
  - 游戏评分和评论
  - 批量导入/导出

### 3. 游戏引擎

#### 游戏引擎
- **路径**: `src/components/game/`
- **功能**: 游戏运行引擎
- **特性**:
  - 分支选择逻辑
  - 选项处理
  - 背景显示
  - 进度保存

### 4. 数据持久化

#### 游戏存储 (game-store)
- **路径**: `src/lib/game-store.ts`
- **功能**: 游戏数据持久化
- **特性**:
  - IndexedDB 存储
  - 资产管理
  - ZIP 压缩
  - 数据验证

#### 游戏库备份 (game-library-backup)
- **路径**: `src/lib/game-library-backup.ts`
- **功能**: 游戏库备份
- **特性**:
  - 完整备份
  - 增量备份
  - 压缩存储
  - 恢复功能

### 5. 跨平台文件处理

#### 文件下载 (platform-file-download)
- **路径**: `src/lib/platform-file-download.ts`
- **功能**: 跨平台文件下载
- **特性**:
  - Web 端下载
  - 原生端下载
  - 自动降级
  - 进度回调

#### 文件上传 (platform-file-upload)
- **路径**: `src/lib/platform-file-upload.ts`
- **功能**: 跨平台文件上传
- **特性**:
  - 文件验证
  - 大小限制
  - 进度回调
  - 错误处理

### 6. 后台管理

#### 用户管理
- **路径**: `src/app/admin/users/`
- **功能**: 用户管理
- **特性**:
  - 用户列表
  - 用户编辑
  - 权限管理

#### 游戏管理
- **路径**: `src/app/admin/games/`
- **功能**: 游戏管理
- **特性**:
  - 游戏列表
  - 游戏审核
  - 游戏删除

#### 评论管理
- **路径**: `src/app/admin/comments/`
- **功能**: 评论管理
- **特性**:
  - 评论列表
  - 评论审核
  - 评论删除

## 数据模型

### 游戏数据结构

```typescript
interface GameData {
  game_title: string;
  description?: string;
  author?: string;
  tags?: string[];
  branches: Branch[];
  background_image?: string;
  background_asset_id?: string;
}

interface Branch {
  branch_id: string;
  branch_title: string;
  content: string;
  options: Option[];
}

interface Option {
  option_id: string;
  option_text: string;
  target_branch_id: string;
  conditions?: Condition[];
}
```

### 用户数据结构

```typescript
interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  createdAt: Date;
}
```

### 评论数据结构

```typescript
interface Comment {
  id: string;
  gameId: string;
  userId: string;
  content: string;
  rating?: number;
  createdAt: Date;
}
```

## API 接口

### 认证 API
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/[...nextauth]` - NextAuth 认证

### 游戏 API
- `GET /api/games` - 获取游戏列表
- `GET /api/games/[id]` - 获取游戏详情
- `POST /api/games` - 创建游戏
- `PUT /api/games/[id]` - 更新游戏
- `DELETE /api/games/[id]` - 删除游戏
- `GET /api/games/[id]/comments` - 获取游戏评论
- `POST /api/games/[id]/comments` - 添加评论
- `POST /api/games/[id]/vote` - 游戏投票

### 后台管理 API
- `GET /api/admin/users` - 获取用户列表
- `GET /api/admin/users/[id]` - 获取用户详情
- `GET /api/admin/games` - 获取游戏列表
- `GET /api/admin/comments` - 获取评论列表

## 开发指南

### 环境配置

1. **安装依赖**
```bash
npm install
```

2. **配置环境变量**
创建 `.env.local` 文件：
```env
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

3. **初始化数据库**
```bash
npx prisma migrate dev
npx prisma db seed
```

4. **启动开发服务器**
```bash
npm run dev
```

### 代码规范

- 使用 TypeScript 类型定义
- 遵循 ESLint 规则
- 使用 Prettier 格式化代码
- 组件使用函数式组件 + Hooks

### UI 设计规范

#### 设计原则

1. **一致性**
   - 统一的视觉风格
   - 一致的交互模式
   - 统一的命名规范

2. **可访问性**
   - 支持键盘导航
   - 支持屏幕阅读器
   - 合适的颜色对比度
   - 语义化 HTML

3. **响应式设计**
   - 支持多种屏幕尺寸
   - 移动端优先
   - 触摸友好的操作

4. **性能**
   - 优化图片加载
   - 使用 CSS 动画替代 JavaScript 动画
   - 懒加载非关键资源

#### 组件设计

1. **按钮**
   - 主要按钮：使用渐变色背景
   - 次要按钮：使用边框样式
   - 危险操作：使用红色
   - 悬停和点击状态

2. **卡片**
   - 统一的圆角和阴影
   - 适当的内边距
   - 悬停效果

3. **输入框**
   - 清晰的标签
   - 合适的占位符
   - 错误状态提示
   - 输入验证反馈

4. **导航栏**
   - 固定在顶部
   - 响应式菜单
   - 清晰的导航结构

5. **对话框**
   - 模态背景遮罩
   - 适当的动画
   - 清晰的操作按钮

#### 颜色规范

| 颜色 | 用途 | 十六进制 |
|------|------|---------|
| 主色 | 主要操作 | #3b82f6 |
| 次要色 | 次要操作 | #64748b |
| 成功色 | 成功状态 | #10b981 |
| 警告色 | 警告状态 | #f59e0b |
| 错误色 | 错误状态 | #ef4444 |
| 背景色 | 页面背景 | #ffffff |
| 文本色 | 主要文本 | #1f2937 |
| 次要文本 | 次要文本 | #6b7280 |

#### 间距规范

| 间距 | 用途 | 值 |
|------|------|-----|
| xs | 极小间距 | 4px |
| sm | 小间距 | 8px |
| md | 中等间距 | 16px |
| lg | 大间距 | 24px |
| xl | 超大间距 | 32px |

#### 字体规范

| 字体 | 用途 | 大小 |
|------|------|-----|
| 标题 | 页面标题 | 32px |
| 副标题 | 章节标题 | 24px |
| 正文 | 主要内容 | 16px |
| 小字 | 辅助文本 | 14px |
| 按钮 | 按钮文本 | 14px |

#### 图标规范

- 使用 Lucide React 图标库
- 统一的图标大小
- 适当的图标间距
- 清晰的图标语义

#### 动画规范

- 使用 Framer Motion 进行动画
- 动画时长：200-300ms
- 缓动函数：ease-in-out
- 避免过度动画

#### 响应式断点

| 断点 | 设备 | 最小宽度 |
|------|------|---------|
| sm | 手机 | 640px |
| md | 平板 | 768px |
| lg | 桌面 | 1024px |
| xl | 大屏幕 | 1280px |

### 测试

```bash
npm run test          # 运行测试
npm run test:watch   # 监视模式
npm run test:coverage # 覆盖率报告
```

### 构建

```bash
npm run build        # 生产构建
npm run start        # 启动生产服务器
```

### Android 构建

```bash
npm run build:android  # 构建 APK
```

## 性能优化

### 1. 代码分割
- 使用 Next.js 动态导入
- 按路由分割代码

### 2. 图片优化
- 使用 Next.js Image 组件
- 响应式图片

### 3. 数据缓存
- 使用 IndexedDB 缓存游戏数据
- 使用 React Query 缓存 API 数据

### 4. 压缩
- 使用 pako 压缩游戏数据
- 使用 gzip 压缩 HTTP 响应

## 安全考虑

### 1. 认证
- 使用 NextAuth.js
- JWT Token 认证
- 会话管理

### 2. 数据验证
- 使用 Zod 验证输入
- Prisma 数据验证
- XSS 防护

### 3. 文件上传
- 文件类型验证
- 文件大小限制
- 病毒扫描（可选）

### 4. CORS
- 配置 CORS 策略
- 限制允许的域名

## 部署

### Web 部署
1. 构建项目
2. 部署到 Vercel/Netlify/自托管
3. 配置环境变量
4. 配置数据库

### Android 部署
1. 构建 APK
2. 签名 APK
3. 上传到 Google Play
4. 配置应用权限

## 故障排除

### 常见问题

1. **构建失败**
   - 检查 Node.js 版本
   - 清除 node_modules
   - 重新安装依赖

2. **数据库连接失败**
   - 检查 DATABASE_URL
   - 检查数据库服务状态
   - 检查网络连接

3. **文件上传失败**
   - 检查文件大小限制
   - 检查文件类型
   - 检查浏览器兼容性

## 更新日志

### v1.0.0 (2026-01-11)
- 完成跨平台文件处理
- 优化压缩算法（pako）
- 添加 Web Worker 支持
- 完善错误处理
- 更新用户指南

### v0.9.0
- 添加后台管理功能
- 实现用户认证系统
- 添加社区功能
- 优化移动端体验

### v0.8.0
- 添加游戏编辑器
- 实现游戏引擎
- 添加游戏库
- 支持导入导出

## 贡献指南

欢迎贡献！请查看 [CONTRIBUTING.md](./CONTRIBUTING.md) 了解详情。

## 许可证

MIT License - 详见 [LICENSE](./LICENSE) 文件。
