# 架构设计文档

## 1. 系统架构概述

### 1.1 架构目标

- **跨平台兼容**：支持 Web 和移动平台
- **高性能**：流畅的用户体验
- **可扩展性**：易于添加新功能
- **模块化**：清晰的代码结构
- **可靠性**：数据持久化和备份

### 1.2 架构分层

```
┌─────────────────────────────────────────────────┐
│                   前端层                        │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐ │
│  │ Web 应用   │  │ Android 应用│  │ iOS 应用   │ │
│  └────────────┘  └────────────┘  └────────────┘ │
└─────────────────────────────────────────────────┘
          │                 │                 │
          └─────────────────┼─────────────────┘
                            ▼
┌─────────────────────────────────────────────────┐
│                   API 层                        │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐ │
│  │ Next.js API│  │ REST API   │  │ GraphQL API │ │
│  └────────────┘  └────────────┘  └────────────┘ │
└─────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────┐
│                   业务逻辑层                    │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐ │
│  │ 游戏引擎   │  │ 用户管理   │  │ 社区功能   │ │
│  └────────────┘  └────────────┘  └────────────┘ │
└─────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────┐
│                   数据层                        │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐ │
│  │ PostgreSQL │  │ IndexedDB  │  │ Redis      │ │
│  └────────────┘  └────────────┘  └────────────┘ │
└─────────────────────────────────────────────────┘
```

## 2. 核心组件设计

### 2.1 游戏引擎组件

#### 2.1.1 组件结构

```
GameEngine
├── BranchManager      # 分支管理
├── OptionHandler      # 选项处理
├── StateManager       # 状态管理
├── Renderer           # 渲染器
└── AudioManager       # 音频管理
```

#### 2.1.2 工作流程

1. **初始化**：加载游戏数据
2. **分支选择**：根据用户选择切换分支
3. **内容渲染**：渲染分支内容
4. **选项生成**：生成可选选项
5. **状态更新**：保存游戏状态
6. **循环**：等待用户选择

#### 2.1.3 数据流向

```
GameData → BranchManager → Renderer → User → OptionHandler → StateManager → BranchManager
```

### 2.2 游戏编辑器组件

#### 2.2.1 组件结构

```
GameEditor
├── EditorCanvas       # 编辑画布
├── BranchEditor       # 分支编辑器
├── OptionEditor       # 选项编辑器
├── AssetManager       # 资产管理
├── PreviewPanel       # 预览面板
└── ExportManager      # 导出管理器
```

#### 2.2.2 工作流程

1. **初始化**：创建或加载游戏
2. **编辑**：编辑分支和选项
3. **预览**：实时预览游戏
4. **导出**：导出游戏数据

### 2.3 存储系统组件

#### 2.3.1 组件结构

```
StorageSystem
├── GameStore          # 游戏存储
├── AssetStore         # 资产存储
├── UserStore          # 用户存储
├── BackupManager      # 备份管理
└── SyncManager        # 同步管理
```

#### 2.3.2 数据持久化策略

| 数据类型 | 存储位置 | 备份策略 | 同步策略 |
|---------|---------|---------|---------|
| 游戏数据 | IndexedDB | 定期备份 | 手动同步 |
| 资产文件 | IndexedDB | 随游戏备份 | 手动同步 |
| 用户数据 | PostgreSQL | 自动备份 | 实时同步 |
| 游戏状态 | IndexedDB | 实时备份 | 手动同步 |

### 2.4 跨平台文件处理组件

#### 2.4.1 组件结构

```
FileHandler
├── FileDownloader     # 文件下载器
├── FileUploader       # 文件上传器
├── ZipHandler         # ZIP 处理
├── CompressionManager # 压缩管理
└── FileValidator      # 文件验证
```

#### 2.4.2 跨平台适配

| 功能 | Web 实现 | Android 实现 |
|------|---------|-------------|
| 文件下载 | Blob + URL.createObjectURL | Capacitor Filesystem |
| 文件上传 | File API | Capacitor File Picker |
| ZIP 处理 | JSZip | JSZip |
| 压缩 | pako | pako |

## 3. 数据模型设计

### 3.1 核心数据模型

#### 3.1.1 GameData

```typescript
interface GameData {
  id: string;
  game_title: string;
  description?: string;
  author?: string;
  tags?: string[];
  version: number;
  createdAt: Date;
  updatedAt: Date;
  background_image?: string;
  background_asset_id?: string;
  branches: Branch[];
}
```

#### 3.1.2 Branch

```typescript
interface Branch {
  branch_id: string;
  branch_title: string;
  content: string;
  options: Option[];
  background_asset_id?: string;
  audio_asset_id?: string;
}
```

#### 3.1.3 Option

```typescript
interface Option {
  option_id: string;
  option_text: string;
  target_branch_id: string;
  conditions?: Condition[];
  consequences?: Consequence[];
}
```

#### 3.1.4 Condition

```typescript
interface Condition {
  type: 'variable' | 'flag' | 'item';
  key: string;
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains';
  value: any;
}
```

#### 3.1.5 Consequence

```typescript
interface Consequence {
  type: 'set_variable' | 'set_flag' | 'add_item' | 'remove_item' | 'show_message';
  key: string;
  value: any;
}
```

### 3.2 存储模型

#### 3.2.1 IndexedDB 表结构

| 表名 | 主键 | 字段 |
|------|------|------|
| games | id | id, title, data, metadata |
| assets | id | id, name, type, blob |
| game_states | id | game_id, save_data |
| backups | id | timestamp, data, size |

#### 3.2.2 PostgreSQL 表结构

| 表名 | 主键 | 字段 |
|------|------|------|
| users | id | id, name, email, password_hash |
| games | id | id, title, description, author_id, created_at |
| game_versions | id | game_id, version, data |
| comments | id | game_id, user_id, content, rating, created_at |
| tags | id | name, created_at |
| game_tags | id | game_id, tag_id |

## 4. API 设计

### 4.1 REST API 设计

#### 4.1.1 游戏相关 API

| 端点 | 方法 | 描述 | 认证 |
|------|------|------|------|
| /api/games | GET | 获取游戏列表 | 可选 |
| /api/games | POST | 创建游戏 | 必需 |
| /api/games/:id | GET | 获取游戏详情 | 可选 |
| /api/games/:id | PUT | 更新游戏 | 必需 |
| /api/games/:id | DELETE | 删除游戏 | 必需 |
| /api/games/:id/comments | GET | 获取游戏评论 | 可选 |
| /api/games/:id/comments | POST | 添加评论 | 必需 |
| /api/games/:id/vote | POST | 游戏投票 | 必需 |

#### 4.1.2 用户相关 API

| 端点 | 方法 | 描述 | 认证 |
|------|------|------|------|
| /api/auth/register | POST | 用户注册 | 无需 |
| /api/auth/login | POST | 用户登录 | 无需 |
| /api/auth/me | GET | 获取当前用户 | 必需 |
| /api/auth/update | PUT | 更新用户信息 | 必需 |

#### 4.1.3 后台管理 API

| 端点 | 方法 | 描述 | 认证 |
|------|------|------|------|
| /api/admin/users | GET | 获取用户列表 | 管理员 |
| /api/admin/users/:id | GET | 获取用户详情 | 管理员 |
| /api/admin/users/:id | PUT | 更新用户 | 管理员 |
| /api/admin/users/:id | DELETE | 删除用户 | 管理员 |
| /api/admin/games | GET | 获取游戏列表 | 管理员 |
| /api/admin/comments | GET | 获取评论列表 | 管理员 |
| /api/admin/comments/:id | DELETE | 删除评论 | 管理员 |

### 4.2 WebSocket API 设计

#### 4.2.1 实时功能

| 事件 | 描述 | 方向 |
|------|------|------|
| game:update | 游戏更新通知 | 服务器 → 客户端 |
| comment:new | 新评论通知 | 服务器 → 客户端 |
| user:online | 用户上线通知 | 服务器 → 客户端 |
| game:play | 游戏播放状态 | 双向 |

## 5. 安全设计

### 5.1 认证与授权

- **认证方式**：JWT Token
- **授权方式**：基于角色的访问控制 (RBAC)
- **角色**：用户、管理员

### 5.2 数据安全

- **数据加密**：传输加密 (HTTPS)
- **存储加密**：敏感数据加密存储
- **数据验证**：输入验证和输出编码

### 5.3 安全防护

- **XSS 防护**：HTML 转义
- **CSRF 防护**：CSRF 令牌
- **SQL 注入防护**：参数化查询
- **文件上传防护**：文件类型和大小验证

## 6. 性能设计

### 6.1 前端性能

- **代码分割**：按需加载
- **图片优化**：响应式图片
- **缓存策略**：浏览器缓存
- **懒加载**：延迟加载非关键资源

### 6.2 后端性能

- **数据库优化**：索引优化
- **API 优化**：响应缓存
- **并发处理**：异步处理
- **负载均衡**：水平扩展

### 6.3 移动端性能

- **内存管理**：资源释放
- **电池优化**：减少后台活动
- **网络优化**：减少请求次数

## 7. 部署架构

### 7.1 部署拓扑

```
┌─────────────────────────────────────────────────┐
│                   负载均衡器                     │
└─────────────────────────────────────────────────┘
          │                 │                 │
          ├─────────────────┼─────────────────┤
          ▼                 ▼                 ▼
┌────────────┐  ┌────────────┐  ┌────────────┐
│ Web 服务器1│  │ Web 服务器2│  │ Web 服务器3│
└────────────┘  └────────────┘  └────────────┘
          │                 │                 │
          └─────────────────┼─────────────────┘
                            ▼
┌─────────────────────────────────────────────────┐
│                   数据库集群                     │
└─────────────────────────────────────────────────┘
          │                 │                 │
          ├─────────────────┼─────────────────┤
          ▼                 ▼                 ▼
┌────────────┐  ┌────────────┐  ┌────────────┐
│ Redis 节点1│  │ Redis 节点2│  │ Redis 节点3│
└────────────┘  └────────────┘  └────────────┘
```

### 7.2 部署环境

| 环境 | 用途 | 配置 |
|------|------|------|
| 开发环境 | 开发测试 | 单服务器 |
| 测试环境 | 功能测试 | 多服务器 |
| 生产环境 | 线上运行 | 集群 |

## 8. 监控与维护

### 8.1 监控指标

- **系统指标**：CPU、内存、磁盘
- **应用指标**：响应时间、错误率
- **业务指标**：活跃用户、游戏数量

### 8.2 日志管理

- **应用日志**：请求日志、错误日志
- **访问日志**：API 访问日志
- **数据库日志**：查询日志

### 8.3 备份策略

| 备份类型 | 频率 | 保留期限 | 存储位置 |
|---------|------|---------|---------|
| 数据库备份 | 每日 | 30天 | 异地存储 |
| 应用备份 | 每周 | 60天 | 本地 + 异地 |
| 配置备份 | 每次变更 | 永久 | 本地 + 异地 |

## 9. 扩展性设计

### 9.1 模块扩展

- **插件系统**：支持第三方插件
- **API 扩展**：易于添加新 API
- **组件扩展**：可复用组件

### 9.2 功能扩展

- **游戏模板**：支持游戏模板
- **多人游戏**：支持多人协作
- **实时同步**：实时协作编辑
- **云存储**：云同步功能

## 10. 技术选型理由

### 10.1 前端框架

- **Next.js**：全栈框架，支持 SSR 和 SSG
- **React**：组件化开发，生态丰富
- **TypeScript**：类型安全，减少错误

### 10.2 后端技术

- **PostgreSQL**：可靠的关系型数据库
- **Prisma**：类型安全的 ORM
- **Next.js API**：与前端集成紧密

### 10.3 移动端

- **Capacitor**：跨平台支持，原生体验
- **Web 技术**：代码复用，开发效率高

### 10.4 存储技术

- **IndexedDB**：浏览器内置，适合本地存储
- **Dexie**：IndexedDB 封装，易用性高
- **pako**：高效的压缩库

## 11. 架构演进路线

### 11.1 短期规划（1-3个月）

- 完善核心功能
- 优化性能
- 提高测试覆盖率

### 11.2 中期规划（3-6个月）

- 添加新功能
- 支持多人协作
- 改进移动端体验

### 11.3 长期规划（6-12个月）

- 支持云同步
- 扩展到更多平台
- 建立插件生态

## 12. 结论

本架构设计文档描述了互动式故事游戏编辑器和播放器系统的架构设计。该架构具有良好的跨平台兼容性、高性能、可扩展性和可靠性。通过清晰的分层设计和模块化结构，系统易于维护和扩展。

该架构设计考虑了安全性、性能、部署和扩展性等方面，为系统的开发和演进提供了良好的基础。
