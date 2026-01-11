# 互动式故事游戏编辑器和播放器系统

一个功能强大的跨平台互动式故事游戏编辑器和播放器系统，支持 Web 和 Android 平台。

## ✨ 特性

- 🎮 **游戏库** - 浏览、管理和玩游戏
- ✏️ **游戏编辑器** - 创建和编辑互动式故事游戏
- 🎨 **增强编辑器** - 高级编辑功能，支持可视化编辑
- 🏢 **工作室** - 团队协作和项目管理
- 🌍 **社区功能** - 评论、评分和分享
- 📱 **跨平台** - 支持 Web 和 Android 平台
- 📦 **导入导出** - 支持 JSON 和 ZIP 格式
- 💾 **数据持久化** - 本地存储和备份
- 🔐 **用户认证** - 安全的注册和登录
- 🎯 **实时预览** - 编辑时实时预览游戏

## 🚀 快速开始

### 环境要求

| 组件 | 版本要求 |
|------|----------|
| Node.js | 18.x 或更高 |
| npm | 9.x 或更高 |
| PostgreSQL | 14.x 或更高（可选，用于社区功能） |
| Git | 2.x 或更高 |

### 安装和运行

```bash
# 克隆仓库
git clone https://github.com/your-repo.git
cd project-directory

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env.local

# 初始化数据库（可选）
npx prisma migrate dev
npx prisma db seed

# 启动开发服务器
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

## 📁 文档

### 开发文档

- **[开发设计文档](./DEVELOPMENT.md)** - 技术栈、项目结构和开发指南
- **[架构设计文档](./ARCHITECTURE.md)** - 系统架构、组件设计和数据模型
- **[API文档](./API_DOCUMENTATION.md)** - 完整的API接口说明

### 部署文档

- **[部署文档](./DEPLOYMENT.md)** - Web和Android部署指南
- **[APK构建指南](./APK-BUILD-GUIDE.md)** - Android APK构建详细指南
- **[CI/CD测试总结](./CICD_TEST_SUMMARY.md)** - CI/CD流水线配置和测试结果

### 用户文档

- **[用户指南](./USER_GUIDE.md)** - 详细的用户使用指南
- **[UI设计指南](./UI_DESIGN_GUIDELINES.md)** - UI组件和设计规范
- **[数据持久化系统](./DATA_PERSISTENCE_SYSTEM.md)** - 数据存储和备份系统说明

### 贡献文档

- **[贡献指南](./CONTRIBUTING.md)** - 开发者贡献指南

## 🎯 技术栈

### 核心框架

- **Next.js 15.3.5** - React 框架，支持 SSR/SSG
- **React 18** - UI 库
- **TypeScript 5** - 类型安全

### UI 组件库

- **Tailwind CSS 4** - CSS 框架
- **Shadcn UI** - UI 组件库
- **Lucide React** - 图标库
- **Framer Motion** - 动画库

### 状态管理和数据

- **Zustand** - 轻量级状态管理
- **Dexie** - IndexedDB 封装库
- **Prisma** - ORM（用于社区功能）
- **PostgreSQL** - 主数据库（用于社区功能）

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
- **PlatformFileDownloader** - 跨平台文件下载
- **PlatformFileUploader** - 跨平台文件上传

### 其他

- **Sonner** - Toast 通知
- **React Hook Form** - 表单处理
- **Zod** - 数据验证

## 📂 项目结构

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
│   │   ├── game/             # 游戏相关组件
│   │   └── community/        # 社区组件
│   ├── lib/                  # 工具库
│   │   ├── game-store.ts     # 游戏存储
│   │   ├── platform-file-download.ts  # 跨平台下载
│   │   ├── platform-file-upload.ts    # 跨平台上传
│   │   ├── file-config.ts    # 文件配置
│   │   └── workers/         # Web Workers
│   └── styles/              # 样式文件
├── prisma/                  # Prisma 配置
├── android/                 # Android 原生代码
├── public/                  # 静态资源
└── docs/                   # 文档
```

## 🎮 核心功能

### 游戏编辑器

- **基础编辑器** - 创建和编辑游戏分支和选项
- **增强编辑器** - 可视化编辑界面，拖拽式管理
- **实时预览** - 编辑时实时预览游戏
- **导入导出** - 支持 JSON 和 ZIP 格式

### 游戏库

- **本地游戏管理** - 管理个人游戏库
- **社区游戏浏览** - 浏览和搜索社区游戏
- **游戏评分和评论** - 为游戏评分和评论
- **批量导入导出** - 支持批量操作

### 游戏引擎

- **分支选择逻辑** - 根据用户选择切换分支
- **选项处理** - 处理游戏选项和条件
- **背景显示** - 显示游戏背景图片
- **进度保存** - 自动保存游戏进度

### 数据持久化

- **IndexedDB 存储** - 本地存储游戏数据
- **资产管理** - 管理游戏资产文件
- **ZIP 压缩** - 使用 pako 高效压缩
- **备份恢复** - 完整的备份和恢复功能

### 跨平台文件处理

- **Web 端下载** - 使用 Blob + URL.createObjectURL
- **原生端下载** - 使用 Capacitor Filesystem API
- **Web 端上传** - 使用 File API
- **原生端上传** - 使用 Capacitor File Picker
- **ZIP 处理** - 使用 JSZip 处理压缩文件

## 🔐 安全

- **认证** - JWT Token 认证
- **授权** - 基于角色的访问控制 (RBAC)
- **数据验证** - 使用 Zod 验证输入
- **文件上传防护** - 文件类型和大小验证
- **XSS 防护** - HTML 转义
- **CSRF 防护** - CSRF 令牌

## 🚀 部署

### Web 部署

```bash
# 构建项目
npm run build

# 启动生产服务器
npm run start
```

支持的平台：
- Vercel
- Netlify
- GitHub Pages
- 自托管

### Android 部署

#### 使用 GitHub Actions（推荐）

1. 推送代码到 GitHub
2. 启用 GitHub Actions 工作流
3. 自动构建 APK
4. 从 Actions 下载 APK

#### 本地构建

```bash
# 构建 Debug APK
npm run build:android:debug

# 构建 Release APK（需要签名）
npm run build:android:release
```

详见 [APK构建指南](./APK-BUILD-GUIDE.md)

## 📊 性能

- **代码分割** - 按需加载
- **图片优化** - 响应式图片
- **缓存策略** - 浏览器缓存
- **懒加载** - 延迟加载非关键资源
- **压缩** - 使用 pako 压缩数据

## 🤝 贡献

我们欢迎所有类型的贡献！请查看 [贡献指南](./CONTRIBUTING.md) 了解详情。

### 贡献类型

- 修复错误
- 新增功能
- 改进文档
- 优化性能
- 翻译内容

## 📝 更新日志

### v1.0.0 (2026-01-11)

- ✅ 完成跨平台导入导出功能
- ✅ 优化压缩算法（pako）
- ✅ 添加 Web Worker 支持
- ✅ 完善错误处理
- ✅ 更新所有文档
- ✅ 添加进度指示器组件
- ✅ 实现完整的 ZIP 文件导入导出
- ✅ 优化移动端体验

### v0.9.0

- ✅ 添加后台管理功能
- ✅ 实现用户认证系统
- ✅ 添加社区功能
- ✅ 优化移动端体验

### v0.8.0

- ✅ 添加游戏编辑器
- ✅ 实现游戏引擎
- ✅ 添加游戏库
- ✅ 支持导入导出

## 📄 许可证

MIT License - 详见 [LICENSE](./LICENSE) 文件。

## 📞 联系方式

如果您有任何问题或建议，请联系：

- **邮箱**: support@yourdomain.com
- **GitHub Issues**: https://github.com/your-repo/issues
- **支持论坛**: https://forum.yourdomain.com

---

**最后更新**: 2026-01-11
