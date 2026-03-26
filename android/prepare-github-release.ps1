param(
  [Parameter(Mandatory = $true)]
  [string]$Owner,
  [Parameter(Mandatory = $true)]
  [string]$Repo,
  [Parameter(Mandatory = $true)]
  [string]$VersionName,
  [Parameter(Mandatory = $true)]
  [int]$VersionCode,
  [string]$Tag = "",
  [string]$Notes = "Fixes and improvements",
  [switch]$BuildApk
)

$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($Tag)) {
  $Tag = "v$VersionName"
}

$apkSigned = Join-Path $PSScriptRoot "app\\build\\outputs\\apk\\direct\\release\\app-direct-release.apk"
$apkUnsigned = Join-Path $PSScriptRoot "app\\build\\outputs\\apk\\direct\\release\\app-direct-release-unsigned.apk"
$apkPath = $apkSigned

if ($BuildApk -or ((-not (Test-Path $apkSigned)) -and (-not (Test-Path $apkUnsigned)))) {
  Write-Host "Building direct release APK..."
  & (Join-Path $PSScriptRoot "build-apk.ps1") -Flavor direct -BuildType release
}

if (Test-Path $apkSigned) {
  $apkPath = $apkSigned
} elseif (Test-Path $apkUnsigned) {
  $apkPath = $apkUnsigned
} else {
  throw "APK not found. Tried:`n$apkSigned`n$apkUnsigned"
}

$artifactDir = Join-Path $PSScriptRoot "release-artifacts\\$Tag"
New-Item -ItemType Directory -Force -Path $artifactDir | Out-Null
Copy-Item -Path $apkPath -Destination (Join-Path $artifactDir "app-direct-release.apk") -Force

$apkUrl = "https://github.com/$Owner/$Repo/releases/download/$Tag/app-direct-release.apk"
$manifestUrl = "https://raw.githubusercontent.com/$Owner/$Repo/main/android/update-manifest.json"

$manifestObj = [ordered]@{
  versionCode = $VersionCode
  versionName = $VersionName
  notes = $Notes
  apkUrl = $apkUrl
  force = $false
}
$manifestJson = ($manifestObj | ConvertTo-Json -Depth 3)
$manifestPath = Join-Path $PSScriptRoot "update-manifest.json"
[System.IO.File]::WriteAllText($manifestPath, $manifestJson, (New-Object System.Text.UTF8Encoding($false)))

$gradlePath = Join-Path $PSScriptRoot "gradle.properties"
$gradleText = Get-Content $gradlePath -Raw
$gradleText = [regex]::Replace($gradleText, "(?m)^APP_VERSION_CODE=.*$", "APP_VERSION_CODE=$VersionCode")
$gradleText = [regex]::Replace($gradleText, "(?m)^APP_VERSION_NAME=.*$", "APP_VERSION_NAME=$VersionName")
$gradleText = [regex]::Replace($gradleText, "(?m)^UPDATE_MANIFEST_URL=.*$", "UPDATE_MANIFEST_URL=$manifestUrl")
[System.IO.File]::WriteAllText($gradlePath, $gradleText, (New-Object System.Text.UTF8Encoding($false)))

Write-Host "Done."
Write-Host "1) APK file for upload: $artifactDir\\app-direct-release.apk"
Write-Host "2) Manifest file to commit: $manifestPath"
Write-Host "3) UPDATE_MANIFEST_URL set to: $manifestUrl"
Write-Host "4) Release tag to create on GitHub: $Tag"
Write-Host "5) Release asset url (will work after upload): $apkUrl"

