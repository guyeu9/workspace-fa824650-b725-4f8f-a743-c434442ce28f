# GitLab CI/CD 本地测试脚本 (PowerShell版本)
# 用于在Windows环境测试GitLab CI/CD流水线

param(
    [string]$Command = "help",
    [string]$Environment = "development",
    [string]$BuildType = "debug",
    [string]$Version = "1.0.0",
    [string]$BuildNumber = "1"
)

# 颜色定义
$Colors = @{
    Red = "Red"
    Green = "Green"
    Yellow = "Yellow"
    Blue = "Blue"
    Cyan = "Cyan"
}

function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

# 检查依赖
function Test-Dependencies {
    Write-ColorOutput "🔍 检查依赖..." $Colors.Yellow
    
    # 检查Docker
    try {
        $dockerVersion = docker --version
        Write-ColorOutput "✅ Docker 已安装: $dockerVersion" $Colors.Green
    } catch {
        Write-ColorOutput "❌ 错误: Docker 未安装" $Colors.Red
        Write-ColorOutput "请安装Docker: https://docs.docker.com/get-docker/" $Colors.Red
        exit 1
    }
    
    # 检查Node.js
    try {
        $nodeVersion = node --version
        Write-ColorOutput "✅ Node.js 已安装: $nodeVersion" $Colors.Green
    } catch {
        Write-ColorOutput "❌ 错误: Node.js 未安装" $Colors.Red
        Write-ColorOutput "请安装Node.js: https://nodejs.org/" $Colors.Red
        exit 1
    }
    
    Write-ColorOutput "✅ 依赖检查完成" $Colors.Green
}

# 设置环境变量
function Set-Environment {
    Write-ColorOutput "🔧 设置环境变量..." $Colors.Yellow
    
    $env:NODE_ENV = $Environment
    $env:NEXT_PUBLIC_APP_VERSION = $Version
    $env:NEXT_PUBLIC_BUILD_TYPE = $BuildType
    $env:ANDROID_KEYSTORE_PASSWORD = "test-password"
    $env:ANDROID_KEY_ALIAS_PASSWORD = "test-alias-password"
    $env:SLACK_WEBHOOK_URL = "https://hooks.slack.com/services/test/webhook"
    $env:NOTIFICATION_EMAIL = "test@example.com"
    
    Write-ColorOutput "✅ 环境变量设置完成" $Colors.Green
}

# 构建Web应用
function Invoke-BuildWeb {
    Write-ColorOutput "🚀 构建Web应用..." $Colors.Yellow
    
    try {
        # 清理之前的构建
        if (Test-Path "out") {
            Remove-Item -Recurse -Force "out"
        }
        
        # 安装依赖
        Write-ColorOutput "📦 安装依赖..." $Colors.Cyan
        npm ci
        
        # 构建应用
        Write-ColorOutput "🔨 构建应用..." $Colors.Cyan
        npm run build
        
        # 验证构建结果
        if (Test-Path "out") {
            Write-ColorOutput "✅ Web应用构建完成" $Colors.Green
        } else {
            throw "构建失败: out目录未生成"
        }
    }
    catch {
        Write-ColorOutput "❌ Web应用构建失败: $_" $Colors.Red
        exit 1
    }
}

# 运行单元测试
function Invoke-TestUnit {
    Write-ColorOutput "🧪 运行单元测试..." $Colors.Yellow
    
    try {
        # 安装依赖
        npm ci
        
        # 运行测试
        npm test -- --coverage --watchAll=false
        
        Write-ColorOutput "✅ 单元测试通过" $Colors.Green
    } catch {
        Write-ColorOutput "❌ 单元测试失败: $_" $Colors.Red
        exit 1
    }
}

# 构建调试版APK
function Invoke-PackageApkDebug {
    Write-ColorOutput "📱 构建调试版APK..." $Colors.Yellow
    
    try {
        # 使用Docker容器模拟构建环境
        $dockerCommand = @"
docker run --rm `
    -v ${PWD}:/workspace `
    -w /workspace `
    -e NODE_ENV=production `
    node:18 bash -c "
            echo '安装依赖...' &&
            npm ci &&
            npm run build &&
            echo '✅ 调试版APK构建完成（模拟）'
        "
"@
        
        Invoke-Expression $dockerCommand
        
        # 创建发布目录
        New-Item -ItemType Directory -Force -Path "release\apk"
        
        # 创建模拟APK文件
        "模拟APK文件" | Out-File -FilePath "release\apk\TextAdventure-debug-$($env:USERNAME).apk" -Encoding UTF8
        
        Write-ColorOutput "✅ 调试版APK构建完成" $Colors.Green
    }
    catch {
        Write-ColorOutput "❌ 调试版APK构建失败: $_" $Colors.Red
        exit 1
    }
}

# 构建发布版APK
function Invoke-PackageApkRelease {
    Write-ColorOutput "📱 构建发布版APK..." $Colors.Yellow
    
    try {
        # 检查或生成签名密钥
        if (!(Test-Path "keystore\android-release.keystore")) {
            Write-ColorOutput "🔑 生成测试签名密钥..." $Colors.Cyan
            New-Item -ItemType Directory -Force -Path "keystore"
            
            # 生成密钥（使用Java的keytool）
            $keytoolPath = "$env:JAVA_HOME\bin\keytool.exe"
            if (!(Test-Path $keytoolPath)) {
                # 尝试使用系统PATH中的keytool
                $keytoolPath = "keytool"
            }
            
            & $keytoolPath -genkey -v `
                -keystore keystore/android-release.keystore `
                -alias text-adventure-key `
                -keyalg RSA `
                -keysize 2048 `
                -validity 10000 `
                -storepass android `
                -keypass android `
                -dname "CN=Test, OU=Test, O=Test, L=Test, S=Test, C=CN"
        }
        
        # 使用Docker容器模拟构建环境
        $dockerCommand = @"
docker run --rm `
    -v ${PWD}:/workspace `
    -w /workspace `
    -e ANDROID_KEYSTORE_PASSWORD=android `
    -e ANDROID_KEY_ALIAS_PASSWORD=android `
    -e NODE_ENV=production `
    node:18 bash -c "
            echo '安装依赖...' &&
            npm ci &&
            npm run build &&
            echo '✅ 发布版APK构建完成（模拟）'
        "
"@
        
        Invoke-Expression $dockerCommand
        
        # 创建发布目录
        New-Item -ItemType Directory -Force -Path "release\apk"
        
        # 创建模拟APK文件
        "模拟发布版APK文件" | Out-File -FilePath "release\apk\TextAdventure-release-$Version.apk" -Encoding UTF8
        
        # 生成签名信息
        "签名信息模拟" | Out-File -FilePath "release\apk\signing-info.txt" -Encoding UTF8
        
        Write-ColorOutput "✅ 发布版APK构建完成" $Colors.Green
    }
    catch {
        Write-ColorOutput "❌ 发布版APK构建失败: $_" $Colors.Red
        exit 1
    }
}

# 运行完整流水线
function Invoke-Pipeline {
    Write-ColorOutput "🚀 运行完整CI/CD流水线..." $Colors.Blue
    
    $stages = @(
        @{ Name = "构建Web应用"; Function = "Invoke-BuildWeb" },
        @{ Name = "运行单元测试"; Function = "Invoke-TestUnit" },
        @{ Name = "构建调试版APK"; Function = "Invoke-PackageApkDebug" }
    )
    
    foreach ($stage in $stages) {
        Write-ColorOutput "========================================" $Colors.Blue
        Write-ColorOutput "执行阶段: $($stage.Name)" $Colors.Blue
        Write-ColorOutput "========================================" $Colors.Blue
        
        try {
            & $stage.Function
            Write-ColorOutput "✅ 阶段 $($stage.Name) 完成" $Colors.Green
            Write-Host ""
        }
        catch {
            Write-ColorOutput "❌ 流水线失败在阶段: $($stage.Name)" $Colors.Red
            Write-ColorOutput "错误: $_" $Colors.Red
            exit 1
        }
    }
    
    Write-ColorOutput "🎉 完整流水线执行完成！" $Colors.Green
}

# 显示使用帮助
function Show-Help {
    Write-ColorOutput "GitLab CI/CD 本地测试工具 (PowerShell版本)" $Colors.Blue
    Write-ColorOutput "==================================" $Colors.Blue
    Write-Host ""
    Write-ColorOutput "使用方法:" $Colors.White
    Write-ColorOutput "  .\scripts\test-gitlab-ci.ps1 [命令] [选项]" $Colors.White
    Write-Host ""
    Write-ColorOutput "命令:" $Colors.White
    Write-ColorOutput "  setup      - 设置测试环境" $Colors.White
    Write-ColorOutput "  build      - 运行构建阶段" $Colors.White
    Write-ColorOutput "  test       - 运行测试阶段" $Colors.White
    Write-ColorOutput "  package    - 运行打包阶段" $Colors.White
    Write-ColorOutput "  pipeline   - 运行完整流水线" $Colors.White
    Write-ColorOutput "  help       - 显示帮助信息" $Colors.White
    Write-Host ""
    Write-ColorOutput "选项:" $Colors.White
    Write-ColorOutput "  -Environment    环境类型 (development|staging|production)" $Colors.White
    Write-ColorOutput "  -BuildType      构建类型 (debug|release)" $Colors.White
    Write-ColorOutput "  -Version        版本号" $Colors.White
    Write-ColorOutput "  -BuildNumber    构建编号" $Colors.White
    Write-Host ""
    Write-ColorOutput "示例:" $Colors.White
    Write-ColorOutput "  .\scripts\test-gitlab-ci.ps1 setup" $Colors.White
    Write-ColorOutput "  .\scripts\test-gitlab-ci.ps1 build" $Colors.White
    Write-ColorOutput "  .\scripts\test-gitlab-ci.ps1 pipeline -Environment staging -BuildType release" $Colors.White
}

# 主函数
function Main {
    Write-ColorOutput "🚀 GitLab CI/CD 本地测试工具" $Colors.Blue
    Write-ColorOutput "==================================" $Colors.Blue
    
    switch ($Command.ToLower()) {
        "setup" {
            Test-Dependencies
            Set-Environment
            Write-ColorOutput "✅ 测试环境设置完成" $Colors.Green
        }
        "build" {
            Test-Dependencies
            Set-Environment
            Invoke-BuildWeb
        }
        "test" {
            Test-Dependencies
            Set-Environment
            Invoke-TestUnit
        }
        "package" {
            Test-Dependencies
            Set-Environment
            Invoke-PackageApkDebug
        }
        "pipeline" {
            Test-Dependencies
            Set-Environment
            Invoke-Pipeline
        }
        "help" {
            Show-Help
        }
        default {
            Write-ColorOutput "❌ 未知命令: $Command" $Colors.Red
            Show-Help
        }
    }
}
    }
}

# 运行主函数
Main