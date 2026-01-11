# GitLab CI/CD 环境变量配置

## 🔧 必需的环境变量

### 1. Android 签名配置
```bash
# Android 密钥库密码
ANDROID_KEYSTORE_PASSWORD=your_keystore_password_here

# Android 密钥别名密码  
ANDROID_KEY_ALIAS_PASSWORD=your_key_alias_password_here

# 密钥库文件 (需要在GitLab项目设置中上传文件)
# 文件路径: keystore/android-release.keystore
```

### 2. Google Play 发布配置
```bash
# Google Play 服务账号密钥 (JSON格式)
GOOGLE_PLAY_SERVICE_ACCOUNT_KEY={
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "your-private-key-id",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "your-service-account@your-project-id.iam.gserviceaccount.com",
  "client_id": "your-client-id",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/your-service-account%40your-project-id.iam.gserviceaccount.com"
}

# Firebase 应用ID (用于App Distribution)
FIREBASE_APP_ID=your-firebase-app-id
```

### 3. 华为应用市场配置
```bash
# 华为开发者联盟Client ID
HUAWEI_CLIENT_ID=your_huawei_client_id

# 华为开发者联盟Client Secret
HUAWEI_CLIENT_SECRET=your_huawei_client_secret
```

### 4. 通知配置
```bash
# Slack Webhook URL
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK

# 通知邮箱地址
NOTIFICATION_EMAIL=your-email@example.com
```

## 📋 配置步骤

### 1. 在GitLab项目设置中添加变量

1. 进入项目页面 → Settings → CI/CD → Variables
2. 点击 "Add variable" 按钮
3. 添加以下变量：

#### 保护变量 (Protected Variables) - 只在受保护的分支生效
- `ANDROID_KEYSTORE_PASSWORD` - 密钥库密码
- `ANDROID_KEY_ALIAS_PASSWORD` - 密钥别名密码
- `GOOGLE_PLAY_SERVICE_ACCOUNT_KEY` - Google Play服务账号密钥
- `HUAWEI_CLIENT_SECRET` - 华为客户端密钥

#### 普通变量
- `SLACK_WEBHOOK_URL` - Slack通知Webhook
- `NOTIFICATION_EMAIL` - 通知邮箱

### 2. 上传密钥文件

1. 在CI/CD设置页面，找到 "File" 部分
2. 上传以下文件：
   - `android-release.keystore` - Android签名密钥库

### 3. 配置受保护分支

1. 进入 Settings → Repository → Protected branches
2. 保护以下分支：
   - `main` - 主分支，用于生产环境发布
   - `develop` - 开发分支，用于测试环境

## 🔒 安全建议

### 1. 变量保护
- 所有敏感信息都应该设置为保护变量
- 生产环境的密钥只在main分支生效
- 定期更换密钥和密码

### 2. 访问控制
- 限制项目维护者权限
- 启用两步验证
- 监控CI/CD流水线的访问日志

### 3. 密钥管理
- 使用专用服务账号，而非个人账号
- 为不同环境使用不同的密钥
- 密钥泄露时立即更换

## 🚀 流水线触发规则

### 自动触发
- `develop` 分支：构建调试版APK
- `main` 分支：构建发布版APK
- Merge Request：运行测试和代码检查

### 手动触发
- 发布版APK上传到应用商店
- 安全扫描和性能测试
- 生产环境部署

## 📊 环境变量参考表

| 变量名 | 类型 | 必需 | 描述 | 示例 |
|--------|------|------|------|------|
| ANDROID_KEYSTORE_PASSWORD | Protected | ✅ | Android密钥库密码 | MySecurePassword123 |
| ANDROID_KEY_ALIAS_PASSWORD | Protected | ✅ | Android密钥别名密码 | MyKeyAliasPassword456 |
| GOOGLE_PLAY_SERVICE_ACCOUNT_KEY | Protected | ❌ | Google Play服务账号密钥 | JSON格式的服务账号密钥 |
| HUAWEI_CLIENT_ID | Protected | ❌ | 华为开发者联盟Client ID | 123456789 |
| HUAWEI_CLIENT_SECRET | Protected | ❌ | 华为开发者联盟Client Secret | abcdef123456 |
| SLACK_WEBHOOK_URL | Variable | ❌ | Slack通知Webhook URL | https://hooks.slack.com/services/... |
| NOTIFICATION_EMAIL | Variable | ❌ | 通知邮箱地址 | dev-team@example.com |

## 🔧 故障排除

### 常见问题

1. **密钥库文件未找到**
   - 确保已上传密钥库文件到GitLab
   - 检查文件路径是否正确

2. **Google Play上传失败**
   - 验证服务账号密钥是否正确
   - 检查Google Play Console权限设置
   - 确认应用包名和签名匹配

3. **华为应用市场上传失败**
   - 验证Client ID和Client Secret
   - 检查华为开发者账号权限
   - 确认应用信息已完善

4. **Slack通知未收到**
   - 验证Webhook URL是否正确
   - 检查Slack工作区设置
   - 测试Webhook是否可用

### 调试技巧

1. **查看CI/CD日志**
   - 在GitLab项目页面的CI/CD → Pipelines中查看
   - 点击具体Job查看详细日志

2. **本地测试**
   - 使用GitLab Runner本地执行
   - 模拟CI环境进行测试

3. **变量验证**
   - 在脚本中添加echo语句输出变量值
   - 使用gitlab-ci-local工具本地测试

## 🎯 最佳实践

1. **分支策略**
   - 使用Git Flow工作流
   - main分支只接受合并请求
   - develop分支用于日常开发

2. **版本管理**
   - 使用语义化版本号
   - 每个发布版都有对应的tag
   - 维护CHANGELOG文件

3. **测试策略**
   - 单元测试覆盖率>80%
   - 集成测试覆盖主要功能
   - 性能测试确保APK大小合理

4. **发布流程**
   - 先在测试环境验证
   - 逐步发布到生产环境
   - 监控发布后的用户反馈

---

配置完成后，您的GitLab CI/CD流水线将能够自动构建高质量的APK文件，并支持发布到多个应用商店！🚀