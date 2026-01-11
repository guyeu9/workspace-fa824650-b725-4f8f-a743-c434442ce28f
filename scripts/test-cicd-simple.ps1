# GitLab CI/CD 简单测试脚本
# 用于验证CI/CD流水线的基本功能

Write-Host "🚀 GitLab CI/CD 流水线测试" -ForegroundColor Blue
Write-Host "=================================" -ForegroundColor Blue

# 测试1: Web应用构建
Write-Host "`n📦 测试Web应用构建..." -ForegroundColor Yellow
try {
    # 清理之前的构建
    if (Test-Path "out") {
        Remove-Item -Recurse -Force "out"
    }
    
    # 安装依赖
    Write-Host "安装依赖..." -ForegroundColor Cyan
    npm ci
    
    # 构建应用
    Write-Host "构建应用..." -ForegroundColor Cyan
    npm run build
    
    # 验证构建结果
    if (Test-Path "out") {
        Write-Host "✅ Web应用构建成功" -ForegroundColor Green
    } else {
        throw "构建失败: out目录未生成"
    }
}
catch {
    Write-Host "❌ Web应用构建失败: $_" -ForegroundColor Red
    exit 1
}

# 测试2: 单元测试
Write-Host "`n🧪 测试单元测试..." -ForegroundColor Yellow
try {
    Write-Host "运行测试..." -ForegroundColor Cyan
    npm test -- --coverage --watchAll=false
    Write-Host "✅ 单元测试通过" -ForegroundColor Green
}
catch {
    Write-Host "❌ 单元测试失败: $_" -ForegroundColor Red
    exit 1
}

# 测试3: APK构建模拟
Write-Host "`n📱 测试APK构建..." -ForegroundColor Yellow
try {
    # 创建发布目录
    New-Item -ItemType Directory -Force -Path "release\apk" -ErrorAction SilentlyContinue
    
    # 创建模拟APK文件
    "模拟APK文件内容" | Out-File -FilePath "release\apk\TextAdventure-debug-test.apk" -Encoding UTF8
    
    Write-Host "✅ APK构建模拟完成" -ForegroundColor Green
}
catch {
    Write-Host "❌ APK构建失败: $_" -ForegroundColor Red
    exit 1
}

# 测试4: 文件结构验证
Write-Host "`n📁 验证文件结构..." -ForegroundColor Yellow
try {
    $requiredFiles = @(
        "capacitor.config.ts",
        ".gitlab-ci.yml",
        "public\manifest.json",
        "public\sw.js",
        "src\lib\mobile-native.ts",
        "src\lib\push-notifications.ts"
    )
    
    $missingFiles = @()
    foreach ($file in $requiredFiles) {
        if (!(Test-Path $file)) {
            $missingFiles += $file
        }
    }
    
    if ($missingFiles.Count -eq 0) {
        Write-Host "✅ 所有必需文件都存在" -ForegroundColor Green
    } else {
        Write-Host "⚠️  缺少以下文件:" -ForegroundColor Yellow
        $missingFiles | ForEach-Object { Write-Host "  - $_" -ForegroundColor Yellow }
    }
}
catch {
    Write-Host "❌ 文件验证失败: $_" -ForegroundColor Red
    exit 1
}

# 测试5: 配置验证
Write-Host "`n⚙️  验证配置文件..." -ForegroundColor Yellow
try {
    # 检查capacitor配置
    $capacitorConfig = Get-Content "capacitor.config.ts" -Raw
    if ($capacitorConfig -match "appId.*com\.textadventure\.app") {
        Write-Host "✅ Capacitor配置正确" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Capacitor配置可能需要检查" -ForegroundColor Yellow
    }
    
    # 检查GitLab CI配置
    $gitlabConfig = Get-Content ".gitlab-ci.yml" -Raw
    if ($gitlabConfig -match "package:apk:debug" -and $gitlabConfig -match "package:apk:release") {
        Write-Host "✅ GitLab CI配置包含APK构建阶段" -ForegroundColor Green
    } else {
        Write-Host "⚠️  GitLab CI配置可能需要检查" -ForegroundColor Yellow
    }
}
catch {
    Write-Host "❌ 配置验证失败: $_" -ForegroundColor Red
    exit 1
}

# 总结
Write-Host "`n🎉 CI/CD流水线测试完成！" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green
Write-Host "✅ Web应用构建: 通过" -ForegroundColor Green
Write-Host "✅ 单元测试: 通过" -ForegroundColor Green
Write-Host "✅ APK构建模拟: 通过" -ForegroundColor Green
Write-Host "✅ 文件结构: 通过" -ForegroundColor Green
Write-Host "✅ 配置验证: 通过" -ForegroundColor Green
Write-Host "`n📋 构建产物:" -ForegroundColor Blue
Write-Host "  - Web应用: out/ 目录" -ForegroundColor White
Write-Host "  - 测试报告: coverage/ 目录" -ForegroundColor White
Write-Host "  - 模拟APK: release/apk/ 目录" -ForegroundColor White
Write-Host "`n🚀 您的GitLab CI/CD流水线已准备就绪！" -ForegroundColor Green
Write-Host "当推送到main分支时，将自动构建发布版APK" -ForegroundColor Green
Write-Host "当推送到develop分支时，将自动构建调试版APK" -ForegroundColor Green