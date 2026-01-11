import { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.textadventure.app',
  appName: '文字冒险游戏平台',
  webDir: 'out',
  bundledWebRuntime: false,
  
  // Android配置
  android: {
    path: 'android',
    package: 'com.textadventure.app',
    buildOptions: {
      keystorePath: './keystore/android-release.keystore',
      keystorePassword: 'your-keystore-password',
      keystoreAlias: 'text-adventure-key',
      keystoreAliasPassword: 'your-alias-password',
      releaseType: 'APK'
    }
  },
  
  // iOS配置
  ios: {
    path: 'ios',
    scheme: 'TextAdventureApp',
    bundleId: 'com.textadventure.app',
    buildOptions: {
      exportMethod: 'app-store',
      provisioningProfile: './ios/TextAdventureApp.mobileprovision'
    }
  },
  
  // 服务器配置
  server: {
    url: process.env.NODE_ENV === 'production' ? 'https://your-domain.com' : 'http://localhost:3000',
    cleartext: process.env.NODE_ENV !== 'production'
  },
  
  // 插件配置
  plugins: {
    // 推送通知
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    },
    
    // 本地通知
    LocalNotifications: {
      smallIcon: "ic_stat_icon_config_sample",
      iconColor: "#488AFF",
      sound: "beep.wav"
    },
    
    // 相机
    Camera: {
      source: "CAMERA",
      direction: "REAR",
      resultType: "base64"
    },
    
    // 文件系统
    Filesystem: {
      directories: {
        Documents: "DOCUMENTS",
        Data: "DATA"
      }
    },
    
    // 设备信息
    Device: {
      enableLogging: process.env.NODE_ENV !== 'production'
    },
    
    // 网络状态
    Network: {
      enableLogging: process.env.NODE_ENV !== 'production'
    },
    
    // 电池状态
    Battery: {
      enableLogging: process.env.NODE_ENV !== 'production'
    },
    
    // 屏幕方向
    ScreenOrientation: {
      orientation: "portrait"
    },
    
    // 状态栏
    StatusBar: {
      style: "DARK",
      backgroundColor: "#6366f1",
      overlaysWebView: false
    },
    
    // 启动画面
    SplashScreen: {
      launchShowDuration: 3000,
      launchAutoHide: true,
      backgroundColor: "#6366f1",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: true,
      androidSpinnerStyle: "large",
      iosSpinnerStyle: "small",
      spinnerColor: "#ffffff",
      splashFullScreen: true,
      splashImmersive: true,
      layoutName: "launch_screen",
      useDialog: true
    },
    
    // 分享
    Share: {
      dialogTitle: "分享游戏"
    },
    
    // 应用内浏览器
    Browser: {
      toolbarColor: "#6366f1",
      showTitle: true
    },
    
    // 存储
    Storage: {
      group: "textadventure"
    },
    
    // 偏好设置
    Preferences: {
      group: "textadventure"
    },
    
    // 动作表
    ActionSheet: {
      title: "选择操作"
    },
    
    // 对话框
    Dialog: {
      title: "提示"
    },
    
    // 振动
    Haptics: {
      enabled: true
    },
    
    // 键盘
    Keyboard: {
      resize: "native",
      style: "DARK",
      resizeOnFullScreen: true
    },
    
    // 地理位置
    Geolocation: {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000
    },
    
    // 运动传感器
    Motion: {
      frequency: 60
    },
    
    // 音频
    Audio: {
      enabled: true
    },
    
    // 视频
    Video: {
      enabled: true
    }
  },
  
  // 权限配置
  cordova: {
    preferences: {
      "android-minSdkVersion": "21",
      "android-targetSdkVersion": "33",
      "android-compileSdkVersion": "33",
      "android-buildToolsVersion": "33.0.0",
      "android-useAndroidX": "true",
      "android-enableJetifier": "true",
      "ios-deployment-target": "13.0",
      "SwiftVersion": "5.0",
      "UseSwiftLanguageVersion": "5.0"
    }
  },
  
  // 构建配置
  buildOptions: {
    android: {
      keystorePath: './keystore/android-release.keystore',
      keystorePassword: process.env.ANDROID_KEYSTORE_PASSWORD,
      keystoreAlias: 'text-adventure-key',
      keystoreAliasPassword: process.env.ANDROID_KEY_ALIAS_PASSWORD,
      releaseType: 'APK',
      buildConfig: {
        debuggable: process.env.NODE_ENV !== 'production',
        minifyEnabled: process.env.NODE_ENV === 'production',
        shrinkResources: process.env.NODE_ENV === 'production',
        proguardFiles: [
          'proguard-android.txt',
          'proguard-rules.pro'
        ]
      }
    },
    ios: {
      exportMethod: 'app-store',
      provisioningProfile: process.env.IOS_PROVISIONING_PROFILE,
      certificate: process.env.IOS_CERTIFICATE,
      certificatePassword: process.env.IOS_CERTIFICATE_PASSWORD,
      buildFlag: [
        '-UseModernBuildSystem=0'
      ]
    }
  },
  
  // 打包配置
  package: {
    android: {
      outputPath: './release/android',
      outputName: 'TextAdventure-v{version}-{build}.apk',
      signingConfig: {
        storeFile: './keystore/android-release.keystore',
        storePassword: process.env.ANDROID_KEYSTORE_PASSWORD,
        keyAlias: 'text-adventure-key',
        keyPassword: process.env.ANDROID_KEY_ALIAS_PASSWORD
      }
    },
    ios: {
      outputPath: './release/ios',
      outputName: 'TextAdventure-v{version}-{build}.ipa',
      signing: {
        provisioningProfile: process.env.IOS_PROVISIONING_PROFILE,
        certificate: process.env.IOS_CERTIFICATE,
        certificatePassword: process.env.IOS_CERTIFICATE_PASSWORD
      }
    }
  }
}

export default config