param(
  [ValidateSet("store", "direct")]
  [string]$Flavor = "direct",
  [ValidateSet("debug", "release")]
  [string]$BuildType = "debug"
)

$ErrorActionPreference = "Stop"

& (Join-Path $PSScriptRoot "sync-web-assets.ps1")

$possibleJdks = @(
  "C:\tools\jdk-17.0.18+8",
  "C:\tools\jdk-17",
  "E:\Java JDK 17"
)

$javaHome = $possibleJdks | Where-Object { Test-Path (Join-Path $_ "bin\java.exe") } | Select-Object -First 1
if (-not $javaHome) {
  throw "JDK 17 not found. Please install JDK 17 and set JAVA_HOME."
}

$env:JAVA_HOME = $javaHome
$env:ANDROID_HOME = "C:\Users\Administrator\AppData\Local\Android\Sdk"
$env:ANDROID_SDK_ROOT = $env:ANDROID_HOME

$flavorCap = $Flavor.Substring(0, 1).ToUpper() + $Flavor.Substring(1)
$buildTypeCap = $BuildType.Substring(0, 1).ToUpper() + $BuildType.Substring(1)
$variant = "{0}{1}" -f $flavorCap, $buildTypeCap
$task = "assemble$variant"
$localGradle = "C:\Users\Administrator\.gradle\wrapper\dists\gradle-8.14.3-bin\40dfek2kz346l18gf9ltjsnyd\gradle-8.14.3\bin\gradle.bat"

Push-Location $PSScriptRoot
try {
  if (Test-Path $localGradle) {
    & $localGradle -p . --no-daemon $task
  } elseif (Test-Path ".\gradlew.bat") {
    & .\gradlew.bat --no-daemon $task
  } else {
    throw "Gradle executable not found."
  }
}
finally {
  Pop-Location
}

$apkSigned = Join-Path $PSScriptRoot "app\build\outputs\apk\$Flavor\$BuildType\app-$Flavor-$BuildType.apk"
$apkUnsigned = Join-Path $PSScriptRoot "app\build\outputs\apk\$Flavor\$BuildType\app-$Flavor-$BuildType-unsigned.apk"
$apk = if (Test-Path $apkSigned) { $apkSigned } elseif (Test-Path $apkUnsigned) { $apkUnsigned } else { $apkSigned }
Write-Host "APK built: $apk"
