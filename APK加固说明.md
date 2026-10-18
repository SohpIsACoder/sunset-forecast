# 火烧云预报 v1.2 —— 安全加固操作说明

> 本项目为 WebView 套壳 APP，网页资源随包离线分发，**不作前后端分离改造**，原有业务逻辑全部保留。
> 本次加固的目标是**抬高抄袭 / 逆向门槛**，不追求也无法实现源码绝对保密——专业逆向人员仍可从
> 运行内存或加固后的资源中提取到网页与脚本内容，请理性看待防护强度。

---

## 一、本次改动概览

| 位置 | 改动 | 目的 |
| --- | --- | --- |
| `index.html` | 页面内全部业务 JS 抽离为外链 `app.js`；仅保留 HTML 结构 + CSS，删除多余注释与缩进 | 源码不再以明文内联，便于独立混淆 |
| `app-raw.js` | 抽离出来的**未混淆原始脚本**，供日常调试与后续修改 | 保留可维护的源 |
| `app.js` | terser 混淆压缩产物（页面实际加载的文件） | 变量/函数名混淆、字符串编码、去注释 |
| `Android/app/src/main/java/com/sunset/forecast/MainActivity.java` | 关闭 WebView 调试、收紧文件访问、JSBridge 仅对内部资源注入、外部导航收口 | 阻断 chrome://inspect 与注入攻击面 |
| `Android/build_apk.ps1` | 新增 terser 构建步骤；`index.html` 与 `app.js` **双密文资源**打包 | 包内不存在任何明文网页/脚本 |
| `AndroidManifest.xml` | **未改动** | 权限与组件配置维持原样 |

---

## 二、前端：JS 抽离 + terser 混淆

### 1. 拆分结果

`index.html` 中原本内联的 5 段脚本全部移出，改为在 `<head>` 内以阻塞方式引入：

```html
<script src="app.js"></script>
```

之所以放在 `<head>` 且不加 `defer`，是为了让「主题预置」在首次绘制前执行，避免浅/深色切换闪白；
脚本内部对依赖 DOM 的逻辑统一用 `document.readyState` 守卫，等 `DOMContentLoaded` 后再绑定，
因此拆分前后交互行为完全一致。

### 2. terser 混淆配置（`Android/build_apk.ps1` 第 1 步自动执行）

| 要求 | 对应配置 | 说明 |
| --- | --- | --- |
| 变量名 / 函数名混淆 | `mangle.toplevel = true` | 含顶层作用域 |
| 字符串字面量编码 | `format.ascii_only = true` | 非 ASCII（全部中文文案）转义为 `\uXXXX`，无法直接搜索 |
| 删除注释、保留版权头 | `format.comments = /^!/` | 只保留 `/*! ... */` 著作权注释 |
| 关闭无效防护 | `compress.drop_debugger = true` | 仅清除残留 `debugger`；**未新增**死循环 debugger / F12 监听 |

> ⚠ **关键保留名单**：HTML 的 `onclick="..."` 与脚本内动态拼接的字符串会按名调用函数，
> 这些名字已加入 `mangle.reserved`，否则混淆后按钮会全部失效：
> `handleCitySearch`、`setEventFilter`、`setCanvasMode`、`quickSelectCity`、
> `selectSlot`、`replayHistoryItem`、`__applyThemeFromSystem`。

### 3. HTML 压缩

仅删除 HTML 注释、行首缩进与连续空行；**`<style>` 块原样保留**，CSS 变量、页面布局、双主题配色均未改动。

### 4. 保留的功能（已全部验证）

深色/浅色/跟随系统主题、右上角齿轮面板、位置设置（自动/手动定位）、画布渲染、
城市搜索预报、历史记录、**防复制 CSS/JS**（输入框仍可正常选中、粘贴、右键）——全部正常，离线运行正常。

---

## 三、安卓端 WebView 关键代码

### 1. 关闭远程调试（正式包必须）

```java
// 关闭一切可被 chrome://inspect 利用的调试通道
WebView.setWebContentsDebuggingEnabled(false);
```

> 仅开发调试期可临时改为 `true`，正式打包务必为 `false`。

### 2. WebSettings 文件访问收紧

```java
s.setJavaScriptEnabled(true);
s.setDomStorageEnabled(true);
s.setDatabaseEnabled(false);

s.setAllowFileAccess(false);                     // 禁止 file:// 读取本地文件
s.setAllowContentAccess(false);                  // 禁止 content:// 访问
s.setAllowFileAccessFromFileURLs(false);         // 禁止 file 页面跨源读文件
s.setAllowUniversalAccessFromFileURLs(false);    // 禁止 file 页面访问任意源

s.setJavaScriptCanOpenWindowsAutomatically(false);
s.setSupportMultipleWindows(false);
```

### 3. JSBridge 只对内部资源注入

```java
/** 内部资源前缀：内存回注的虚拟域名 + 本地 assets */
private static final String INTERNAL_PREFIX = "https://forecast.local/";
private static final String ASSET_PREFIX    = "file:///android_asset/";

private boolean isInternalUrl(String url) {
    if (url == null) return false;
    return url.startsWith(INTERNAL_PREFIX) || url.startsWith(ASSET_PREFIX);
}
```

* 页面本体与业务脚本都是**密文**，仅在 `shouldInterceptRequest` 中以内存明文回注，
  `App` 内不落盘、不提供任何文件通道；
* 主题桥 `AndroidTheme` **只在内部资源时才挂载**：

```java
if (isInternalUrl(PAGE_URL)) {           // 入口页来自内存，属于内部资源
    this.themeBridgeInjected = true;
    this.webView.addJavascriptInterface(new ThemeBridge(), "AndroidTheme");
}
```

* 一旦导航离开内部资源，立即移除桥接，且外部链接一律不加载：

```java
@Override
public void onPageStarted(WebView view, String url, Bitmap favicon) {
    if (isInternalUrl(url)) {
        if (!themeBridgeInjected) {
            themeBridgeInjected = true;
            view.addJavascriptInterface(new ThemeBridge(), "AndroidTheme");
        }
    } else {
        view.removeJavascriptInterface("AndroidTheme");   // 外部页面绝不注入
        themeBridgeInjected = false;
    }
}

@Override
public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
    // 仅允许内部资源在应用内闭环；外部链接一律不加载、不跳转
    return !isInternalUrl(request.getUrl().toString());
}
```

* 虚拟域名下未声明的路径返回 404，**不会落到网络栈**，避免被用来加载任意外部内容。

> 保留不变：长按防复制逻辑（在 `app.js` 内）、定位权限回调
> （`onGeolocationPermissionsShowPrompt` + `onRequestPermissionsResult`）、
> 状态栏/导航栏主题同步等原有逻辑。
> `AndroidManifest.xml` 本次**未做任何修改**。

---

## 四、构建 v1.2 签名 APK

```powershell
cd d:\Docs\Code_Projects\sunset-forecast\v1.2\Android
powershell -ExecutionPolicy Bypass -File .\build_apk.ps1
```

产物：`Android\out\SunsetForecast-v1.2-release.apk`

构建脚本会自动完成 9 步（含 terser 混淆与双密文资源打包）。构建脚本已内置清理 assets 目录，
包内只会有 `app.dat`（加密页面）、`app.js.dat`（加密脚本）与 `icon.png`，**不含任何明文网页或脚本**。
沿用原有 keystore，签名与 v1.1 一致，可直接覆盖安装升级。

> 日常修改流程：
> 改业务逻辑 → 编辑 `app-raw.js`；改结构/样式 → 编辑 `index.html`；
> 然后重新执行上面的构建命令（脚本会自动用 terser 重新压缩 `app-raw.js` → `app.js`）。

---

## 五、APK 整体加固（人工操作，腾讯乐固）

> 代码层面只能做到上面的配置，**无法加密 assets 里的密文之外的资源、也无法阻止脱壳**。
> 需要人工使用第三方加固工具对 APK 做整体加固。

1. **编译 release 签名 APK**
   执行 `build_apk.ps1`，得到 `SunsetForecast-v1.2-release.apk`。

2. **上传加固工具（腾讯乐固）并开启 H5 资源加密**
   * 在乐固控制台新建加固任务，上传上一步的 APK；
   * 在加固配置中**勾选「H5 资源加密」**（不同的加固厂商名称可能是
     *H5/JS 资源加密*、*Web 资源保护*），对 `assets` 下的网页资源再做一层加壳处理；
   * 其余混淆/防调试选项按需开启，提交加固，等待产出加固后的 APK。

3. **加固后重新做渠道签名**
   加固工具会破坏原有签名，必须用**同一套 keystore**
   （`Android\keystore\sunset-release.keystore`，别名 `sunsetkey`）重新签名：

   ```powershell
   & "<sdk>\build-tools\34.0.0\apksigner.bat" sign ^
       --ks Android\keystore\sunset-release.keystore ^
       --ks-pass pass:Sunset#2026 --key-pass pass:Sunset#2026 ^
       --ks-key-alias sunsetkey ^
       --out SunsetForecast-v1.2-hardened.apk hardened.apk
   & "<sdk>\build-tools\34.0.0\apksigner.bat" verify --print-certs SunsetForecast-v1.2-hardened.apk
   ```

   > 注意：apksigner 默认同时产出 v1/v2/v3 签名，若加固工具要求特定签名方案（如仅 v2），
   > 可通过 `--v1-signing-enabled` / `--v2-signing-enabled` 指定；签名保持一致即可覆盖安装。

4. **安装验证**
   覆盖安装后确认：首屏正常、主题切换正常、定位开关正常、画布渲染正常、防复制生效、
   城市搜索能拉取气象数据、离线状态不白屏。

---

## 六、安全边界与风险提示

1. **第三方加固的 H5 加密同样存在被破解提取的可能**——它只是把逆向工作量从「直接解压」
   提升到「脱壳 + 运行时内存 dump」，**不是绝对安全**，也无法阻止有能力的逆向人员拿到资源。
2. 本项目内的 AES-256-CBC 整页加密 + 内存解密 + R8 混淆，配合关闭 WebView 调试与文件访问，
   能有效阻断「解包即得源码 / chrome://inspect 直接看源码」这两条最低成本的抄袭路径。
3. 离线运行与全部原有业务功能不受本次加固影响。
4. 不要自行添加死循环 `debugger`、`F12` / `Ctrl+U` 键盘监听这类防护：既容易被绕过，
   又会破坏用户体验与无障碍功能——这一点已在本次改动中明确排除。
