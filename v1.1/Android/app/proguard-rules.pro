# ============================================================
#  R8 / ProGuard 混淆规则 —— 源码保护
# ============================================================
# 入口 Activity 必须保留全限定类名，因为 APK 清单中直接以
# com.sunset.forecast.MainActivity 引用它；其余类（如解密核心 Vault）
# 会被 R8 混淆类名 / 方法名 / 字段名。
-keep class com.sunset.forecast.MainActivity { *; }

# 页面通过 addJavascriptInterface("AndroidTheme") 按名字调用桥接方法，
# 方法名必须保留，否则 JS 侧调用会失效
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# 允许修改访问修饰符，提升优化与混淆强度
-allowaccessmodification

# 彻底移除源码行号、源文件等调试信息，避免反编译时定位源码
-renamesourcefileattribute SourceFile

# 忽略第三方/平台缺失类告警（本工程仅依赖 android.* 与 javax.crypto）
-dontwarn **
-dontnote **
