<#
  火烧云预报 —— 一键构建可安装 APK（无需 Android Studio / Gradle）

  用法（在本目录下）：
      powershell -ExecutionPolicy Bypass -File .\build_apk.ps1

  可选参数：
      -SdkRoot   Android SDK 目录（默认读取环境变量 ANDROID_SDK_ROOT，
                 再回退到 ..\..\.android-toolchain\sdk）
      -JdkHome   JDK 17 目录（默认读取 JAVA_HOME，再回退到 ..\..\.android-toolchain\jdk\...）
      -NoObfuscate   关闭 R8 混淆（仅用于排查问题）

  产物：out\SunsetForecast-v1.1-release.apk
#>
[CmdletBinding()]
param(
    [string]$SdkRoot   = "",
    [string]$JdkHome   = "",
    [switch]$NoObfuscate
)

$ErrorActionPreference = "Stop"
$ProgressPreference    = "SilentlyContinue"

# ---------------- 路径解析 ----------------
$ProjectRoot = $PSScriptRoot
$Parent      = Split-Path $ProjectRoot -Parent          # 存放 index.html / icon.png 的目录
# 工具链可能位于任意上级目录（v1.0 / v1.1 等子目录会改变相对深度），逐级向上查找
$Toolchain   = ""
$probe       = $Parent
for ($i = 0; $i -lt 4 -and $probe; $i++) {
    if (Test-Path (Join-Path $probe ".android-toolchain")) { $Toolchain = Join-Path $probe ".android-toolchain"; break }
    $probe = Split-Path $probe -Parent
}

if (-not $SdkRoot) {
    if ($env:ANDROID_SDK_ROOT) { $SdkRoot = $env:ANDROID_SDK_ROOT }
    elseif (Test-Path (Join-Path $Toolchain "sdk\platforms\android-34\android.jar")) { $SdkRoot = Join-Path $Toolchain "sdk" }
}
if (-not $JdkHome) {
    if ($env:JAVA_HOME) { $JdkHome = $env:JAVA_HOME }
    else {
        $cand = Get-ChildItem (Join-Path $Toolchain "jdk") -Directory -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($cand) { $JdkHome = $cand.FullName }
    }
}
if (-not $SdkRoot -or -not (Test-Path $SdkRoot)) { throw "Android SDK not found. Pass -SdkRoot or set ANDROID_SDK_ROOT." }
if (-not $JdkHome -or -not (Test-Path $JdkHome)) { throw "JDK 17 not found. Pass -JdkHome or set JAVA_HOME." }

$BuildTools = Join-Path $SdkRoot "build-tools\34.0.0"
$AndroidJar = Join-Path $SdkRoot "platforms\android-34\android.jar"
$JdkBin     = Join-Path $JdkHome "bin"
$env:JAVA_HOME = $JdkHome
$env:Path      = "$JdkBin;$env:Path"

$Aapt2     = Join-Path $BuildTools "aapt2.exe"
$Zipalign  = Join-Path $BuildTools "zipalign.exe"
$ApkSigner = Join-Path $BuildTools "apksigner.bat"
$D8Jar     = Join-Path $BuildTools "lib\d8.jar"
$R8Jar     = Join-Path $BuildTools "lib\r8.jar"

# Python（仅用于生成密钥 / 图标 / 组装 APK）
$Py = (Get-Command python -ErrorAction SilentlyContinue).Source
if (-not $Py) { $Py = Join-Path $env:LOCALAPPDATA "Microsoft\WindowsApps\python.exe" }
if (-not $Py -or -not (Test-Path $Py)) { throw "Python 3 not found. Install from https://www.python.org/downloads/ ." }

# ---------------- 关键路径 ----------------
$AppDir      = Join-Path $ProjectRoot "app"
$SrcDir      = Join-Path $AppDir "src\main"
$JavaDir     = Join-Path $SrcDir "java"
$ResDir      = Join-Path $SrcDir "res"
$AssetsDir   = Join-Path $SrcDir "assets"
$Manifest    = Join-Path $SrcDir "AndroidManifest.xml"
$VaultJava   = Join-Path $JavaDir "com\sunset\forecast\core\Vault.java"
$Proguard    = Join-Path $AppDir "proguard-rules.pro"
$SourceHtml  = Join-Path $Parent "index.html"
$IconSource  = Join-Path $Parent "icon.png"

$BuildDir    = Join-Path $ProjectRoot "build"
$OutDir      = Join-Path $ProjectRoot "out"
$KeystoreDir = Join-Path $ProjectRoot "keystore"
$Keystore    = Join-Path $KeystoreDir "sunset-release.keystore"
$StorePass   = "Sunset#2026"
$KeyAlias    = "sunsetkey"
$AppId       = "com.sunset.forecast"

$Utf8NoBom = New-Object System.Text.UTF8Encoding($false)

function Step($n) { Write-Host ""; Write-Host "==== $n ====" -ForegroundColor Cyan }
function Run([scriptblock]$b) { & $b; if ($LASTEXITCODE -ne 0) { throw "command failed, exit code $LASTEXITCODE" } }

if (-not (Test-Path $SourceHtml)) { throw "source page not found: $SourceHtml" }
if (-not (Test-Path $IconSource)) { throw "icon not found: $IconSource" }

Write-Host "SDK  : $SdkRoot"
Write-Host "JDK  : $JdkHome"
Write-Host "siyuan: $SourceHtml"

# ---------------- 清理 ----------------
foreach ($p in @($BuildDir, $OutDir)) { if (Test-Path $p) { Remove-Item $p -Recurse -Force } }
New-Item -ItemType Directory -Force -Path $BuildDir, $OutDir, $KeystoreDir, $AssetsDir,
    (Join-Path $BuildDir "packclasses"), (Join-Path $BuildDir "appclasses"), (Join-Path $BuildDir "dex") | Out-Null

# ---------------- 1. 生成密钥 ----------------
Step "1/8 generate protected key (Vault.java)"
Run { & $Py (Join-Path $ProjectRoot "tools\build_helpers.py") genkey $VaultJava }

# ---------------- 2. 加密页面资源 ----------------
Step "2/8 encrypt index.html -> assets/app.dat"
Run { & (Join-Path $JdkBin "javac.exe") -encoding UTF-8 -d (Join-Path $BuildDir "packclasses") $VaultJava (Join-Path $ProjectRoot "tools\Packer.java") }
Run { & (Join-Path $JdkBin "java.exe") -cp (Join-Path $BuildDir "packclasses") Packer $SourceHtml (Join-Path $AssetsDir "app.dat") }
# 网页图标（favicon）由虚拟域名在运行期回注，这里作为普通资产随包分发
Copy-Item $IconSource (Join-Path $AssetsDir "icon.png") -Force

# ---------------- 3. 生成图标 ----------------
Step "3/8 generate launcher icons from icon.png"
Run { & (Join-Path $JdkBin "java.exe") (Join-Path $ProjectRoot "tools\IconTool.java") $IconSource $ResDir }

# ---------------- 4. 编译资源并链接基础 APK ----------------
Step "4/8 aapt2 compile + link"
$manifestText = [System.IO.File]::ReadAllText($Manifest, $Utf8NoBom)
if ($manifestText -notmatch 'package=') {
    $manifestText = $manifestText -replace '(<manifest\s+xmlns:android="[^"]+")', ('$1 package="' + $AppId + '"')
    $tmpManifest = Join-Path $BuildDir "AndroidManifest.xml"
    [System.IO.File]::WriteAllText($tmpManifest, $manifestText, $Utf8NoBom)
    Write-Host "(added package attribute for CLI build; original manifest untouched)"
} else {
    $tmpManifest = $Manifest
}
Run { & $Aapt2 compile --dir $ResDir -o (Join-Path $BuildDir "res.zip") }
Run { & $Aapt2 link -o (Join-Path $BuildDir "base.apk") -I $AndroidJar --manifest $tmpManifest --auto-add-overlay -A $AssetsDir --min-sdk-version 21 --target-sdk-version 34 --version-code 2 --version-name 1.1 (Join-Path $BuildDir "res.zip") }

# ---------------- 5. 编译 Java ----------------
Step "5/8 compile java sources"
$javaFiles = Get-ChildItem $JavaDir -Recurse -Filter *.java | ForEach-Object { $_.FullName }
Run { & (Join-Path $JdkBin "javac.exe") -encoding UTF-8 -classpath $AndroidJar -d (Join-Path $BuildDir "appclasses") $javaFiles }

# ---------------- 6. R8 混淆 + 生成 dex ----------------
Step "6/8 R8 obfuscate / build classes.dex"
$classFiles = Get-ChildItem (Join-Path $BuildDir "appclasses") -Recurse -Filter *.class | ForEach-Object { $_.FullName }
$dexOut = Join-Path $BuildDir "dex"
if (-not $NoObfuscate) {
    $r8cp = if (Test-Path $R8Jar) { $R8Jar } else { $D8Jar }
    Run { & (Join-Path $JdkBin "java.exe") -cp $r8cp com.android.tools.r8.R8 --release --min-api 21 --lib $AndroidJar --output $dexOut --pg-conf $Proguard $classFiles }
} else {
    Run { & (Join-Path $JdkBin "java.exe") -cp $D8Jar com.android.tools.r8.D8 --release --min-api 21 --lib $AndroidJar --output $dexOut $classFiles }
}
if (-not (Test-Path (Join-Path $dexOut "classes.dex"))) { throw "classes.dex not produced" }

# ---------------- 7. 组装 / 对齐 ----------------
Step "7/8 inject dex + zipalign"
Run { & $Py (Join-Path $ProjectRoot "tools\build_helpers.py") adddex (Join-Path $BuildDir "base.apk") (Join-Path $dexOut "classes.dex") (Join-Path $BuildDir "unsigned.apk") }
Run { & $Zipalign -f -p 4 (Join-Path $BuildDir "unsigned.apk") (Join-Path $BuildDir "aligned.apk") }

# ---------------- 8. 签名 ----------------
Step "8/8 keystore + sign"
if (-not (Test-Path $Keystore)) {
    Run { & (Join-Path $JdkBin "keytool.exe") -genkeypair -v -keystore $Keystore -storepass $StorePass -keypass $StorePass -alias $KeyAlias -keyalg RSA -keysize 2048 -validity 10950 -dname "CN=Sunset Forecast,O=SunsetForecast,C=CN" }
}
$ApkOut = Join-Path $OutDir "SunsetForecast-v1.1-release.apk"
Run { & $ApkSigner sign --ks $Keystore --ks-pass "pass:$StorePass" --key-pass "pass:$StorePass" --ks-key-alias $KeyAlias --out $ApkOut (Join-Path $BuildDir "aligned.apk") }
Run { & $ApkSigner verify --print-certs $ApkOut }

Write-Host ""
Write-Host "BUILD OK -> $ApkOut" -ForegroundColor Green
Get-Item $ApkOut | Select-Object FullName, @{n='MB';e={[math]::Round($_.Length/1MB,2)}} | Format-Table -AutoSize | Out-String | Write-Host
