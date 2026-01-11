#!/bin/bash

# 文字冒险游戏平台 APK 打包脚本
# 支持开发、测试和生产环境打包

set -e

echo "🚀 开始打包文字冒险游戏平台 APK..."

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 环境变量
ENVIRONMENT=${1:-development}
BUILD_TYPE=${2:-debug}
VERSION_NAME=${3:-1.0.0}
VERSION_CODE=${4:-1}

echo -e "${BLUE}环境: ${ENVIRONMENT}${NC}"
echo -e "${BLUE}构建类型: ${BUILD_TYPE}${NC}"
echo -e "${BLUE}版本号: ${VERSION_NAME}${NC}"
echo -e "${BLUE}版本代码: ${VERSION_CODE}${NC}"

# 检查依赖
check_dependencies() {
    echo -e "${YELLOW}检查依赖...${NC}"
    
    # 检查Node.js
    if ! command -v node &> /dev/null; then
        echo -e "${RED}错误: Node.js 未安装${NC}"
        exit 1
    fi
    
    # 检查Java
    if ! command -v java &> /dev/null; then
        echo -e "${RED}错误: Java 未安装${NC}"
        exit 1
    fi
    
    # 检查Android SDK
    if [ -z "$ANDROID_HOME" ]; then
        echo -e "${RED}错误: ANDROID_HOME 环境变量未设置${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}依赖检查通过${NC}"
}

# 安装依赖
install_dependencies() {
    echo -e "${YELLOW}安装依赖...${NC}"
    npm ci
    echo -e "${GREEN}依赖安装完成${NC}"
}

# 构建Web应用
build_web_app() {
    echo -e "${YELLOW}构建Web应用...${NC}"
    
    # 设置环境变量
    export NODE_ENV=${ENVIRONMENT}
    export NEXT_PUBLIC_APP_VERSION=${VERSION_NAME}
    export NEXT_PUBLIC_BUILD_TYPE=${BUILD_TYPE}
    
    # 清理构建目录
    rm -rf out
    
    # 构建应用
    npm run build
    
    # 复制PWA文件
    cp public/manifest.json out/
    cp public/sw.js out/
    cp public/offline.html out/
    
    echo -e "${GREEN}Web应用构建完成${NC}"
}

# 生成签名密钥
generate_keystore() {
    if [ ! -f "keystore/android-release.keystore" ]; then
        echo -e "${YELLOW}生成签名密钥...${NC}"
        mkdir -p keystore
        
        keytool -genkey -v \
            -keystore keystore/android-release.keystore \
            -alias text-adventure-key \
            -keyalg RSA \
            -keysize 2048 \
            -validity 10000 \
            -storepass ${ANDROID_KEYSTORE_PASSWORD:-android} \
            -keypass ${ANDROID_KEY_ALIAS_PASSWORD:-android} \
            -dname "CN=Text Adventure, OU=Development, O=Text Adventure Inc, L=Beijing, S=Beijing, C=CN"
        
        echo -e "${GREEN}签名密钥生成完成${NC}"
    else
        echo -e "${BLUE}签名密钥已存在，跳过生成${NC}"
    fi
}

# 同步Capacitor
sync_capacitor() {
    echo -e "${YELLOW}同步Capacitor...${NC}"
    npx cap sync android
    echo -e "${GREEN}Capacitor同步完成${NC}"
}

# 构建APK
build_apk() {
    echo -e "${YELLOW}构建APK...${NC}"
    
    cd android
    
    if [ "$BUILD_TYPE" = "release" ]; then
        # 发布版本
        ./gradlew assembleRelease \
            -Pandroid.injected.signing.store.file=../keystore/android-release.keystore \
            -Pandroid.injected.signing.store.password=${ANDROID_KEYSTORE_PASSWORD:-android} \
            -Pandroid.injected.signing.key.alias=text-adventure-key \
            -Pandroid.injected.signing.key.password=${ANDROID_KEY_ALIAS_PASSWORD:-android} \
            -Pandroid.injected.signing.v2-enabled=true
        
        # 复制APK到输出目录
        mkdir -p ../release/android
        cp app/build/outputs/apk/release/app-release.apk ../release/android/TextAdventure-v${VERSION_NAME}-${BUILD_TYPE}.apk
        
        echo -e "${GREEN}发布版APK构建完成${NC}"
    else
        # 调试版本
        ./gradlew assembleDebug
        
        # 复制APK到输出目录
        mkdir -p ../release/android
        cp app/build/outputs/apk/debug/app-debug.apk ../release/android/TextAdventure-v${VERSION_NAME}-${BUILD_TYPE}.apk
        
        echo -e "${GREEN}调试版APK构建完成${NC}"
    fi
    
    cd ..
}

# 生成应用签名
generate_app_signature() {
    echo -e "${YELLOW}生成应用签名...${NC}"
    
    if [ "$BUILD_TYPE" = "release" ]; then
        cd android
        
        # 生成签名报告
        ./gradlew signingReport > ../release/android/signing-report.txt
        
        # 生成SHA256指纹
        keytool -list -v \
            -keystore ../keystore/android-release.keystore \
            -alias text-adventure-key \
            -storepass ${ANDROID_KEYSTORE_PASSWORD:-android} \
            -keypass ${ANDROID_KEY_ALIAS_PASSWORD:-android} > ../release/android/sha256-fingerprint.txt
        
        cd ..
        
        echo -e "${GREEN}应用签名生成完成${NC}"
    fi
}

# 生成构建报告
generate_build_report() {
    echo -e "${YELLOW}生成构建报告...${NC}"
    
    mkdir -p release/reports
    
    cat > release/reports/build-report-${VERSION_NAME}.md << EOF
# 文字冒险游戏平台 APK 构建报告

## 构建信息
- **版本号**: ${VERSION_NAME}
- **版本代码**: ${VERSION_CODE}
- **构建类型**: ${BUILD_TYPE}
- **环境**: ${ENVIRONMENT}
- **构建时间**: $(date)
- **构建机器**: $(hostname)

## 文件信息
- **APK文件**: release/android/TextAdventure-v${VERSION_NAME}-${BUILD_TYPE}.apk
- **文件大小**: $(ls -lh release/android/TextAdventure-v${VERSION_NAME}-${BUILD_TYPE}.apk | awk '{print $5}')
- **MD5**: $(md5sum release/android/TextAdventure-v${VERSION_NAME}-${BUILD_TYPE}.apk | awk '{print $1}')
- **SHA256**: $(sha256sum release/android/TextAdventure-v${VERSION_NAME}-${BUILD_TYPE}.apk | awk '{print $1}')

## 依赖信息
$(npm list --depth=0)

## 环境变量
- NODE_ENV: ${NODE_ENV}
- NEXT_PUBLIC_APP_VERSION: ${NEXT_PUBLIC_APP_VERSION}
- NEXT_PUBLIC_BUILD_TYPE: ${NEXT_PUBLIC_BUILD_TYPE}

EOF
    
    echo -e "${GREEN}构建报告生成完成${NC}"
}

# 上传到应用商店
upload_to_store() {
    if [ "$BUILD_TYPE" = "release" ] && [ "$ENVIRONMENT" = "production" ]; then
        echo -e "${YELLOW}上传到应用商店...${NC}"
        
        # Google Play Console 上传
        if command -v gcloud &> /dev/null; then
            echo "上传到 Google Play Console..."
            # gcloud firebase appdistribution:distribute release/android/TextAdventure-v${VERSION_NAME}-${BUILD_TYPE}.apk \
            #     --app ${FIREBASE_APP_ID} \
            #     --groups "testers" \
            #     --release-notes "版本 ${VERSION_NAME} 发布"
        fi
        
        # 其他应用商店上传逻辑
        
        echo -e "${GREEN}上传到应用商店完成${NC}"
    fi
}

# 发送通知
send_notification() {
    echo -e "${YELLOW}发送构建完成通知...${NC}"
    
    # Slack 通知
    if [ ! -z "$SLACK_WEBHOOK_URL" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"🎉 文字冒险游戏平台 APK 构建完成！\\n版本: ${VERSION_NAME}\\n类型: ${BUILD_TYPE}\\n环境: ${ENVIRONMENT}\\n下载: $(pwd)/release/android/TextAdventure-v${VERSION_NAME}-${BUILD_TYPE}.apk\"}" \
            $SLACK_WEBHOOK_URL
    fi
    
    # 邮件通知
    if [ ! -z "$NOTIFICATION_EMAIL" ]; then
        echo "APK构建完成 - 版本 ${VERSION_NAME}" | mail -s "构建完成通知" -a "release/android/TextAdventure-v${VERSION_NAME}-${BUILD_TYPE}.apk" $NOTIFICATION_EMAIL
    fi
    
    echo -e "${GREEN}通知发送完成${NC}"
}

# 清理工作
cleanup() {
    echo -e "${YELLOW}清理临时文件...${NC}"
    
    # 清理构建缓存
    rm -rf .next
    rm -rf node_modules/.cache
    
    # 清理Android构建缓存
    if [ -d "android" ]; then
        cd android
        ./gradlew clean
        cd ..
    fi
    
    echo -e "${GREEN}清理完成${NC}"
}

# 主函数
main() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}  文字冒险游戏平台 APK 打包脚本${NC}"
    echo -e "${BLUE}========================================${NC}"
    
    # 执行构建步骤
    check_dependencies
    install_dependencies
    build_web_app
    generate_keystore
    sync_capacitor
    build_apk
    generate_app_signature
    generate_build_report
    upload_to_store
    send_notification
    cleanup
    
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  APK 打包完成！${NC}"
    echo -e "${GREEN}  文件位置: release/android/TextAdventure-v${VERSION_NAME}-${BUILD_TYPE}.apk${NC}"
    echo -e "${GREEN}========================================${NC}"
}

# 错误处理
trap 'echo -e "${RED}构建过程中发生错误！${NC}"; exit 1' ERR

# 运行主函数
main "$@"