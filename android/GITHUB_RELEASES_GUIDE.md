# GitHub Releases 新手发布（推荐）

## 你只需要做一次的准备
1. 在 GitHub 新建仓库（建议公开仓库，便于手机直接访问更新清单）。
2. 把当前项目代码推到该仓库。

## 每次发版步骤
以下示例假设：
- GitHub 用户名：`yourname`
- 仓库名：`cloud-mist-book`
- 版本：`1.0.1`
- 版本号：`2`（必须递增）

### 第一步：本地生成发布文件
在 `F:\jizhang\android` 执行：

```powershell
.\prepare-github-release.ps1 -Owner yourname -Repo cloud-mist-book -VersionName 1.0.1 -VersionCode 2 -BuildApk
```

脚本会自动做三件事：
1. 生成直装 APK：`android\\release-artifacts\\v1.0.1\\app-direct-release.apk`
2. 生成更新清单：`android\\update-manifest.json`
3. 自动把 `android\\gradle.properties` 的 `UPDATE_MANIFEST_URL` 改成 GitHub Raw 地址。

### 第二步：把 update-manifest.json 提交到 GitHub
把 `android\\update-manifest.json` 提交并 push 到 `main` 分支。

### 第三步：创建 GitHub Release
1. 打开你的仓库页面 -> `Releases` -> `Draft a new release`
2. Tag 填：`v1.0.1`
3. Title 填：`v1.0.1`
4. 上传文件：`app-direct-release.apk`
5. 点击 `Publish release`

完成后，手机端打开 App 就会检测到新版本并提示更新。

## 常见坑
- `VersionCode` 必须一直变大（1,2,3...）。
- Release 的 Tag 必须和脚本生成的一致（默认 `v版本名`）。
- 仓库若是私有，手机可能访问不到 `raw.githubusercontent.com`。
