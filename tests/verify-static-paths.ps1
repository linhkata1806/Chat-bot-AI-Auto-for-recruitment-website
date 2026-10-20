$ErrorActionPreference = 'Stop'
$taskRoot = Split-Path -Parent $PSScriptRoot
$taskM2 = Join-Path $env:USERPROFILE '.m2/repository'
$taskJars = @()
foreach ($taskArtifact in @('spring-core','spring-beans','spring-context','spring-expression','spring-aop','spring-web','spring-webmvc','spring-test','spring-jcl')) {
  $taskJars += Join-Path $taskM2 "org/springframework/$taskArtifact/6.2.19/$taskArtifact-6.2.19.jar"
}
foreach ($taskArtifact in @('spring-boot','spring-boot-autoconfigure')) {
  $taskJars += Join-Path $taskM2 "org/springframework/boot/$taskArtifact/3.5.16/$taskArtifact-3.5.16.jar"
}
$taskJars += Join-Path $taskM2 'org/springframework/security/spring-security-web/6.5.11/spring-security-web-6.5.11.jar'
$taskJars += Join-Path $taskM2 'org/slf4j/slf4j-api/2.0.20/slf4j-api-2.0.20.jar'
$taskJars += Join-Path $taskM2 'jakarta/servlet/jakarta.servlet-api/6.0.0/jakarta.servlet-api-6.0.0.jar'
foreach ($taskJar in $taskJars) { if (-not (Test-Path -LiteralPath $taskJar)) { throw "Cached dependency missing: $taskJar" } }
$taskVendor = Join-Path $taskRoot 'integration/rms-overlay/src/main/resources/static/js/vendor/n8n-chat/1.42.6'
& java.exe --class-path ($taskJars -join ';') (Join-Path $PSScriptRoot 'StaticResourcePathsCheck.java') $taskVendor
if ($LASTEXITCODE -ne 0) { throw 'Static asset path check failed.' }
