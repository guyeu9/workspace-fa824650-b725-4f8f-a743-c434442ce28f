# API 文档

## 1. 概述

本文档描述了互动式故事游戏编辑器和播放器系统的 API 接口。API 基于 REST 架构设计，使用 JSON 格式进行数据交换。

### 1.1 基本信息

- **基础 URL**: `https://yourdomain.com/api`
- **认证方式**: JWT Token
- **请求方法**: GET, POST, PUT, DELETE
- **响应格式**: JSON

### 1.2 状态码

| 状态码 | 描述 |
|-------|------|
| 200 | 成功 |
| 201 | 创建成功 |
| 400 | 请求错误 |
| 401 | 未授权 |
| 403 | 禁止访问 |
| 404 | 资源不存在 |
| 500 | 服务器错误 |

### 1.3 认证

所有需要认证的 API 都需要在请求头中包含以下认证信息：

```
Authorization: Bearer YOUR_TOKEN
```

## 2. 认证 API

### 2.1 用户注册

**端点**: `/api/auth/register`
**方法**: POST
**认证**: 不需要
**描述**: 注册新用户

#### 请求体

```json
{
  "name": "用户名",
  "email": "邮箱",
  "password": "密码"
}
```

#### 响应

```json
{
  "success": true,
  "user": {
    "id": "用户ID",
    "name": "用户名",
    "email": "邮箱",
    "role": "user"
  }
}
```

### 2.2 用户登录

**端点**: `/api/auth/[...nextauth]`
**方法**: POST
**认证**: 不需要
**描述**: 用户登录（使用 NextAuth.js）

#### 请求体

```json
{
  "email": "邮箱",
  "password": "密码"
}
```

#### 响应

```json
{
  "ok": true,
  "url": "回调 URL"
}
```

### 2.3 获取当前用户

**端点**: `/api/auth/session`
**方法**: GET
**认证**: 需要
**描述**: 获取当前用户信息

#### 响应

```json
{
  "user": {
    "name": "用户名",
    "email": "邮箱",
    "image": "头像 URL"
  },
  "expires": "过期时间"
}
```

## 3. 游戏 API

### 3.1 获取游戏列表

**端点**: `/api/games`
**方法**: GET
**认证**: 可选
**描述**: 获取游戏列表，支持分页和过滤

#### 查询参数

| 参数 | 类型 | 描述 | 可选 |
|------|------|------|------|
| page | number | 页码，默认为 1 | 是 |
| limit | number | 每页数量，默认为 10 | 是 |
| search | string | 搜索关键词 | 是 |
| author | string | 作者 ID | 是 |
| tag | string | 标签 | 是 |

#### 响应

```json
{
  "games": [
    {
      "id": "游戏 ID",
      "title": "游戏标题",
      "description": "游戏描述",
      "author": "作者名",
      "tags": ["标签1", "标签2"],
      "createdAt": "创建时间",
      "updatedAt": "更新时间",
      "rating": 4.5,
      "commentCount": 10
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

### 3.2 创建游戏

**端点**: `/api/games`
**方法**: POST
**认证**: 需要
**描述**: 创建新游戏

#### 请求体

```json
{
  "title": "游戏标题",
  "description": "游戏描述",
  "tags": ["标签1", "标签2"],
  "data": {
    "game_title": "游戏标题",
    "branches": [
      {
        "branch_id": "分支 ID",
        "branch_title": "分支标题",
        "content": "分支内容",
        "options": [
          {
            "option_id": "选项 ID",
            "option_text": "选项文本",
            "target_branch_id": "目标分支 ID"
          }
        ]
      }
    ]
  }
}
```

#### 响应

```json
{
  "success": true,
  "game": {
    "id": "游戏 ID",
    "title": "游戏标题",
    "description": "游戏描述",
    "author": "作者 ID",
    "tags": ["标签1", "标签2"],
    "createdAt": "创建时间",
    "updatedAt": "更新时间"
  }
}
```

### 3.3 获取游戏详情

**端点**: `/api/games/:id`
**方法**: GET
**认证**: 可选
**描述**: 获取游戏详情

#### 响应

```json
{
  "game": {
    "id": "游戏 ID",
    "title": "游戏标题",
    "description": "游戏描述",
    "author": "作者 ID",
    "authorName": "作者名",
    "tags": ["标签1", "标签2"],
    "createdAt": "创建时间",
    "updatedAt": "更新时间",
    "rating": 4.5,
    "commentCount": 10,
    "data": {
      "game_title": "游戏标题",
      "branches": [
        {
          "branch_id": "分支 ID",
          "branch_title": "分支标题",
          "content": "分支内容",
          "options": [
            {
              "option_id": "选项 ID",
              "option_text": "选项文本",
              "target_branch_id": "目标分支 ID"
            }
          ]
        }
      ]
    }
  }
}
```

### 3.4 更新游戏

**端点**: `/api/games/:id`
**方法**: PUT
**认证**: 需要
**描述**: 更新游戏信息

#### 请求体

```json
{
  "title": "游戏标题",
  "description": "游戏描述",
  "tags": ["标签1", "标签2"],
  "data": {
    "game_title": "游戏标题",
    "branches": [
      {
        "branch_id": "分支 ID",
        "branch_title": "分支标题",
        "content": "分支内容",
        "options": [
          {
            "option_id": "选项 ID",
            "option_text": "选项文本",
            "target_branch_id": "目标分支 ID"
          }
        ]
      }
    ]
  }
}
```

#### 响应

```json
{
  "success": true,
  "game": {
    "id": "游戏 ID",
    "title": "游戏标题",
    "description": "游戏描述",
    "author": "作者 ID",
    "tags": ["标签1", "标签2"],
    "createdAt": "创建时间",
    "updatedAt": "更新时间"
  }
}
```

### 3.5 删除游戏

**端点**: `/api/games/:id`
**方法**: DELETE
**认证**: 需要
**描述**: 删除游戏

#### 响应

```json
{
  "success": true,
  "message": "游戏删除成功"
}
```

### 3.6 获取游戏评论

**端点**: `/api/games/:id/comments`
**方法**: GET
**认证**: 可选
**描述**: 获取游戏的评论列表

#### 查询参数

| 参数 | 类型 | 描述 | 可选 |
|------|------|------|------|
| page | number | 页码，默认为 1 | 是 |
| limit | number | 每页数量，默认为 10 | 是 |
| sort | string | 排序方式，默认为 createdAt | 是 |
| order | string | 排序顺序，默认为 desc | 是 |

#### 响应

```json
{
  "comments": [
    {
      "id": "评论 ID",
      "gameId": "游戏 ID",
      "userId": "用户 ID",
      "userName": "用户名",
      "content": "评论内容",
      "rating": 5,
      "createdAt": "创建时间"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

### 3.7 添加评论

**端点**: `/api/games/:id/comments`
**方法**: POST
**认证**: 需要
**描述**: 添加游戏评论

#### 请求体

```json
{
  "content": "评论内容",
  "rating": 5
}
```

#### 响应

```json
{
  "success": true,
  "comment": {
    "id": "评论 ID",
    "gameId": "游戏 ID",
    "userId": "用户 ID",
    "content": "评论内容",
    "rating": 5,
    "createdAt": "创建时间"
  }
}
```

### 3.8 游戏投票

**端点**: `/api/games/:id/vote`
**方法**: POST
**认证**: 需要
**描述**: 为游戏投票

#### 请求体

```json
{
  "vote": 1  // 1 表示赞，-1 表示踩
}
```

#### 响应

```json
{
  "success": true,
  "message": "投票成功"
}
```

## 4. 标签 API

### 4.1 获取标签列表

**端点**: `/api/tags`
**方法**: GET
**认证**: 可选
**描述**: 获取所有标签

#### 响应

```json
{
  "tags": [
    {
      "id": "标签 ID",
      "name": "标签名称",
      "gameCount": 10
    }
  ]
}
```

### 4.2 创建标签

**端点**: `/api/tags`
**方法**: POST
**认证**: 需要（管理员）
**描述**: 创建新标签

#### 请求体

```json
{
  "name": "标签名称"
}
```

#### 响应

```json
{
  "success": true,
  "tag": {
    "id": "标签 ID",
    "name": "标签名称"
  }
}
```

## 5. 后台管理 API

### 5.1 获取用户列表

**端点**: `/api/admin/users`
**方法**: GET
**认证**: 需要（管理员）
**描述**: 获取用户列表

#### 查询参数

| 参数 | 类型 | 描述 | 可选 |
|------|------|------|------|
| page | number | 页码，默认为 1 | 是 |
| limit | number | 每页数量，默认为 10 | 是 |
| search | string | 搜索关键词 | 是 |
| role | string | 用户角色 | 是 |

#### 响应

```json
{
  "users": [
    {
      "id": "用户 ID",
      "name": "用户名",
      "email": "邮箱",
      "role": "user",
      "createdAt": "创建时间"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5
  }
}
```

### 5.2 获取用户详情

**端点**: `/api/admin/users/:id`
**方法**: GET
**认证**: 需要（管理员）
**描述**: 获取用户详情

#### 响应

```json
{
  "user": {
    "id": "用户 ID",
    "name": "用户名",
    "email": "邮箱",
    "role": "user",
    "createdAt": "创建时间",
    "updatedAt": "更新时间"
  }
}
```

### 5.3 更新用户

**端点**: `/api/admin/users/:id`
**方法**: PUT
**认证**: 需要（管理员）
**描述**: 更新用户信息

#### 请求体

```json
{
  "name": "用户名",
  "email": "邮箱",
  "role": "admin"
}
```

#### 响应

```json
{
  "success": true,
  "user": {
    "id": "用户 ID",
    "name": "用户名",
    "email": "邮箱",
    "role": "admin"
  }
}
```

### 5.4 删除用户

**端点**: `/api/admin/users/:id`
**方法**: DELETE
**认证**: 需要（管理员）
**描述**: 删除用户

#### 响应

```json
{
  "success": true,
  "message": "用户删除成功"
}
```

### 5.5 获取游戏列表

**端点**: `/api/admin/games`
**方法**: GET
**认证**: 需要（管理员）
**描述**: 获取所有游戏，支持过滤

#### 查询参数

| 参数 | 类型 | 描述 | 可选 |
|------|------|------|------|
| page | number | 页码，默认为 1 | 是 |
| limit | number | 每页数量，默认为 10 | 是 |
| search | string | 搜索关键词 | 是 |
| author | string | 作者 ID | 是 |
| status | string | 状态 | 是 |

#### 响应

```json
{
  "games": [
    {
      "id": "游戏 ID",
      "title": "游戏标题",
      "author": "作者名",
      "status": "published",
      "createdAt": "创建时间",
      "updatedAt": "更新时间"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 120,
    "totalPages": 12
  }
}
```

### 5.6 获取评论列表

**端点**: `/api/admin/comments`
**方法**: GET
**认证**: 需要（管理员）
**描述**: 获取所有评论，支持过滤

#### 查询参数

| 参数 | 类型 | 描述 | 可选 |
|------|------|------|------|
| page | number | 页码，默认为 1 | 是 |
| limit | number | 每页数量，默认为 10 | 是 |
| search | string | 搜索关键词 | 是 |
| gameId | string | 游戏 ID | 是 |
| userId | string | 用户 ID | 是 |

#### 响应

```json
{
  "comments": [
    {
      "id": "评论 ID",
      "gameId": "游戏 ID",
      "gameTitle": "游戏标题",
      "userId": "用户 ID",
      "userName": "用户名",
      "content": "评论内容",
      "rating": 4,
      "createdAt": "创建时间"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 85,
    "totalPages": 9
  }
}
```

### 5.7 删除评论

**端点**: `/api/admin/comments/:id`
**方法**: DELETE
**认证**: 需要（管理员）
**描述**: 删除评论

#### 响应

```json
{
  "success": true,
  "message": "评论删除成功"
}
```

## 5. 上传 API

### 5.1 上传文件

**端点**: `/api/upload`
**方法**: POST
**认证**: 需要
**描述**: 上传文件

#### 请求体

使用 FormData 格式：

```
file: 文件
```

#### 响应

```json
{
  "success": true,
  "file": {
    "id": "文件 ID",
    "name": "文件名",
    "type": "文件类型",
    "size": "文件大小",
    "url": "文件 URL"
  }
}
```

## 6. 错误处理

### 6.1 错误响应格式

所有错误响应都遵循以下格式：

```json
{
  "success": false,
  "error": {
    "code": "错误代码",
    "message": "错误信息",
    "details": "详细错误信息（可选）"
  }
}
```

### 6.2 常见错误代码

| 代码 | 描述 |
|------|------|
| INVALID_REQUEST | 请求无效 |
| UNAUTHORIZED | 未授权 |
| FORBIDDEN | 禁止访问 |
| NOT_FOUND | 资源不存在 |
| VALIDATION_ERROR | 验证错误 |
| SERVER_ERROR | 服务器错误 |

## 7. 最佳实践

1. **请求频率限制**：API 有请求频率限制，请勿滥用
2. **缓存机制**：使用 ETag 或 Last-Modified 头进行缓存
3. **错误处理**：妥善处理各种错误状态码
4. **认证安全**：妥善保管 JWT Token，避免泄露
5. **参数验证**：在客户端进行参数验证，减少无效请求
6. **分页**：使用分页参数，避免一次性获取大量数据

## 8. 示例代码

### 8.1 JavaScript (Fetch API)

```javascript
// 获取游戏列表
async function getGames() {
  const response = await fetch('https://yourdomain.com/api/games', {
    headers: {
      'Authorization': 'Bearer YOUR_TOKEN'
    }
  });
  const data = await response.json();
  console.log(data);
}

// 创建游戏
async function createGame(gameData) {
  const response = await fetch('https://yourdomain.com/api/games', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer YOUR_TOKEN'
    },
    body: JSON.stringify(gameData)
  });
  const data = await response.json();
  console.log(data);
}
```

### 8.2 Python (Requests)

```python
import requests

# 设置认证头
headers = {
    'Authorization': 'Bearer YOUR_TOKEN'
}

# 获取游戏列表
def get_games():
    response = requests.get('https://yourdomain.com/api/games', headers=headers)
    print(response.json())

# 创建游戏
def create_game(game_data):
    response = requests.post(
        'https://yourdomain.com/api/games',
        headers={**headers, 'Content-Type': 'application/json'},
        json=game_data
    )
    print(response.json())
```

## 9. 版本控制

API 使用 URL 路径进行版本控制，例如：

```
https://yourdomain.com/api/v1/games
```

当前版本为 v1。

## 10. 变更日志

### v1.0.0 (2026-01-11)

- 初始版本
- 包含游戏、评论、认证等核心功能

## 11. 联系方式

如果您有任何问题或建议，请联系：

- 邮箱: support@yourdomain.com
- 文档: https://yourdomain.com/docs/api
- 支持论坛: https://forum.yourdomain.com

---

**最后更新**: 2026-01-11