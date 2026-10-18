package com.sunset.forecast;

import android.Manifest;
import android.app.Activity;
import android.content.pm.PackageManager;
import android.content.res.Configuration;
import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.view.WindowInsets;
import android.view.WindowManager;
import android.webkit.GeolocationPermissions;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import com.sunset.forecast.core.Vault;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;

/**
 * 火烧云预报 —— 原生外壳。
 *
 * 设计要点（源码保护）：
 *  1. 原始 index.html 不落盘：构建期整文件 AES-256-CBC 加密后写入 assets/app.dat；
 *     运行期只在内存中解密，通过 shouldInterceptRequest 以虚拟 HTTPS 域名回注，明文永不写盘。
 *  2. 解密密钥不以明文形式存在于 dex：Vault 中以两段 int 数组异或重组，R8 混淆类与方法名。
 *  3. 关闭 WebView 远程调试，禁用本地文件访问，避免通过 chrome://inspect 或 file:// 窃取页面源码。
 *
 * 移动端适配：
 *  4. 状态栏保持常显并按当前主题取色（浅色米白 / 深色墨底）；全面屏、刘海屏按 window insets
 *     补上边距，页面不被状态栏或挖孔遮挡；页面自带两套配色，故禁止系统再强制反色。
 *  5. 主题桥 AndroidTheme：页面读取系统深浅色并回传当前主题，状态栏、导航栏随之同步。
 */
public class MainActivity extends Activity {

    /** 虚拟域名：页面真实内容只在此域下由内存提供，外部无法访问。 */
    private static final String HOST = "forecast.local";
    private static final String PAGE_URL = "https://" + HOST + "/index.html";
    private static final String ICON_URL = "https://" + HOST + "/icon.png";
    /** 页面米白底色：状态栏、导航栏与 WebView 背景统一取此色，避免出现割裂色带。 */
    private static final String PAGE_BG = "#f7f4ec";
    /** 页面墨色底：深色主题下状态栏、导航栏与 WebView 背景统一取此色。 */
    private static final String DARK_BG = "#14120f";

    private WebView webView;
    /** 内存中的明文 HTML，进程退出前不清除，但从不写入磁盘。 */
    private volatile byte[] html;

    /** 定位权限请求码 */
    private static final int REQ_LOCATION = 0x51;
    /** WebView 定位授权回调：等系统权限结果返回后再答复页面，避免权限未授予时页面直接失败 */
    private GeolocationPermissions.Callback pendingGeoCallback;
    private String pendingGeoOrigin;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // ---- 0. 状态栏：保持常显，先按系统深浅色取色，页面加载后由主题控制器校正 ----
        Window window = getWindow();
        window.clearFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN
                | WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS);
        window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
        final boolean sysDark = isSystemDark();
        applySystemBars(sysDark);

        // ---- 1. 内存解密受保护的页面资源 ----
        try {
            this.html = Vault.decrypt(readFully(getAssets().open("app.dat")));
        } catch (Throwable t) {
            // 解密失败时给出最小化的空壳，不泄露任何原始源码。
            this.html = ("<!doctype html><meta charset=\"utf-8\">"
                    + "<body style=\"background:#f7f4ec;font-family:serif;padding:40px;color:#1a1815\">"
                    + "<h3>资源校验未通过</h3><p>应用资源已损坏或被篡改，请重新安装。</p></body>")
                    .getBytes(java.nio.charset.StandardCharsets.UTF_8);
        }

        // ---- 2. 关闭一切可被外部利用的调试/文件通道 ----
        WebView.setWebContentsDebuggingEnabled(false);

        this.webView = new WebView(this);
        this.webView.setBackgroundColor(Color.parseColor(sysDark ? DARK_BG : PAGE_BG));
        setContentView(this.webView);

        // 全面屏/刘海屏适配：把系统状态栏高度补进内容上边距，页面不被状态栏遮挡
        final int basePaddingTop = this.webView.getPaddingTop();
        this.webView.setOnApplyWindowInsetsListener(new View.OnApplyWindowInsetsListener() {
            @Override
            public WindowInsets onApplyWindowInsets(View v, WindowInsets insets) {
                v.setPadding(v.getPaddingLeft(),
                        basePaddingTop + insets.getSystemWindowInsetTop(),
                        v.getPaddingRight(), v.getPaddingBottom());
                return insets;
            }
        });
        this.webView.requestApplyInsets();

        WebSettings s = this.webView.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(false);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);
        s.setAllowFileAccessFromFileURLs(false);
        s.setAllowUniversalAccessFromFileURLs(false);
        s.setJavaScriptCanOpenWindowsAutomatically(false);
        s.setSupportMultipleWindows(false);
        // 定位能力供页面「位置设置」使用（仅在开关开启或点击手动定位时才会真正触发）
        s.setGeolocationEnabled(true);
        s.setDefaultTextEncodingName("utf-8");
        s.setCacheMode(WebSettings.LOAD_DEFAULT);
        s.setMediaPlaybackRequiresUserGesture(true);
        // 移动端适配：按设备宽度排版，字号不随系统缩放放大
        s.setUseWideViewPort(true);
        s.setLoadWithOverviewMode(true);
        s.setTextZoom(100);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            // 页面自带浅色/深色两套配色，禁止系统再强制反色，避免出现双重反转
            s.setForceDark(WebSettings.FORCE_DARK_OFF);
        }

        // 主题桥：页面据此读取系统深浅色，并在切换主题时同步状态栏、导航栏配色
        this.webView.addJavascriptInterface(new ThemeBridge(), "AndroidTheme");

        this.webView.setWebViewClient(new WebViewClient() {

            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                String url = request.getUrl().toString();
                if (url.equals(PAGE_URL) || url.equals("https://" + HOST + "/")) {
                    // 页面本体来自内存，绝不由磁盘文件对外提供。
                    Map<String, String> headers = new HashMap<>();
                    headers.put("Cache-Control", "no-store");
                    headers.put("Content-Type", "text/html; charset=utf-8");
                    return new WebResourceResponse(
                            "text/html", "utf-8", 200, "OK", headers,
                            new ByteArrayInputStream(html));
                }
                if (url.equals(ICON_URL)) {
                    // 网页图标（favicon）随包分发，直接从 assets 回注
                    try {
                        Map<String, String> headers = new HashMap<>();
                        headers.put("Cache-Control", "max-age=86400");
                        return new WebResourceResponse(
                                "image/png", "utf-8", 200, "OK", headers,
                                getAssets().open("icon.png"));
                    } catch (Throwable ignored) {
                        return null;
                    }
                }
                // 其余请求（Open-Meteo 气象接口等）走系统网络栈。
                return null;
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                // 不跳转外部浏览器，全部在应用内闭环。
                return false;
            }
        });

        // 定位授权：页面仅在「位置设置」开关开启或点击手动定位时才会发起定位请求；
        // 此处先申请系统权限，权限结果返回后再答复 WebView，避免权限尚未授予时页面直接失败。
        this.webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onGeolocationPermissionsShowPrompt(String origin, GeolocationPermissions.Callback callback) {
                if (hasLocationPermission()) {
                    callback.invoke(origin, true, false);
                    return;
                }
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    pendingGeoCallback = callback;
                    pendingGeoOrigin = origin;
                    requestPermissions(new String[]{
                            Manifest.permission.ACCESS_COARSE_LOCATION,
                            Manifest.permission.ACCESS_FINE_LOCATION
                    }, REQ_LOCATION);
                } else {
                    callback.invoke(origin, false, false);
                }
            }
        });

        this.webView.loadUrl(PAGE_URL);
    }

    @Override
    public void onBackPressed() {
        if (this.webView != null && this.webView.canGoBack()) {
            this.webView.goBack();
        } else {
            super.onBackPressed();
        }
    }

    @Override
    protected void onDestroy() {
        if (this.html != null) {
            Arrays.fill(this.html, (byte) 0);
        }
        if (this.webView != null) {
            this.webView.destroy();
        }
        super.onDestroy();
    }

    @Override
    public void onConfigurationChanged(Configuration newConfig) {
        super.onConfigurationChanged(newConfig);
        // 系统深浅色切换：页面若处于“跟随系统”档位，会立即重新取色并回调主题桥
        if (this.webView != null) {
            this.webView.evaluateJavascript(
                    "window.__applyThemeFromSystem && window.__applyThemeFromSystem();", null);
        }
    }

    /** 系统当前是否处于深色模式（“跟随系统”档位据此判定）。 */
    private boolean isSystemDark() {
        int uiMode = getResources().getConfiguration().uiMode & Configuration.UI_MODE_NIGHT_MASK;
        return uiMode == Configuration.UI_MODE_NIGHT_YES;
    }

    /** 状态栏与导航栏：浅色主题取页面米白，深色主题取页面墨底，图标明暗随之切换。 */
    private void applySystemBars(boolean dark) {
        Window window = getWindow();
        int bar = Color.parseColor(dark ? DARK_BG : PAGE_BG);
        window.setStatusBarColor(bar);
        window.setNavigationBarColor(bar);
        View decor = window.getDecorView();
        int flags = decor.getSystemUiVisibility();
        if (dark) {
            flags &= ~View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
        } else {
            flags |= View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
        }
        decor.setSystemUiVisibility(flags);
    }

    /** 页面主题桥：仅暴露“系统深浅色查询”与“同步状态栏配色”两个方法。 */
    public class ThemeBridge {

        @JavascriptInterface
        public boolean isDark() {
            return isSystemDark();
        }

        @JavascriptInterface
        public void setTheme(String mode) {
            final boolean dark = "dark".equals(mode);
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    applySystemBars(dark);
                    if (webView != null) {
                        webView.setBackgroundColor(Color.parseColor(dark ? DARK_BG : PAGE_BG));
                    }
                }
            });
        }
    }

    /** 是否已获得定位权限（Android 6.0 以下安装即授予）。 */
    private boolean hasLocationPermission() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) return true;
        return checkSelfPermission(Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED
                || checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED;
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == REQ_LOCATION && this.pendingGeoCallback != null) {
            boolean granted = false;
            if (grantResults != null) {
                for (int r : grantResults) {
                    if (r == PackageManager.PERMISSION_GRANTED) { granted = true; break; }
                }
            }
            this.pendingGeoCallback.invoke(this.pendingGeoOrigin, granted, false);
            this.pendingGeoCallback = null;
            this.pendingGeoOrigin = null;
        }
    }

    private static byte[] readFully(InputStream in) throws Exception {
        try {
            ByteArrayOutputStream out = new ByteArrayOutputStream(Math.max(1024, in.available()));
            byte[] buf = new byte[8192];
            int n;
            while ((n = in.read(buf)) != -1) {
                out.write(buf, 0, n);
            }
            return out.toByteArray();
        } finally {
            try { in.close(); } catch (Exception ignored) { }
        }
    }
}
