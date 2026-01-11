# ProGuard 规则配置
# 用于APK代码混淆和优化

# 保持必要的类和方法
-keep public class * extends android.app.Activity
-keep public class * extends android.app.Service
-keep public class * extends android.content.BroadcastReceiver
-keep public class * extends android.content.ContentProvider
-keep public class * extends android.app.Application
-keep public class * extends android.app.Fragment
-keep public class * extends androidx.fragment.app.Fragment

# 保持Capacitor相关类
-keep public class com.getcapacitor.** { *; }
-keep public class io.ionic.** { *; }

# 保持WebView相关类
-keep public class android.webkit.** { *; }
-keep public class androidx.webkit.** { *; }

# 保持JavaScript接口
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# 保持序列化类
-keepclassmembers class * implements java.io.Serializable {
    static final long serialVersionUID;
    private static final java.io.ObjectStreamField[] serialPersistentFields;
    private void writeObject(java.io.ObjectOutputStream);
    private void readObject(java.io.ObjectInputStream);
    java.lang.Object writeReplace();
    java.lang.Object readResolve();
}

# 保持反射相关类
-keepattributes *Annotation*
-keepattributes Signature
-keepattributes InnerClasses
-keepattributes EnclosingMethod

# 保持网络相关类
-keep public class * extends java.net.URLConnection
-keep public class * extends javax.net.ssl.HttpsURLConnection
-keep public class * extends javax.net.ssl.SSLSocketFactory

# 保持JSON相关类
-keepclassmembers class * {
    @com.google.gson.annotations.SerializedName <fields>;
}

# 保持推送通知相关类
-keep public class com.google.firebase.** { *; }
-keep public class androidx.work.** { *; }

# 保持本地存储相关类
-keep public class android.database.** { *; }
-keep public class android.content.** { *; }

# 保持相机相关类
-keep public class android.hardware.camera.** { *; }
-keep public class androidx.camera.** { *; }

# 保持文件系统相关类
-keep public class java.io.** { *; }
-keep public class java.nio.** { *; }

# 移除日志代码
-assumenosideeffects class android.util.Log {
    public static boolean isLoggable(java.lang.String, int);
    public static int v(...);
    public static int i(...);
    public static int w(...);
    public static int d(...);
    public static int e(...);
}

# 优化配置
-optimizationpasses 5
-dontusemixedcaseclassnames
-dontskipnonpubliclibraryclasses
-dontpreverify
-verbose
-optimizations !code/simplification/arithmetic,!field/*,!class/merging/*

# 保持原生方法
-keepclasseswithmembernames class * {
    native <methods>;
}

# 保持回调方法
-keepclassmembers class * {
    void *(**On*Event);
    void *(**Callback);
    void *(**Listener);
}

# 保持枚举类
-keepclassmembers enum * {
    public static **[] values();
    public static ** valueOf(java.lang.String);
}

# 保持Parcelable实现类
-keep class * implements android.os.Parcelable {
    public static final android.os.Parcelable$Creator *;
}

# 保持WebView的JavaScript接口
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# 保持Capacitor插件
-keep public class * extends com.getcapacitor.Plugin {
    public <methods>;
}

# 保持Capacitor Bridge
-keep public class com.getcapacitor.Bridge {
    public <methods>;
}

# 保持Capacitor WebView
-keep public class com.getcapacitor.CapacitorWebView {
    public <methods>;
}

# 保持JavaScript接口类
-keepclassmembers class * {
    @com.getcapacitor.annotation.CapacitorPlugin <methods>;
    @com.getcapacitor.annotation.PluginMethod <methods>;
}

# 保持注解
-keepattributes *Annotation*

# 保持泛型信息
-keepattributes Signature

# 保持内部类
-keepattributes InnerClasses

# 保持异常信息
-keepattributes Exceptions

# 保持行号信息（用于错误报告）
-keepattributes SourceFile,LineNumberTable

# 保持Kotlin元数据
-keepattributes RuntimeVisibleAnnotations,AnnotationDefault