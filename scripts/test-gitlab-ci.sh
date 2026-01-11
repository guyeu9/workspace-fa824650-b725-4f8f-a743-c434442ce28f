#!/bin/bash

# GitLab CI/CD 本地测试脚本
# 用于在本地环境测试GitLab CI/CD流水线

set -e

echo "🚀 GitLab CI/CD 本地测试工具"
echo "=================================="

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 检查依赖
check_dependencies() {
    echo -e "${YELLOW}检查依赖...${NC}"
    
    # 检查Docker
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}错误: Docker 未安装${NC}"
        echo "请安装Docker: https://docs.docker.com/get-docker/"
        exit 1
    fi
    
    # 检查GitLab Runner
    if ! command -v gitlab-runner &> /dev/null; then
        echo -e "${YELLOW}GitLab Runner 未安装，将使用Docker运行${NC}"
    fi
    
    echo -e "${GREEN}依赖检查完成${NC}"
}

# 安装GitLab Runner（如果需要）
install_gitlab_runner() {
    if ! command -v gitlab-runner &> /dev/null; then
        echo -e "${YELLOW}安装GitLab Runner...${NC}"
        
        # 使用Docker运行GitLab Runner
        docker run -d --name gitlab-runner \
            --restart always \
            -v /srv/gitlab-runner/config:/etc/gitlab-runner \
            -v /var/run/docker.sock:/var/run/docker.sock \
            gitlab/gitlab-runner:latest
            
        echo -e "${GREEN}GitLab Runner 安装完成${NC}"
    fi
}

# 注册Runner
register_runner() {
    echo -e "${YELLOW}注册GitLab Runner...${NC}"
    
    # 检查是否已注册
    if [ -f ".gitlab-runner-registered" ]; then
        echo -e "${BLUE}Runner 已注册，跳过注册${NC}"
        return
    fi
    
    # 创建Runner配置文件
    cat > .gitlab-runner-config.toml << EOF
concurrent = 1
check_interval = 0

[session_server]
  session_timeout = 1800

[[runners]]
  name = "local-runner"
  url = "http://localhost:8080"
  token = "local-token"
  executor = "docker"
  [runners.custom_build_dir]
  [runners.cache]
    [runners.cache.s3]
    [runners.cache.gcs]
    [runners.cache.azure]
  [runners.docker]
    tls_verify = false
    image = "node:18"
    privileged = false
    disable_entrypoint_overwrite = false
    oom_kill_disable = false
    disable_cache = false
    volumes = ["/cache"]
    shm_size = 0
EOF

    # 标记为已注册
    touch .gitlab-runner-registered
    echo -e "${GREEN}Runner 注册完成${NC}"
}

# 模拟环境变量
setup_environment() {
    echo -e "${YELLOW}设置环境变量...${NC}"
    
    # 导出测试环境变量
    export ANDROID_KEYSTORE_PASSWORD="test-password"
    export ANDROID_KEY_ALIAS_PASSWORD="test-alias-password"
    export SLACK_WEBHOOK_URL="https://hooks.slack.com/services/test/webhook"
    export NOTIFICATION_EMAIL="test@example.com"
    export GOOGLE_PLAY_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"test-project"}'
    
    echo -e "${GREEN}环境变量设置完成${NC}"
}

# 运行单个Job
run_job() {
    local job_name=$1
    echo -e "${BLUE}运行Job: $job_name${NC}"
    
    # 根据Job名称运行对应的脚本
    case $job_name in
        "build:web")
            run_build_web
            ;;
        "test:unit")
            run_test_unit
            ;;
        "package:apk:debug")
            run_package_apk_debug
            ;;
        "package:apk:release")
            run_package_apk_release
            ;;
        *)
            echo -e "${RED}未知的Job: $job_name${NC}"
            return 1
            ;;
    esac
}

# 构建Web应用
run_build_web() {
    echo -e "${YELLOW}构建Web应用...${NC}"
    
    # 使用Node.js容器运行
    docker run --rm \
        -v $(pwd):/workspace \
        -w /workspace \
        -e NODE_ENV=production \
        node:18 bash -c "
            npm ci && \
            npm run build && \
            echo '✅ Web应用构建完成'
        "
    
    echo -e "${GREEN}Web应用构建完成${NC}"
}

# 运行单元测试
run_test_unit() {
    echo -e "${YELLOW}运行单元测试...${NC}"
    
    docker run --rm \
        -v $(pwd):/workspace \
        -w /workspace \
        node:18 bash -c "
            npm ci && \
            npm test -- --coverage --watchAll=false && \
            echo '✅ 单元测试通过'
        "
    
    echo -e "${GREEN}单元测试完成${NC}"
}

# 构建调试版APK
run_package_apk_debug() {
    echo -e "${YELLOW}构建调试版APK...${NC}"
    
    # 创建模拟的Android环境
    docker run --rm \
        -v $(pwd):/workspace \
        -w /workspace \
        -e ANDROID_HOME=/opt/android-sdk \
        openjdk:11-jdk bash -c "
            # 安装Node.js
            curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
            apt-get install -y nodejs wget unzip && \
            
            # 安装Android SDK
            mkdir -p /opt/android-sdk && \
            cd /opt/android-sdk && \
            wget -q https://dl.google.com/android/repository/commandlinetools-linux-9477386_latest.zip && \
            unzip -q commandlinetools-linux-9477386_latest.zip && \
            mkdir -p cmdline-tools/latest && \
            mv cmdline-tools/* cmdline-tools/latest/ 2>/dev/null || true && \
            export PATH=\$PATH:/opt/android-sdk/cmdline-tools/latest/bin && \
            yes | sdkmanager --licenses && \
            sdkmanager 'platform-tools' 'platforms;android-33' 'build-tools;33.0.0' && \
            
            # 安装Capacitor
            npm install -g @capacitor/cli && \
            
            # 构建项目
            cd /workspace && \
            npm ci && \
            npm run build && \
            npx cap sync android && \
            
            # 模拟APK构建
            echo '✅ 调试版APK构建完成（模拟）'
        "
    
    echo -e "${GREEN}调试版APK构建完成${NC}"
}

# 构建发布版APK
run_package_apk_release() {
    echo -e "${YELLOW}构建发布版APK...${NC}"
    
    # 检查密钥是否存在
    if [ ! -f "keystore/android-release.keystore" ]; then
        echo -e "${YELLOW}生成测试签名密钥...${NC}"
        mkdir -p keystore
        keytool -genkey -v \
            -keystore keystore/android-release.keystore \
            -alias text-adventure-key \
            -keyalg RSA \
            -keysize 2048 \
            -validity 10000 \
            -storepass android \
            -keypass android \
            -dname "CN=Test, OU=Test, O=Test, L=Test, S=Test, C=CN"
    fi
    
    docker run --rm \
        -v $(pwd):/workspace \
        -w /workspace \
        -e ANDROID_HOME=/opt/android-sdk \
        -e ANDROID_KEYSTORE_PASSWORD=android \
        -e ANDROID_KEY_ALIAS_PASSWORD=android \
        openjdk:11-jdk bash -c "
            # 安装依赖
            curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
            apt-get install -y nodejs wget unzip && \
            
            # 安装Android SDK
            mkdir -p /opt/android-sdk && \
            cd /opt/android-sdk && \
            wget -q https://dl.google.com/android/repository/commandlinetools-linux-9477386_latest.zip && \
            unzip -q commandlinetools-linux-9477386_latest.zip && \
            mkdir -p cmdline-tools/latest && \
            mv cmdline-tools/* cmdline-tools/latest/ 2>/dev/null || true && \
            export PATH=\$PATH:/opt/android-sdk/cmdline-tools/latest/bin && \
            yes | sdkmanager --licenses && \
            sdkmanager 'platform-tools' 'platforms;android-33' 'build-tools;33.0.0' && \
            
            # 安装Capacitor
            npm install -g @capacitor/cli && \
            
            # 构建项目
            cd /workspace && \
            npm ci && \
            npm run build && \
            npx cap sync android && \
            
            # 模拟发布版APK构建
            echo '✅ 发布版APK构建完成（模拟）'
        "
    
    echo -e "${GREEN}发布版APK构建完成${NC}"
}

# 运行完整流水线
run_pipeline() {
    echo -e "${BLUE}运行完整CI/CD流水线...${NC}"
    
    local stages=("build:web" "test:unit" "package:apk:debug")
    
    for stage in "${stages[@]}"; do
        echo -e "${YELLOW}========================================${NC}"
        echo -e "${YELLOW}执行阶段: $stage${NC}"
        echo -e "${YELLOW}========================================${NC}"
        
        if ! run_job "$stage"; then
            echo -e "${RED}流水线失败在阶段: $stage${NC}"
            return 1
        fi
        
        echo -e "${GREEN}✅ 阶段 $stage 完成${NC}"
        echo ""
    done
    
    echo -e "${GREEN}🎉 完整流水线执行完成！${NC}"
}

# 显示使用帮助
show_help() {
    echo "GitLab CI/CD 本地测试工具"
    echo ""
    echo "使用方法:"
    echo "  $0 [命令] [选项]"
    echo ""
    echo "命令:"
    echo "  setup      - 设置测试环境"
    echo "  build      - 运行构建阶段"
    echo "  test       - 运行测试阶段"
    echo "  package    - 运行打包阶段"
    echo "  pipeline   - 运行完整流水线"
    echo "  help       - 显示帮助信息"
    echo ""
    echo "示例:"
    echo "  $0 setup"
    echo "  $0 build"
    echo "  $0 pipeline"
}

# 主函数
main() {
    case "${1:-help}" in
        "setup")
            check_dependencies
            install_gitlab_runner
            register_runner
            setup_environment
            echo -e "${GREEN}✅ 测试环境设置完成${NC}"
            ;;
        "build")
            run_build_web
            ;;
        "test")
            run_test_unit
            ;;
        "package")
            run_package_apk_debug
            ;;
        "pipeline")
            check_dependencies
            setup_environment
            run_pipeline
            ;;
        "help"|*)
            show_help
            ;;
    esac
}

# 运行主函数
main "$@"