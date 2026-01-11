# 📱 移动端APK打包指南

本指南将帮助您将文字冒险游戏平台打包成Android APK文件。

## 🚀 快速开始

### 1. 环境准备

确保您的开发环境满足以下要求：

#### 必需软件
- **Node.js** (v18.0.0 或更高版本)
- **Java JDK** (v11 或更高版本)
- **Android Studio** (最新版本)
- **Git** (最新版本)

#### 环境变量配置
```bash
# Android SDK路径
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools

# Java路径
export JAVA_HOME=/usr/lib/jvm/java-11-openjdk-amd64
export PATH=$PATH:$JAVA_HOME/bin
```

### 2. 安装依赖

```bash
# 安装Capacitor相关依赖
npm install @capacitor/core @capacitor/cli @capacitor/android

# 安装移动端插件
npm install @capacitor/camera @capacitor/filesystem @capacitor/share
npm install @capacitor/device @capacitor/geolocation @capacitor/haptics
npm install @capacitor/network @capacitor/storage @capacitor/status-bar
npm install @capacitor/splash-screen @capacitor/push-notifications
npm install @capacitor/local-notifications @capacitor/action-sheet
npm install @capacitor/dialog @capacitor/browser @capacitor/app
```

### 3. 构建APK

#### 方法一：使用自动化脚本（推荐）

```bash
# 给脚本执行权限
chmod +x scripts/build-apk.sh

# 构建调试版APK
./scripts/build-apk.sh development debug 1.0.0 1

# 构建发布版APK
./scripts/build-apk.sh production release 1.0.0 1
```

#### 方法二：手动构建

```bash
# 1. 构建Web应用
npm run build

# 2. 同步Capacitor
npx cap sync android

# 3. 打开Android Studio
npx cap open android

# 4. 在Android Studio中构建APK
# Build -> Build Bundle(s) / APK(s) -> Build APK(s)
```

## 📋 配置说明

### Capacitor配置

编辑 `capacitor.config.ts` 文件：

```typescript
const config: CapacitorConfig = {
  appId: 'com.textadventure.app',
  appName: '文字冒险游戏平台',
  webDir: 'out',
  android: {
    path: 'android',
    package: 'com.textadventure.app'
  }
}
```

### 应用签名

#### 生成签名密钥
```bash
keytool -genkey -v \
  -keystore keystore/android-release.keystore \
  -alias text-adventure-key \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

#### 配置签名信息
在 `capacitor.config.ts` 中配置签名信息：

```typescript
android: {
  buildOptions: {
    keystorePath: './keystore/android-release.keystore',
    keystorePassword: 'your-password',
    keystoreAlias: 'text-adventure-key',
    keystoreAliasPassword: 'your-alias-password'
  }
}
```

## 🔧 功能特性

### 已集成功能

1. **PWA支持**
   - Service Worker缓存
   - 离线功能
   - 添加到主屏幕

2. **推送通知**
   - 本地通知
   - 远程推送
   - 通知权限管理

3. **设备功能**
   - 相机访问
   - 文件系统
   - 地理位置
   - 设备信息

4. **用户体验**
   - 触摸手势
   - 振动反馈
   - 全屏模式
   - 状态栏定制

5. **性能优化**
   - 代码混淆
   - 资源压缩
   - 构建缓存
   - 包大小优化

## 📱 移动端专属功能

### 触摸手势
- 左右滑动切换场景
- 双击全屏模式
- 长按显示菜单
- 下拉刷新

### 振动反馈
- 按钮点击反馈
- 操作成功反馈
- 错误提示反馈
- 手势识别反馈

### 离线功能
- 游戏数据缓存
- 离线游玩支持
- 网络状态检测
- 自动同步机制

### 原生集成
- 相机拍照
- 文件选择
- 社交分享
- 应用内浏览器

## 🎨 界面优化

### 移动端UI组件
- 底部导航栏
- 触摸优化按钮
- 滑动操作菜单
- 响应式布局

### 适配优化
- iOS安全区域
- Android导航栏
- 横竖屏适配
- 不同尺寸屏幕

## 🔒 安全与权限

### 权限配置
在 `android/app/src/main/AndroidManifest.xml` 中配置：

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.VIBRATE" />
<uses-permission android:name="android.permission.WAKE_LOCK" />
```

### ProGuard配置
代码混淆规则在 `android/proguard-rules.pro` 中配置。

## 📊 性能优化

### 包大小优化
1. **资源压缩**
   - 图片压缩
   - 代码混淆
   - 无用资源移除

2. **构建优化**
   - R8代码压缩
   - 资源收缩
   - 分包构建

3. **运行时优化**
   - 懒加载
   - 缓存策略
   - 内存管理

### 启动速度优化
1. **启动画面**
   - 自定义启动图
   - 加载进度显示
   - 预加载关键资源

2. **代码优化**
   - 减少初始化时间
   - 异步加载资源
   - 延迟加载非关键组件

## 🚀 发布流程

### 1. 测试阶段
```bash
# 构建测试版本
./scripts/build-apk.sh staging debug 1.0.0-beta.1 100

# 安装到设备
adb install release/android/TextAdventure-v1.0.0-beta.1-debug.apk
```

### 2. 内部测试
- 使用Firebase App Distribution
- 创建测试用户组
- 收集反馈和崩溃报告

### 3. 发布准备
```bash
# 构建发布版本
./scripts/build-apk.sh production release 1.0.0 1000

# 生成签名报告
keytool -list -v -keystore keystore/android-release.keystore
```

### 4. 应用商店发布
- Google Play Console
- 华为应用市场
- 其他第三方应用商店

## 📋 常见问题

### Q: 构建失败怎么办？
A: 检查以下项目：
- Java版本是否正确
- Android SDK是否完整
- 环境变量是否配置
- 依赖是否安装完整

### Q: APK安装失败？
A: 可能原因：
- 签名配置错误
- 权限未声明
- 目标SDK版本不兼容
- 设备系统版本过低

### Q: 如何减小APK大小？
A: 优化方法：
- 启用代码混淆
- 压缩图片资源
- 移除无用依赖
- 使用WebP格式图片

### Q: 推送通知无法接收？
A: 检查配置：
- Firebase配置是否正确
- 权限是否声明
- 设备网络状态
- 应用通知权限

## 🔧 调试工具

### Android Studio
- Logcat日志查看
- 性能分析器
- 网络监控器
- 内存分析器

### Chrome DevTools
- 远程调试WebView
- 性能分析
- 网络请求监控
- 控制台日志

### 命令行工具
```bash
# 查看设备日志
adb logcat

# 安装APK
adb install app.apk

# 卸载应用
adb uninstall com.textadventure.app

# 查看应用信息
adb shell dumpsys package com.textadventure.app
```

## 📚 相关文档

- [Capacitor官方文档](https://capacitorjs.com/docs)
- [Android开发者文档](https://developer.android.com/docs)
- [Next.js移动端优化](https://nextjs.org/docs/basic-features/built-in-css-support)
- [PWA官方指南](https://web.dev/progressive-web-apps/)

## 🆘 技术支持

如遇到问题，请：
1. 查看构建日志
2. 检查配置文件
3. 搜索相关文档
4. 联系技术支持

---

**祝您打包顺利！🎉**