# Android 发布说明（长期稳定 + 可上架）

## 1. 渠道设计
项目已支持双渠道构建：

- `store`：应用商店渠道（推荐上架用）
: 默认关闭外部 APK 更新弹窗，走商店升级。
- `direct`：官网直装渠道
: 可启用 `UPDATE_MANIFEST_URL` 弹窗更新。

## 2. 一键打包 APK
在 `F:\jizhang\android` 目录执行：

```powershell
.\build-apk.ps1 -Flavor direct -BuildType debug
.\build-apk.ps1 -Flavor direct -BuildType release
.\build-apk.ps1 -Flavor store  -BuildType release
```

输出路径示例：
- `F:\jizhang\android\app\build\outputs\apk\direct\release\app-direct-release.apk`
- `F:\jizhang\android\app\build\outputs\apk\store\release\app-store-release.apk`

## 3. 一键打包 AAB（商店上架）

```powershell
.\build-aab.ps1 -Flavor store -BuildType release
```

输出路径：
- `F:\jizhang\android\app\build\outputs\bundle\storeRelease\app-store-release.aab`

## 4. 关键配置
编辑 `android\gradle.properties`：

```properties
APP_VERSION_CODE=1
APP_VERSION_NAME=1.0.0

# 可选：线上 Web 入口；留空则使用本地 assets
WEB_APP_URL=

# 仅 direct 渠道生效：外部更新清单地址
UPDATE_MANIFEST_URL=

# release 签名（商店必填）
RELEASE_STORE_FILE=
RELEASE_STORE_PASSWORD=
RELEASE_KEY_ALIAS=
RELEASE_KEY_PASSWORD=
```

## 5. 长期稳定发布建议

### 5.1 商店渠道（长期主线）
1. 只发布 `store` 的 `AAB` 到应用商店；
2. 每次发版递增 `APP_VERSION_CODE`；
3. 用户通过商店自动更新，最稳定。

### 5.2 官网直装渠道（补充）
1. 发布 `direct` 的 `APK` 到你自己的下载站；
2. 维护 `update-manifest.json`（见 `update-manifest.sample.json`）；
3. App 启动时会弹出新版本提示。

## 6. 注意事项（上架合规）
- 商店版建议不要引导站外 APK 覆盖安装；
- `store` 与 `direct` 已区分渠道，避免更新策略冲突。

## 7. GitHub Releases（小白推荐）
- 详细步骤见：[GITHUB_RELEASES_GUIDE.md](F:/jizhang/android/GITHUB_RELEASES_GUIDE.md)
- 自动生成发布文件脚本：
: `F:\jizhang\android\prepare-github-release.ps1`
