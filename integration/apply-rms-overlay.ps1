[CmdletBinding(SupportsShouldProcess)]
param(
  [string]$RmsRoot = (Join-Path (Split-Path -Parent $PSScriptRoot) '../SWP_RMS_Group-2')
)
$ErrorActionPreference = 'Stop'
$taskRmsRoot = (Resolve-Path -LiteralPath $RmsRoot).Path.TrimEnd('\', '/')
$taskOverlayRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot 'rms-overlay')).Path
$taskIntegrationRoot = $PSScriptRoot
$taskTopbarRelative = 'src/main/resources/templates/fragments/layout/public-topbar.html'
$taskTopbar = Join-Path $taskRmsRoot $taskTopbarRelative
$taskOriginal = [IO.File]::ReadAllText($taskTopbar)
$taskAnchor = '  <script defer th:src="@{/js/public-topbar.js}"></script>'
$taskInclude = '  <th:block th:replace="~{fragments/rms-chat :: chat}"></th:block>'
if (-not $taskOriginal.Contains($taskAnchor)) { throw 'The expected public-topbar insertion point changed. Review the source before applying.' }
$taskOverlayFiles = Get-ChildItem -LiteralPath $taskOverlayRoot -File -Recurse
$taskChanges = @()
foreach ($taskFile in $taskOverlayFiles) {
  $taskRelative = [IO.Path]::GetRelativePath($taskOverlayRoot, $taskFile.FullName)
  $taskTarget = [IO.Path]::GetFullPath((Join-Path $taskRmsRoot $taskRelative))
  if (-not $taskTarget.StartsWith($taskRmsRoot + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) {
    throw "Overlay path escaped RMS root: $taskRelative"
  }
  if (Test-Path -LiteralPath $taskTarget) {
    if ((Get-FileHash -LiteralPath $taskTarget).Hash -ne (Get-FileHash -LiteralPath $taskFile.FullName).Hash) {
      throw "Existing file differs; no overwrite was performed: $taskTarget"
    }
  }
  $taskChanges += [pscustomobject]@{ path = $taskRelative.Replace('\', '/'); source = $taskFile.FullName; target = $taskTarget; action = 'add'; sha256 = (Get-FileHash -LiteralPath $taskFile.FullName).Hash.ToLowerInvariant() }
}
if ($PSCmdlet.ShouldProcess($taskRmsRoot, 'Add the reviewed native n8n widget files and one shared public-topbar include')) {
  $taskBackupRoot = Join-Path (Split-Path -Parent $taskIntegrationRoot) '.runtime/backups'
  New-Item -ItemType Directory -Path $taskBackupRoot -Force | Out-Null
  $taskBackup = Join-Path $taskBackupRoot ('public-topbar-' + (Get-Date -Format 'yyyyMMdd-HHmmss') + '.html')
  Copy-Item -LiteralPath $taskTopbar -Destination $taskBackup
  foreach ($taskChange in $taskChanges) {
    New-Item -ItemType Directory -Path (Split-Path -Parent $taskChange.target) -Force | Out-Null
    Copy-Item -LiteralPath $taskChange.source -Destination $taskChange.target
  }
  if (-not $taskOriginal.Contains($taskInclude)) {
    $taskNewline = if ($taskOriginal.Contains("`r`n")) { "`r`n" } else { "`n" }
    $taskUpdated = $taskOriginal.Replace($taskAnchor, $taskAnchor + $taskNewline + $taskInclude)
    [IO.File]::WriteAllText($taskTopbar, $taskUpdated, [Text.UTF8Encoding]::new($false))
  }
  $taskManifest = [ordered]@{
    status = 'applied'
    rmsRoot = $taskRmsRoot
    sharedFile = $taskTopbarRelative
    sharedInclude = $taskInclude.Trim()
    widgetEnabledByDefault = $false
    files = @($taskChanges | Select-Object path, action, sha256)
  }
  [IO.File]::WriteAllText((Join-Path $taskIntegrationRoot 'rms-files-manifest.json'), ($taskManifest | ConvertTo-Json -Depth 6) + "`n", [Text.UTF8Encoding]::new($false))
  Write-Output "Applied $($taskChanges.Count) new widget assets and one additive shared include. Widget remains disabled until RMS_CHAT_ENABLED=true."
  Write-Output "Original shared file backup: $taskBackup"
}
