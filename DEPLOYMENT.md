# 部署文档

## 1. 概述

本文档描述了互动式故事游戏编辑器和播放器系统的部署流程。系统支持多种部署方式，包括 Web 部署、Android 部署和 CI/CD 自动化部署。

## 2. 环境要求

### 2.1 Web 部署

| 组件 | 版本要求 |
|------|----------|
| Node.js | 18.x 或更高 |
| npm | 9.x 或更高 |
| PostgreSQL | 14.x 或更高 |
| Redis | 7.x 或更高（可选） |
| Git | 2.x 或更高 |

### 2.2 Android 部署

| 组件 | 版本要求 |
|------|----------|
| Java | 17.x 或更高 |
| Android Studio | Giraffe 或更高 |
| Gradle | 8.x 或更高 |
| Android SDK | 33 或更高 |
| NDK | 25.x 或更高 |

### 2.3 CI/CD 部署

| 组件 | 版本要求 |
|------|----------|
| GitLab CI | 16.x 或更高 |
| Docker | 24.x 或更高（可选） |
| Docker Compose | 2.x 或更高（可选） |

## 3. Web 部署

### 3.1 手动部署

#### 3.1.1 克隆仓库

```bash
git clone https://your-repo-url.git
echo "进入项目目录"
cd project-directory
```

#### 3.1.2 安装依赖

```bash
echo "安装依赖"
npm install
```

#### 3.1.3 配置环境变量

创建 `.env.local` 文件：

```env
# 数据库配置
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"

# NextAuth 配置
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# 上传配置
MAX_FILE_SIZE=10485760

# API 配置
API_PREFIX="/api"
```

#### 3.1.4 初始化数据库

```bash
echo "初始化数据库"
npx prisma migrate dev
npx prisma db seed
```

#### 3.1.5 构建项目

```bash
echo "构建项目"
npm run build
```

#### 3.1.6 启动服务器

```bash
echo "启动服务器"
npm run start
```

### 3.2 Docker 部署

#### 3.2.1 准备 Docker 配置

创建 `docker-compose.yml` 文件：

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/app_db
      - NEXTAUTH_SECRET=your-secret-key
      - NEXTAUTH_URL=http://localhost:3000
    depends_on:
      - db
    volumes:
      - .:/app
      - /app/node_modules

  db:
    image: postgres:14
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=app_db
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

#### 3.2.2 构建和启动容器

```bash
docker-compose up -d --build
```

#### 3.2.3 初始化数据库

```bash
docker-compose exec app npx prisma migrate dev
```

## 4. Android 部署

### 4.1 环境配置

1. **安装 Android Studio**
   - 下载并安装 [Android Studio](https://developer.android.com/studio)
   - 安装 Android SDK 33 及以上
   - 安装 NDK 25.x 及以上

2. **配置环境变量**

   ```bash
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/build-tools/33.0.0
   ```

### 4.2 构建 APK

#### 4.2.1 调试版 APK

```bash
npm run build:android:debug
```

#### 4.2.2 发布版 APK

1. **配置签名密钥**
   创建 `android/key.properties` 文件：
   ```properties
   storePassword=your-store-password
   keyPassword=your-key-password
   keyAlias=your-key-alias
   storeFile=/path/to/your/keystore.jks
   ```

2. **构建发布版 APK**
   ```bash
   npm run build:android:release
   ```

### 4.3 安装 APK

```bash
adb install app/build/outputs/apk/debug/app-debug.apk  # 调试版
adb install app/build/outputs/apk/release/app-release.apk  # 发布版
```

## 5. CI/CD 部署

### 5.1 GitLab CI 配置

项目已配置了完整的 CI/CD 流水线，位于 `.gitlab-ci.yml` 文件。流水线包含以下阶段：

1. **install** - 安装依赖
2. **build** - 构建项目
3. **test** - 运行测试
4. **package** - 打包 APK
5. **deploy** - 部署到生产环境

### 5.2 环境变量配置

在 GitLab 项目设置中配置以下环境变量：

| 变量名 | 描述 | 示例 |
|--------|------|------|
| ANDROID_KEYSTORE_BASE64 | Base64 编码的密钥库文件 | ... |
| ANDROID_KEYSTORE_PASSWORD | 密钥库密码 | ... |
| ANDROID_KEY_ALIAS | 密钥别名 | ... |
| ANDROID_KEY_PASSWORD | 密钥密码 | ... |
| DATABASE_URL | 数据库连接 URL | postgresql://... |
| NEXTAUTH_SECRET | NextAuth 密钥 | ... |
| NEXTAUTH_URL | NextAuth URL | https://... |

### 5.3 流水线触发

流水线会在以下情况下自动触发：

1. 推送到 `main` 分支 - 部署到生产环境
2. 推送到 `develop` 分支 - 部署到测试环境
3. 手动触发 - 可以选择部署环境

## 6. 数据库配置

### 6.1 PostgreSQL 配置

#### 6.1.1 安装 PostgreSQL

**Ubuntu/Debian**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
```

**CentOS/RHEL**
```bash
sudo dnf install postgresql-server postgresql-contrib
sudo postgresql-setup --initdb
sudo systemctl enable postgresql
sudo systemctl start postgresql
```

#### 6.1.2 创建数据库和用户

```bash
sudo -u postgres psql
CREATE DATABASE app_db;
CREATE USER app_user WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE app_db TO app_user;
ALTER DATABASE app_db OWNER TO app_user;
\q
```

#### 6.1.3 配置远程访问

编辑 `postgresql.conf` 文件：
```bash
sudo nano /etc/postgresql/14/main/postgresql.conf
```

将以下行取消注释并修改：
```
listen_addresses = '*'
```

编辑 `pg_hba.conf` 文件：
```bash
sudo nano /etc/postgresql/14/main/pg_hba.conf
```

添加以下行：
```
host    all             all             0.0.0.0/0               scram-sha-256
```

重启 PostgreSQL：
```bash
sudo systemctl restart postgresql
```

### 6.2 Redis 配置（可选）

#### 6.2.1 安装 Redis

**Ubuntu/Debian**
```bash
sudo apt update
sudo apt install redis-server
```

**CentOS/RHEL**
```bash
sudo dnf install redis
sudo systemctl enable redis
sudo systemctl start redis
```

#### 6.2.2 配置 Redis

编辑 `redis.conf` 文件：
```bash
sudo nano /etc/redis/redis.conf
```

修改以下配置（可选）：
```
bind 0.0.0.0  # 允许远程访问
requirepass your_password  # 设置密码
maxmemory 1gb  # 设置最大内存
maxmemory-policy allkeys-lru  # 设置内存淘汰策略
```

重启 Redis：
```bash
sudo systemctl restart redis
```

## 7. 监控和维护

### 7.1 日志管理

#### 7.1.1 应用日志

```bash
# 查看应用日志
npm run logs

# 查看最近 100 行日志
npm run logs -- --tail 100
```

#### 7.1.2 服务器日志

**Nginx/Apache**
```bash
# Nginx 日志
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Apache 日志
sudo tail -f /var/log/apache2/access.log
sudo tail -f /var/log/apache2/error.log
```

#### 7.1.3 数据库日志

```bash
# PostgreSQL 日志
sudo tail -f /var/log/postgresql/postgresql-14-main.log

# Redis 日志
sudo tail -f /var/log/redis/redis-server.log
```

### 7.2 性能监控

#### 7.2.1 系统监控

使用以下工具监控系统性能：
- **htop** - 实时监控 CPU 和内存使用情况
- **iostat** - 监控磁盘 I/O
- **vmstat** - 监控虚拟内存
- **netstat** - 监控网络连接

#### 7.2.2 应用监控

使用以下工具监控应用性能：
- **New Relic** - 应用性能监控
- **Datadog** - 全面的监控解决方案
- **Sentry** - 错误监控和追踪

## 8. 常见问题和解决方案

### 8.1 Web 部署问题

#### 8.1.1 构建失败

**问题**：`npm run build` 失败

**解决方案**：
1. 检查 Node.js 和 npm 版本
2. 清除依赖并重新安装
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```
3. 检查环境变量配置
4. 查看详细错误信息

#### 8.1.2 数据库连接失败

**问题**：无法连接到 PostgreSQL

**解决方案**：
1. 检查数据库服务是否运行
2. 检查数据库连接 URL
3. 检查数据库用户权限
4. 检查防火墙设置

### 8.2 Android 部署问题

#### 8.2.1 构建 APK 失败

**问题**：`npm run build:android` 失败

**解决方案**：
1. 检查 Java 和 Android SDK 版本
2. 检查 `key.properties` 配置
3. 清理构建缓存
   ```bash
   cd android
   ./gradlew clean
   cd ..
   ```
4. 检查 Android Studio 配置

#### 8.2.2 安装 APK 失败

**问题**：`adb install` 失败

**解决方案**：
1. 检查设备是否连接
   ```bash
   adb devices
   ```
2. 检查设备是否开启 USB 调试
3. 检查 APK 文件是否存在
4. 检查设备存储空间

### 8.3 CI/CD 部署问题

#### 8.3.1 流水线失败

**问题**：GitLab CI 流水线失败

**解决方案**：
1. 查看流水线日志
2. 检查环境变量配置
3. 检查依赖安装
4. 检查构建脚本

#### 8.3.2 APK 签名失败

**问题**：APK 签名过程失败

**解决方案**：
1. 检查密钥库文件和密码
2. 检查 `key.properties` 配置
3. 检查 GitLab 环境变量

## 9. 备份和恢复

### 9.1 数据库备份

**PostgreSQL 备份**
```bash
pg_dump -U app_user -d app_db -f backup.sql
```

**PostgreSQL 恢复**
```bash
psql -U app_user -d app_db -f backup.sql
```

### 9.2 应用数据备份

**备份游戏数据**
```bash
# 导出游戏数据
node scripts/export-games.js > games-export.json
```

**恢复游戏数据**
```bash
# 导入游戏数据
node scripts/import-games.js < games-export.json
```

## 10. 安全最佳实践

### 10.1 Web 安全

1. 使用 HTTPS 加密传输
2. 配置合适的 CORS 策略
3. 定期更新依赖
4. 使用安全的密码策略
5. 配置合适的防火墙规则

### 10.2 数据库安全

1. 使用强密码
2. 限制数据库用户权限
3. 定期备份数据库
4. 配置 SSL 连接
5. 定期更新数据库版本

### 10.3 服务器安全

1. 定期更新系统补丁
2. 关闭不必要的服务
3. 使用防火墙限制访问
4. 配置 SSH 密钥认证
5. 定期检查日志

## 11. 版本更新

### 11.1 更新步骤

1. **拉取最新代码**
   ```bash
   git pull origin main
   ```

2. **安装新依赖**
   ```bash
   npm install
   ```

3. **更新数据库**
   ```bash
   npx prisma migrate dev
   ```

4. **构建项目**
   ```bash
   npm run build
   ```

5. **重启服务器**
   ```bash
   pm2 restart app  # 如果使用 PM2
   # 或
   systemctl restart your-service  # 如果使用 systemd
   ```

### 11.2 回滚步骤

1. **切换到旧版本**
   ```bash
   git checkout <旧版本哈希>
   ```

2. **安装旧依赖**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **回滚数据库**
   ```bash
   npx prisma migrate reset
   ```

4. **构建和重启**
   ```bash
   npm run build
   pm2 restart app
   ```

## 12. 结论

本文档提供了互动式故事游戏编辑器和播放器系统的完整部署指南。通过遵循本文档的步骤，您可以成功部署系统到各种环境中。

如果您在部署过程中遇到任何问题，请参考常见问题部分或联系技术支持。

---

**最后更新**: 2026-01-11