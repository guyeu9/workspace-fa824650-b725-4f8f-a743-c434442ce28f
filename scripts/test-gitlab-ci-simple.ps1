# GitLab CI/CD 本地测试脚本 (PowerShell版本)
# 用于在Windows环境测试GitLab CI/CD流水线

param(
    [string]$Command = "help"
)

Write-Host "🚀 GitLab CI/CD 本地测试工具" -ForegroundColor Blue
Write-Host "==================================" -ForegroundColor Blue

# 构建Web应用
function Test-BuildWeb {
    Write-Host "🚀 构建Web应用..." -ForegroundColor Yellow
    
    try {
        # 清理之前的构建
        if (Test-Path "out") {
            Remove-Item -Recurse -Force "out"
        }
        
        # 安装依赖
        Write-Host "📦 安装依赖..." -ForegroundColor Cyan
        npm ci
        
        # 构建应用
        Write-Host "🔨 构建应用..." -ForegroundColor Cyan
        npm run build
        
        # 验证构建结果
        if (Test-Path "out") {
            Write-Host "✅ Web应用构建完成" -ForegroundColor Green
        } else {
            throw "构建失败: out目录未生成"
        }
    }
    catch {
        Write-Host "❌ Web应用构建失败: $_" -ForegroundColor Red
        exit 1
    }
}

# 运行单元测试
function Test-UnitTests {
    Write-Host "🧪 运行单元测试..." -ForegroundColor Yellow
    
    try {
        # 安装依赖
        npm ci
        
        # 运行测试
        npm test -- --coverage --watchAll=false
        
        Write-Host "✅ 单元测试通过" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ 单元测试失败: $_" -ForegroundColor Red
        exit 1
    }
}

# 模拟APK构建
function Test-ApkBuild {
    Write-Host "📱 模拟APK构建..." -ForegroundColor Yellow
    
    try {
        # 创建发布目录
        New-Item -ItemType Directory -Force -Path "release\apk"
        
        # 创建模拟APK文件
        "模拟APK文件" | Out-File -FilePath "release\apk\TextAdventure-debug-test.apk" -Encoding UTF8
        
        Write-Host "✅ APK构建模拟完成" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ APK构建失败: $_" -ForegroundColor Red
        exit 1
    }
}

# 运行完整测试
function Test-Pipeline {
    Write-Host "🚀 运行完整CI/CD流水线测试..." -ForegroundColor Blue
    
    $stages = @(
        @{ Name = "构建Web应用"; Function = "Test-BuildWeb" },
        @{ Name = "运行单元测试"; Function = "Test-UnitTests" },
        @{ Name = "模拟APK构建"; Function = "Test-ApkBuild" }
    )
    
    foreach ($stage in $stages) {
        Write-Host "========================================" -ForegroundColor Blue
        Write-Host "执行阶段: $($stage.Name)" -ForegroundColor Blue
        Write-Host "========================================" -ForegroundColor Blue
        
        try {
            & $stage.Function
            Write-Host "✅ 阶段 $($stage.Name) 完成" -ForegroundColor Green
            Write-Host ""
        }
        catch {
            Write-Host "❌ 流水线失败在阶段: $($stage.Name)" -ForegroundColor Red
            Write-Host "错误: $_" -ForegroundColor Red
            exit 1
        }
    }
    
    Write-Host "🎉 完整流水线测试完成！" -ForegroundColor Green
}

# 显示帮助
function Show-Help {
    Write-Host "GitLab CI/CD 本地测试工具" -ForegroundColor Blue
    Write-Host "==================================" -ForegroundColor Blue
    Write-Host ""
    Write-Host "使用方法:" -ForegroundColor White
    Write-Host "  .\scripts\test-gitlab-ci-simple.ps1 [命令]" -ForegroundColor White
    Write-Host ""
    Write-Host "命令:" -ForegroundColor White
    Write-Host "  build      - 测试Web应用构建" -ForegroundColor White
    Write-Host "  test       - 运行单元测试" -ForegroundColor White
    Write-Host "  package    - 模拟APK构建" -ForegroundColor White
    Write-Host "  pipeline   - 运行完整流水线测试" -ForegroundColor White
    Write-Host "  help       - 显示帮助信息" -ForegroundColor White
}

# 主函数
switch ($Command.ToLower()) {
    "build" {
        Test-BuildWeb
    }
    "test" {
        Test-UnitTests
    }
    "package" {
        Test-ApkBuild
    }
    "pipeline" {
        Test-Pipeline
    }
    "help" {
        Show-Help
    }
    default {
        Write-Host "❌ 未知命令: $Command" -ForegroundColor Red
        Show-Help
    }
}