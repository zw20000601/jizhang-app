# 长期稳定下载方案（推荐）

## 方案 A：对象存储 + CDN + 自定义域名（推荐）
可选平台：阿里云 OSS、腾讯云 COS、七牛云、Cloudflare R2、AWS S3。

建议固定两个地址：
- APK 下载地址：`https://download.your-domain.com/cloud-mist/app-direct-release.apk`
- 更新清单地址：`https://download.your-domain.com/cloud-mist/update-manifest.json`

优点：
- 链接长期稳定，可控；
- 可配 HTTPS、限速、防盗链、监控；
- 适合后续上架与官网并行发布。

## 方案 B：GitHub Releases（低成本）
- 适合个人/小团队；
- 地址稳定，但国内网络可能有波动。

## 直装渠道发布最小流程
1. 上传新 APK 到固定 URL（覆盖旧文件或版本化文件名）；
2. 更新 `update-manifest.json` 的 `versionCode/versionName/apkUrl/notes`；
3. 保证 `UPDATE_MANIFEST_URL` 指向该 JSON。

## update-manifest.json 参考
```json
{
  "versionCode": 2,
  "versionName": "1.0.1",
  "notes": "修复问题并优化体验",
  "apkUrl": "https://download.your-domain.com/cloud-mist/app-direct-release.apk",
  "force": false
}
```
