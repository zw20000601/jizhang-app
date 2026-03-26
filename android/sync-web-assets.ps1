param(
  [string]$SourceRoot = ".."
)

$ErrorActionPreference = "Stop"
$source = Resolve-Path $SourceRoot
$target = Join-Path $PSScriptRoot "app\src\main\assets\www"

New-Item -ItemType Directory -Force -Path $target | Out-Null
Copy-Item -Path (Join-Path $source "index.html") -Destination $target -Force
Copy-Item -Path (Join-Path $source "app.js") -Destination $target -Force
Copy-Item -Path (Join-Path $source "styles.css") -Destination $target -Force

Write-Host "Synced web assets to: $target"
