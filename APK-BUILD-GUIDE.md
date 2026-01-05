# APK 构建指南

## 当前状态

✅ 已完成：
1. 安装 Capacitor 依赖包
2. 初始化 Capacitor 配置
3. 添加 Android 平台
4. 构建 Next.js 静态应用
5. 同步到 Android 项目
6. 配置 PWA（渐进式Web应用）
7. 创建 GitHub Actions 自动构建工作流

❌ 待完成：
8. 构建 APK 安装包（需要 Java JDK 或使用 GitHub Actions）

## 快速解决方案

### 方案 1：使用 PWA（推荐，无需Java）

PWA（Progressive Web App）可以直接安装到手机，体验类似原生应用：

1. **部署静态网站**：
   - 将 `out` 文件夹部署到任何静态网站托管服务（如 Vercel、Netlify、GitHub Pages）
   - 或使用本地服务器：`npx serve out`

2. **在手机上安装**：
   - 使用手机浏览器访问部署的网站
   - 浏览器会提示"添加到主屏幕"
   - 点击添加，应用将像原生应用一样运行

**优点**：
- 无需安装 Java 或 Android SDK
- 无需构建 APK
- 跨平台支持（Android、iOS）
- 更新方便，只需更新网站

### 方案 2：使用 GitHub Actions 自动构建（推荐）

**优势**：
- ✅ 无需本地安装 Java 或 Android SDK
- ✅ 自动化构建流程
- ✅ 可重复构建
- ✅ 免费使用

#### 步骤 1：推送代码到 GitHub

代码已经推送到仓库：https://github.com/guyeu9/workspace-fa824650-b725-4f8f-a743-c434442ce28f

#### 步骤 2：启用 GitHub Actions

1. 访问 GitHub 仓库页面
2. 点击 "Actions" 标签页
3. 如果是第一次使用，点击 "I understand my workflows, go ahead and enable them"

#### 步骤 3：触发构建

有两种方式触发构建：

**方式 A：手动触发（推荐）**
1. 在 Actions 页面，选择 "Build Android APK" 工作流
2. 点击右侧的 "Run workflow" 按钮
3. 选择分支（main）
4. 点击绿色的 "Run workflow" 按钮
5. 等待构建完成（通常需要 5-10 分钟）

**方式 B：自动触发**
- 直接推送代码到 main 分支会自动触发构建
- 或者创建 Pull Request 到 main 分支

#### 步骤 4：下载 APK

1. 构建完成后，点击最新的工作流运行记录
2. 滚动到页面底部的 "Artifacts" 部分
3. 点击 "app-debug" 下载 APK 文件
4. 解压下载的 zip 文件，里面包含 `app-debug.apk`

#### 步骤 5：安装 APK

1. 将 APK 文件传输到 Android 手机
2. 在手机上启用"未知来源"安装权限
3. 点击 APK 文件进行安装

**构建过程说明**：
- GitHub Actions 会自动：
  - 安装 Node.js 20
  - 安装项目依赖
  - 构建静态网站
  - 安装 Java 17
  - 安装 Android SDK
  - 构建 Debug APK
  - 上传 APK 文件

**查看构建日志**：
- 在 Actions 页面点击具体的工作流运行
- 可以查看详细的构建日志
- 如果构建失败，日志会显示错误信息

### 方案 3：本地构建（需要 Java JDK）

### 1. 安装 Java JDK (JDK 17 或更高版本)

**Windows 系统：**

#### 选项 A：使用 Chocolatey（推荐）
```powershell
choco install openjdk17
```

#### 选项 B：手动下载安装
1. 访问 [Oracle JDK 下载页面](https://www.oracle.com/java/technologies/downloads/#java17)
2. 下载 Windows x64 Installer
3. 运行安装程序，按照提示完成安装
4. 设置环境变量：
   - 新建系统变量 `JAVA_HOME`，值为 JDK 安装路径（如：`C:\Program Files\Java\jdk-17`）
   - 将 `%JAVA_HOME%\bin` 添加到 `Path` 环境变量

#### 选项 C：使用 OpenJDK（免费开源）
1. 访问 [Adoptium](https://adoptium.net/)
2. 下载 Temurin JDK 17 (LTS) for Windows x64
3. 安装并配置环境变量

### 2. 验证 Java 安装

打开新的 PowerShell 窗口，运行：
```powershell
java -version
```

应该看到类似输出：
```
openjdk version "17.x.x" 2023-xx-xx
OpenJDK Runtime Environment ...
OpenJDK 64-Bit Server VM ...
```

### 3. 设置 ANDROID_HOME 环境变量（可选）

如果需要使用 Android Studio，还需要：
1. 下载并安装 [Android Studio](https://developer.android.com/studio)
2. 设置 `ANDROID_HOME` 环境变量指向 Android SDK 路径

## 构建 APK 的步骤

### 方法 1：使用 Gradle 命令行（推荐）

在项目根目录运行：

```powershell
cd android
.\gradlew.bat assembleDebug
```

构建完成后，APK 文件位于：
```
android\app\build\outputs\apk\debug\app-debug.apk
```

### 方法 2：使用 Android Studio

1. 打开 Android Studio
2. 选择 "Open an Existing Project"
3. 选择项目的 `android` 文件夹
4. 等待 Gradle 同步完成
5. 点击菜单：Build → Build Bundle(s) / APK(s) → Build APK(s)
6. 构建完成后，点击通知中的 "locate" 查看APK文件

## 构建发布版本（Release APK）

### 1. 配置签名密钥

在 `android/app/build.gradle` 中配置签名：

```gradle
android {
    signingConfigs {
        release {
            storeFile file("your-keystore.jks")
            storePassword "your-store-password"
            keyAlias "your-key-alias"
            keyPassword "your-key-password"
        }
    }
    
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

### 2. 生成密钥库

```powershell
keytool -genkey -v -keystore your-keystore.jks -keyalg RSA -keysize 2048 -validity 10000 -alias your-key-alias
```

### 3. 构建发布版本

```powershell
cd android
.\gradlew.bat assembleRelease
```

发布版本APK位于：
```
android\app\build\outputs\apk\release\app-release.apk
```

## 常见问题

### 问题 1：JAVA_HOME 未设置

**错误信息：**
```
ERROR: JAVA_HOME is not set and no 'java' command could be found in your PATH.
```

**解决方案：**
1. 确认 Java JDK 已安装
2. 设置 JAVA_HOME 环境变量
3. 将 %JAVA_HOME%\bin 添加到 Path
4. 重启 PowerShell

### 问题 2：Gradle 构建失败

**解决方案：**
```powershell
cd android
.\gradlew.bat clean
.\gradlew.bat assembleDebug
```

### 问题 3：依赖下载缓慢

**解决方案：**
在 `android/build.gradle` 中添加国内镜像源：

```gradle
allprojects {
    repositories {
        maven { url 'https://maven.aliyun.com/repository/public/' }
        maven { url 'https://maven.aliyun.com/repository/google/' }
        google()
        mavenCentral()
    }
}
```

## 快速开始命令总结

```powershell
# 1. 安装 Java JDK（见上文）
# 2. 验证安装
java -version

# 3. 构建 APK
cd android
.\gradlew.bat assembleDebug

# 4. 查找 APK 文件
# 位于：android\app\build\outputs\apk\debug\app-debug.apk
```

## 项目配置信息

- **应用名称**: Text Adventure Game
- **包名**: com.game.textadventure
- **最低 SDK**: API 21 (Android 5.0)
- **目标 SDK**: API 34 (Android 14)

## 注意事项

1. Debug APK 仅用于测试，不能发布到应用商店
2. 发布到应用商店需要使用 Release APK 并进行签名
3. 首次构建可能需要较长时间下载依赖
4. 确保网络连接稳定，Gradle 需要下载依赖包

## 下一步

完成 Java 安装后，运行以下命令构建 APK：

```powershell
cd android
.\gradlew.bat assembleDebug
```

构建成功后，APK 文件将位于：
```
android\app\build\outputs\apk\debug\app-debug.apk
```
